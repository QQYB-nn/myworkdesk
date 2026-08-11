/* ==========================================================================
   WorkTable API 层
   优先连接真实后端（多人共享数据）；未部署后端时自动回退到本地存储。
   ========================================================================== */
const API_BASE = ''; // 同源调用，部署后端时自动生效

/* ---------------- 远端实现（真实后端） ---------------- */
const Remote = {
  async request(method, path, body) {
    const token = localStorage.getItem('wt_token');
    const res = await fetch(API_BASE + '/api' + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401) { Auth.logout(true); throw new Error('登录已过期'); }
    const json = await res.json().catch(() => ({}));
    if (!json.ok) throw new Error(json.message || '请求失败');
    return json.data;
  },
  auth: {
    register: (b) => Remote.request('POST', '/auth/register', b),
    login: (b) => Remote.request('POST', '/auth/login', b),
    me: () => Remote.request('GET', '/auth/me'),
    profile: (b) => Remote.request('PATCH', '/auth/profile', b),
  },
  tasks: {
    list: () => Remote.request('GET', '/tasks'),
    create: (b) => Remote.request('POST', '/tasks', b),
    update: (id, b) => Remote.request('PATCH', '/tasks/' + id, b),
    remove: (id) => Remote.request('DELETE', '/tasks/' + id),
  },
  projects: {
    list: () => Remote.request('GET', '/projects'),
    create: (b) => Remote.request('POST', '/projects', b),
    update: (id, b) => Remote.request('PATCH', '/projects/' + id, b),
    remove: (id) => Remote.request('DELETE', '/projects/' + id),
  },
  notes: {
    list: () => Remote.request('GET', '/notes'),
    create: (b) => Remote.request('POST', '/notes', b),
    update: (id, b) => Remote.request('PATCH', '/notes/' + id, b),
    remove: (id) => Remote.request('DELETE', '/notes/' + id),
  },
  overview: () => Remote.request('GET', '/overview'),
  public: {
    announcements: () => Remote.request('GET', '/public/announcements'),
    stats: () => Remote.request('GET', '/public/stats'),
  },
  admin: {
    stats: () => Remote.request('GET', '/admin/stats'),
    users: () => Remote.request('GET', '/admin/users'),
    updateUser: (id, b) => Remote.request('PATCH', '/admin/users/' + id, b),
    deleteUser: (id) => Remote.request('DELETE', '/admin/users/' + id),
    tasks: () => Remote.request('GET', '/admin/tasks'),
    addAnnouncement: (b) => Remote.request('POST', '/admin/announcements', b),
    deleteAnnouncement: (id) => Remote.request('DELETE', '/admin/announcements/' + id),
  },
};

/* ---------------- 本地实现（无后端回退） ---------------- */
const Local = (() => {
  const K = {
    users: 'wt_users', tasks: 'wt_tasks', projects: 'wt_projects',
    notes: 'wt_notes', announces: 'wt_announces', me: 'wt_uid',
  };
  const get = (k, d) => JSON.parse(localStorage.getItem(k) || JSON.stringify(d));
  const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const uid = (p) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const now = () => new Date().toISOString();
  const clone = (x) => JSON.parse(JSON.stringify(x));

  return {
    mode: 'local',
    get, set,
    async auth_register(b) {
      const users = get(K.users, []);
      if (users.some((u) => u.username === b.username)) throw new Error('该用户名已被注册');
      if (users.some((u) => u.email === b.email)) throw new Error('该邮箱已被注册');
      const u = {
        id: uid('u'), username: b.username, name: b.name || b.username,
        email: b.email, password: b.password, role: users.length ? 'user' : 'admin',
        status: 'active', department: b.department || '未分配', createdAt: now(), lastLoginAt: now(),
      };
      users.push(u); set(K.users, users);
      delete u.password;
      set(K.me, u.id);
      return { token: 'local_' + u.id, user: u };
    },
    async auth_login(b) {
      const users = get(K.users, []);
      const u = users.find((x) =>
        (x.username === b.account || x.email === b.account) && x.password === b.password);
      if (!u) throw new Error('账号或密码错误');
      if (u.status !== 'active') throw new Error('账号已被停用');
      u.lastLoginAt = now(); set(K.users, users);
      delete u.password;
      set(K.me, u.id);
      return { token: 'local_' + u.id, user: u };
    },
    async auth_me() {
      const users = get(K.users, []);
      const u = users.find((x) => x.id === localStorage.getItem(K.me));
      if (!u) throw new Error('未登录');
      delete u.password;
      return { user: u };
    },
    async auth_profile(b) {
      const users = get(K.users, []);
      const u = users.find((x) => x.id === localStorage.getItem(K.me));
      if (b.name !== undefined) u.name = b.name;
      if (b.department !== undefined) u.department = b.department;
      if (b.newPassword) { if (u.password !== b.oldPassword) throw new Error('原密码不正确'); u.password = b.newPassword; }
      set(K.users, users);
      const out = clone(u); delete out.password;
      return { user: out };
    },
    crud(name, key, prefix) {
      return {
        list: async () => clone(get(key, []).filter((x) => x.ownerId === localStorage.getItem(K.me))),
        create: async (b) => {
          const arr = get(key, []); const now2 = now();
          const item = { id: uid(prefix), ownerId: localStorage.getItem(K.me), createdAt: now2, updatedAt: now2, ...b };
          arr.unshift(item); set(key, arr); return clone(item);
        },
        update: async (id, b) => {
          const arr = get(key, []); const i = arr.findIndex((x) => x.id === id);
          if (i < 0) throw new Error('记录不存在');
          arr[i] = { ...arr[i], ...b, updatedAt: now2() }; set(key, arr); return clone(arr[i]);
        },
        remove: async (id) => {
          set(key, get(key, []).filter((x) => x.id !== id)); return { id };
        },
      };
    },
    async overview() {
      const mine = get(K.tasks, []).filter((x) => x.ownerId === localStorage.getItem(K.me));
      const today = now().slice(0, 10);
      return {
        total: mine.length,
        todo: mine.filter((t) => t.status === 'todo').length,
        doing: mine.filter((t) => t.status === 'doing').length,
        done: mine.filter((t) => t.status === 'done').length,
        overdue: mine.filter((t) => t.status !== 'done' && t.dueDate && t.dueDate < today).length,
        projects: get(K.projects, []).filter((x) => x.ownerId === localStorage.getItem(K.me)).length,
        notes: get(K.notes, []).filter((x) => x.ownerId === localStorage.getItem(K.me)).length,
        announcements: get(K.announces, []).slice(0, 5),
        recent: mine.slice(0, 6),
      };
    },
    async public_announcements() { return clone(get(K.announces, [])); },
    async public_stats() {
      return {
        users: get(K.users, []).length, tasks: get(K.tasks, []).length,
        done: get(K.tasks, []).filter((t) => t.status === 'done').length,
        projects: get(K.projects, []).length,
      };
    },
    addAnnouncement: async (b) => {
      const arr = get(K.announces, []);
      const item = {
        id: 'a_' + Date.now().toString(36), title: b.title,
        content: b.content || '', level: b.level || 'info',
        authorName: '我', createdAt: new Date().toISOString(),
      };
      arr.unshift(item); set(K.announces, arr); return item;
    },
    deleteAnnouncement: async (id) => {
      set(K.announces, get(K.announces, []).filter((a) => a.id !== id));
      return { id };
    },
  };
})();

/* ---------------- 适配器：自动探测后端 ---------------- */
const API = {
  mode: 'checking',
  async init() {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 900);
      const res = await fetch(API_BASE + '/api/health', { signal: ctrl.signal });
      clearTimeout(t);
      const json = await res.json();
      if (json.ok || json.status === 'up') { this.mode = 'remote'; this.backend = Remote; return; }
      throw new Error('bad');
    } catch {
      this.mode = 'local';
      this.backend = {
        ...Local,
        tasks: Local.crud('tasks', 'wt_tasks', 't'),
        projects: Local.crud('projects', 'wt_projects', 'p'),
        notes: Local.crud('notes', 'wt_notes', 'n'),
        public: { announcements: Local.public_announcements, stats: Local.public_stats },
        admin: {
          stats: async () => ({ users: 0, activeUsers: 0, tasks: 0, doneTasks: 0, projects: 0, notes: 0, announcements: 0, signupTrend: [], logs: [] }),
          users: async () => [],
          tasks: async () => [],
          updateUser: async () => ({}),
          deleteUser: async () => ({}),
          addAnnouncement: Local.addAnnouncement,
          deleteAnnouncement: Local.deleteAnnouncement,
        },
      };
    }
  },
};
