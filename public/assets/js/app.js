/* ==========================================================================
   WorkTable 工作台 — 应用主逻辑
   ========================================================================== */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pick = (arr, n) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };

const ICON = {
  dashboard: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',
  tasks: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  board: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18"/></svg>',
  projects: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-7l-2-2H5a2 2 0 0 0-2 2z"/></svg>',
  notes: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8M8 9h2"/></svg>',
  admin: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  user: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  plus: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  search: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
  bell: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
  menu: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>',
  close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  edit: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>',
  trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>',
  clock: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  pin: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5M9 10.8V4h6v6.8l2 2.2H7z"/></svg>',
  check: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
  info: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></svg>',
};

const STATUS = {
  todo: { label: '待办', tag: 'tag-gray', color: '#94a3b8' },
  doing: { label: '进行中', tag: 'tag-blue', color: '#2563eb' },
  paused: { label: '已暂停', tag: 'tag-amber', color: '#d97706' },
  done: { label: '已完成', tag: 'tag-green', color: '#16a34a' },
};
const PRIORITY = {
  low: { label: '低', tag: 'tag-gray' },
  medium: { label: '中', tag: 'tag-blue' },
  high: { label: '高', tag: 'tag-red' },
};
const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => (d ? String(d).slice(0, 10) : '');
const isLate = (t) => t.status !== 'done' && t.dueDate && t.dueDate < today();
const initials = (name) => (name || '?').trim().slice(0, 1).toUpperCase();

/* ------------------------- 状态 ------------------------- */
const State = {
  user: null,
  tasks: [], projects: [], notes: [], announcements: [],
  view: 'dashboard', boardFilter: 'all', taskSearch: '', boardMode: 'board',
};

/* ------------------------- Toast ------------------------- */
function toast(msg, type = 'success') {
  const colors = { success: '#16a34a', error: '#dc2626', info: '#4f46e5' };
  const icon = type === 'success' ? ICON.check : type === 'error' ? '!' : ICON.info;
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span class="toast-ico" style="background:${colors[type] || colors.info}">${icon}</span><span>${esc(msg)}</span>`;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 250); }, 2600);
}

/* ------------------------- Modal ------------------------- */
function openModal({ title, body, foot, onMount }) {
  const ov = $('#overlay');
  ov.innerHTML = `
    <div class="modal" role="dialog">
      <div class="modal-head"><h3>${esc(title)}</h3><button class="icon-btn close" data-close>${ICON.close}</button></div>
      <div class="modal-body">${body}</div>
      <div class="modal-foot">${foot || '<button class="btn btn-ghost" data-close>关闭</button>'}</div>
    </div>`;
  ov.classList.add('on');
  ov.onclick = (e) => { if (e.target === ov || e.target.closest('[data-close]')) closeModal(); };
  if (onMount) onMount(ov);
  return ov;
}
function closeModal() { $('#overlay').classList.remove('on'); $('#overlay').innerHTML = ''; }

async function confirmModal(title, message, danger = true) {
  return new Promise((resolve) => {
    openModal({
      title,
      body: `<p style="color:var(--text-2);font-size:13.5px;line-height:1.7">${esc(message)}</p>`,
      foot: `<button class="btn btn-ghost" data-close>取消</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="cf-ok">确定</button>`,
      onMount: (ov) => $('#cf-ok', ov).onclick = () => { closeModal(); resolve(true); },
    });
    // 点关闭 = 取消
    $('#overlay').addEventListener('click', function h(e) {
      if (e.target.closest('[data-close]')) { resolve(false); $('#overlay').removeEventListener('click', h); }
    }, { once: true });
  });
}

/* ==========================================================================
   数据层
   ========================================================================== */
async function refreshAll() {
  const [tasks, projects, notes] = await Promise.all([
    API.backend.tasks.list(), API.backend.projects.list(), API.backend.notes.list(),
  ]).catch(async () => [[], [], []);
  State.tasks = tasks; State.projects = projects; State.notes = notes;
}

/* ==========================================================================
   路由
   ========================================================================== */
const ROUTES = {
  dashboard: { title: '工作台概览', crumb: '首页', icon: ICON.dashboard, render: renderDashboard },
  board: { title: '工作看板', crumb: '工作管理', icon: ICON.board, render: renderBoard },
  projects: { title: '项目管理', crumb: '工作管理', icon: ICON.projects, render: renderProjects },
  notes: { title: '知识笔记', crumb: '工作管理', icon: ICON.notes, render: renderNotes },
  admin: { title: '后台管理', crumb: '系统', icon: ICON.admin, render: renderAdmin },
};

function navigate(view) {
  if (view === 'admin' && State.user.role !== 'admin') return;
  State.view = view;
  $$('.sb-item').forEach((b) => b.classList.toggle('on', b.dataset.view === view));
  const r = ROUTES[view];
  $('#page-title').textContent = r.title;
  $('#page-crumb').textContent = r.crumb;
  r.render($('#page'));
  $('#sidebar').classList.remove('open');
}

/* ==========================================================================
   视图：仪表盘
   ========================================================================== */
async function renderDashboard(root) {
  let ov;
  try { ov = await API.backend.overview(); } catch { ov = null; }
  if (!ov) { ov = { total: State.tasks.length, todo: 0, doing: 0, done: 0, overdue: 0, projects: State.projects.length, notes: State.notes.length, announcements: [], recent: State.tasks.slice(0, 6) }; }

  const pct = ov.total ? Math.round((ov.done / ov.total) * 100) : 0;
  const stat = (label, val, sub, color, ico) => `
    <div class="stat">
      <div class="stat-top"><span class="stat-label">${label}</span>
        <span class="stat-ico" style="background:${color}1a;color:${color}">${ico}</span></div>
      <div class="stat-val">${val}</div><div class="stat-sub">${sub}</div>
    </div>`;

  const total = ov.total || State.tasks.length;
  const done = ov.done || 0;
  const recent = (ov.recent && ov.recent.length) ? ov.recent : State.tasks.slice(0, 6);

  root.innerHTML = `
    <div class="stats">
      ${stat('我的任务', total, `已完成 ${done} 项`, '#4f46e5', ICON.tasks)}
      ${stat('进行中', ov.doing || 0, '正在推进的工作', '#2563eb', ICON.board)}
      ${stat('待处理', ov.todo || 0, '等待开始', '#d97706', ICON.clock)}
      ${stat('已逾期', ov.overdue || 0, '需尽快处理', '#dc2626', ICON.bell)}
    </div>

    <div class="grid-2">
      <div class="panel">
        <div class="panel-head"><h3>完成进度</h3><span class="spacer"></span>
          <span class="tag tag-green">${pct}%</span></div>
        <div class="panel-body">
          <div class="bar"><i style="width:${pct}%"></i></div>
          <div style="height:18px"></div>
          <div class="legend">
            <div class="legend-row"><span class="legend-dot" style="background:#94a3b8"></span>待办
              <span class="n">${ov.todo || 0}</span></div>
            <div class="legend-row"><span class="legend-dot" style="background:#2563eb"></span>进行中
              <span class="n">${ov.doing || 0}</span></div>
            <div class="legend-row"><span class="legend-dot" style="background:#16a34a"></span>已完成
              <span class="n">${ov.done || 0}</span></div>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head"><h3>最新公告</h3><span class="spacer"></span></div>
        <div class="panel-body">
          ${(ov.announcements && ov.announcements.length) ? ov.announcements.map((a) => `
            <div class="notice">
              <span class="notice-ico ${a.level === 'warn' ? 'tag-amber' : 'tag-blue'}" style="background:${a.level === 'warn' ? 'var(--amber-bg)' : 'var(--blue-bg)'};color:${a.level === 'warn' ? 'var(--amber)' : 'var(--blue)'}">${ICON.info}</span>
              <div><b>${esc(a.title)}</b><p>${esc(a.content)}</p>
                <time>${fmtDate(a.createdAt)} · ${esc(a.authorName || '')}</time></div>
            </div>`).join('') : '<div class="empty"><p>暂无公告</p></div>'}
        </div>
      </div>
    </div>

    <div class="panel" style="margin-top:16px">
      <div class="panel-head"><h3>最近工作</h3><span class="spacer"></span>
        <button class="btn btn-soft btn-sm" onclick="navigate('board')">查看看板 ${ICON.board}</button></div>
      <div class="panel-body flush">
        ${recent.length ? `<div class="tlist">${recent.map(tRow).join('')}</div>` : '<div class="empty"><p>还没有工作内容，去新建一个吧</p></div>'}
      </div>
    </div>`;
}

/* 任务行（列表） */
function tRow(t) {
  const st = STATUS[t.status] || STATUS.todo;
  return `
    <div class="trow" data-id="${t.id}">
      <div class="check ${t.status === 'done' ? 'on' : ''}" data-act="toggle">${t.status === 'done' ? ICON.check : ''}</div>
      <div class="trow-main ${t.status === 'done' ? 'done' : ''}">
        <b>${esc(t.title)}</b>
        <span>${esc(t.description || '无描述')} · ${st.label}${t.dueDate ? ' · 截止 ' + fmtDate(t.dueDate) : ''}</span>
      </div>
      <span class="tag ${PRIORITY[t.priority]?.tag || 'tag-gray'}">${PRIORITY[t.priority]?.label || '中'}</span>
      <div class="row-acts">
        <button class="mini-btn" data-act="edit" title="编辑">${ICON.edit}</button>
        <button class="mini-btn danger" data-act="del" title="删除">${ICON.trash}</button>
      </div>
    </div>`;
}

/* ==========================================================================
   视图：工作看板
   ========================================================================== */
function renderBoard(root) {
  const cols = ['todo', 'doing', 'done'];
  const order = { todo: 0, doing: 1, paused: 1, done: 2 };
  const filtered = State.tasks.filter((t) => {
    if (State.boardFilter !== 'all' && t.status !== State.boardFilter) return false;
    if (State.taskSearch && !(t.title + (t.description || '')).toLowerCase().includes(State.taskSearch.toLowerCase())) return false;
    return true;
  });

  root.innerHTML = `
    <div class="toolbar">
      <div class="search-box">${ICON.search}<input class="input" id="tk-search" placeholder="搜索任务…" value="${esc(State.taskSearch)}"></div>
      <div class="seg" id="tk-seg">
        <button data-f="all" class="${State.boardFilter === 'all' ? 'on' : ''}">全部</button>
        <button data-f="todo" class="${State.boardFilter === 'todo' ? 'on' : ''}">待办</button>
        <button data-f="doing" class="${State.boardFilter === 'doing' ? 'on' : ''}">进行中</button>
        <button data-f="done" class="${State.boardFilter === 'done' ? 'on' : ''}">已完成</button>
      </div>
      <span class="spacer" style="flex:1"></span>
      <button class="btn btn-primary" id="tk-new">${ICON.plus} 新建任务</button>
    </div>
    <div class="board" id="board">
      ${cols.map((c) => {
        const items = filtered.filter((t) => t.status === c).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
        const st = STATUS[c];
        return `
        <div class="col" data-status="${c}">
          <div class="col-head"><span class="col-dot" style="background:${st.color}"></span>
            <b>${st.label}</b><span class="col-count">${items.length}</span></div>
          ${items.map(tCard).join('') || '<div style="text-align:center;color:var(--text-3);font-size:12.5px;padding:18px">暂无任务</div>'}
        </div>`;
      }).join('')}
    </div>`;

  // 交互
  $('#tk-search', root).oninput = (e) => { State.taskSearch = e.target.value; renderBoard(root); };
  $('#tk-seg', root).onclick = (e) => {
    const b = e.target.closest('button[data-f]'); if (!b) return;
    State.boardFilter = b.dataset.f; renderBoard(root);
  };
  $('#tk-new', root).onclick = () => taskModal();
  bindDragAndTask(root);
}

function tCard(t) {
  const st = STATUS[t.status] || STATUS.todo;
  const pr = PRIORITY[t.priority] || PRIORITY.medium;
  return `
    <div class="tcard" draggable="true" data-id="${t.id}">
      <div class="tcard-top"><h4>${esc(t.title)}</h4>
        <span class="tag ${pr.tag}">${pr.label}</span></div>
      ${t.description ? `<p>${esc(t.description)}</p>` : ''}
      <div class="tcard-foot">
        ${t.dueDate ? `<span class="due ${isLate(t) ? 'late' : ''}">${ICON.clock}${fmtDate(t.dueDate)}</span>` : '<span></span>'}
        <div class="tcard-act">
          <button class="mini-btn" data-act="edit" title="编辑">${ICON.edit}</button>
          <button class="mini-btn danger" data-act="del" title="删除">${ICON.trash}</button>
        </div>
      </div>
    </div>`;
}

function bindDragAndTask(root) {
  $$('.tcard', root).forEach((c) => {
    c.ondragstart = (e) => { e.dataTransfer.setData('id', c.dataset.id); c.classList.add('dragging'); };
    c.ondragend = () => c.classList.remove('dragging');
    c.querySelector('[data-act="edit"]').onclick = (e) => { e.stopPropagation(); taskModal(c.dataset.id); };
    c.querySelector('[data-act="del"]').onclick = (e) => { e.stopPropagation(); delTask(c.dataset.id); };
  });
  $$('.trow', root).forEach((r) => {
    r.querySelector('[data-act="edit"]').onclick = () => taskModal(r.dataset.id);
    r.querySelector('[data-act="del"]').onclick = () => delTask(r.dataset.id);
    const tg = r.querySelector('[data-act="toggle"]');
    if (tg) tg.onclick = () => toggleTask(r.dataset.id);
  });
  $$('.col', root).forEach((col) => {
    col.ondragover = (e) => { e.preventDefault(); col.classList.add('over'); };
    col.ondragleave = () => col.classList.remove('over');
    col.ondrop = async (e) => {
      e.preventDefault(); col.classList.remove('over');
      const id = e.dataTransfer.getData('id'); if (!id) return;
      const t = State.tasks.find((x) => x.id === id); if (!t || t.status === col.dataset.status) return;
      await API.backend.tasks.update(id, { status: col.dataset.status });
      t.status = col.dataset.status; toast('状态已更新');
      renderBoard(root);
    };
  });
}

async function toggleTask(id) {
  const t = State.tasks.find((x) => x.id === id); if (!t) return;
  const next = t.status === 'done' ? 'todo' : 'done';
  try { await API.backend.tasks.update(id, { status: next }); t.status = next; renderBoard($('#page')); }
  catch (e) { toast(e.message, 'error'); }
}

async function delTask(id) {
  if (!(await confirmModal('删除任务', '确定要删除该任务吗？此操作不可恢复。'))) return;
  try { await API.backend.tasks.remove(id); State.tasks = State.tasks.filter((t) => t.id !== id); toast('已删除'); renderBoard($('#page')); }
  catch (e) { toast(e.message, 'error'); }
}

/* ==========================================================================
   任务弹窗（新建 / 编辑）
   ========================================================================== */
function taskModal(id) {
  const t = id ? State.tasks.find((x) => x.id === id) : null;
  const projOptions = ['<option value="">无项目</option>']
    .concat(State.projects.map((p) => `<option value="${p.id}" ${t && t.projectId === p.id ? 'selected' : ''}>${esc(p.name)}</option>`)).join('');
  openModal({
    title: t ? '编辑任务' : '新建任务',
    body: `
      <div class="field"><label>标题 *</label><input class="input" id="tk-title" placeholder="任务标题" value="${esc(t?.title || '')}"></div>
      <div class="field"><label>描述</label><textarea class="textarea" id="tk-desc" placeholder="补充说明（可选）">${esc(t?.description || '')}</textarea></div>
      <div class="form-row">
        <div class="field"><label>状态</label><select class="select" id="tk-status">
          ${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${t?.status === k || (!t && k === 'todo') ? 'selected' : ''}>${v.label}</option>`).join('')}
        </select></div>
        <div class="field"><label>优先级</label><select class="select" id="tk-prio">
          ${Object.entries(PRIORITY).map(([k, v]) => `<option value="${k}" ${t?.priority === k || (!t && k === 'medium') ? 'selected' : ''}>${v.label}</option>`).join('')}
        </select></div>
      </div>
      <div class="form-row">
        <div class="field"><label>所属项目</label><select class="select" id="tk-proj">${projOptions}</select></div>
        <div class="field"><label>截止日期</label><input class="input" type="date" id="tk-due" value="${esc(t?.dueDate || '')}"></div>
      </div>`,
    foot: `<button class="btn btn-ghost" data-close>取消</button><button class="btn btn-primary" id="tk-save">${t ? '保存' : '创建'}</button>`,
    onMount: (ov) => {
      const save = async () => {
        const title = $('#tk-title', ov).value.trim();
        if (!title) { toast('请填写标题', 'error'); return; }
        const payload = {
          title, description: $('#tk-desc', ov).value.trim(),
          status: $('#tk-status', ov).value, priority: $('#tk-prio', ov).value,
          projectId: $('#tk-proj', ov).value || null, dueDate: $('#tk-due', ov).value || null,
        };
        try {
          if (t) { const u = await API.backend.tasks.update(t.id, payload); Object.assign(t, u); toast('已保存'); }
          else { const n = await API.backend.tasks.create(payload); State.tasks.unshift(n); toast('已创建'); }
          closeModal(); renderBoard($('#page'));
        } catch (e) { toast(e.message, 'error'); }
      };
      $('#tk-save', ov).onclick = save;
    },
  });
}

/* ==========================================================================
   视图：项目
   ========================================================================== */
function renderProjects(root) {
  root.innerHTML = `
    <div class="page-head">
      <div><h2>项目管理</h2><p>把任务归类到不同项目，清晰掌控每条业务线</p></div>
      <span class="spacer"></span><button class="btn btn-primary" id="pr-new">${ICON.plus} 新建项目</button>
    </div>
    ${State.projects.length ? `<div class="cards">${State.projects.map(pCard).join('')}</div>`
      : '<div class="empty"><h4>还没有项目</h4><p>创建一个项目来组织你的工作吧</p></div>'}`;
  $('#pr-new', root).onclick = () => projectModal();
  $$('.pcard', root).forEach((c) => {
    c.querySelector('[data-act="edit"]').onclick = () => projectModal(c.dataset.id);
    c.querySelector('[data-act="del"]').onclick = () => delProject(c.dataset.id);
  });
}

function pCard(p) {
  const count = State.tasks.filter((t) => t.projectId === p.id).length;
  const color = p.color || '#4f46e5';
  return `
    <div class="pcard" data-id="${p.id}" style="--brand:${color}">
      <div class="pcard-head">
        <span class="pcard-ico" style="background:${color}">${esc(initials(p.name))}</span>
        <div><h4>${esc(p.name)}</h4>
          <span class="tag ${p.status === 'active' ? 'tag-green' : 'tag-gray'}">${p.status === 'active' ? '进行中' : '已归档'}</span></div>
      </div>
      <div class="desc">${esc(p.description || '暂无描述')}</div>
      <div class="pcard-foot">
        <span style="font-size:12.5px;color:var(--text-3)">${count} 个任务</span>
        <span class="spacer" style="flex:1"></span>
        <button class="mini-btn" data-act="edit" title="编辑">${ICON.edit}</button>
        <button class="mini-btn danger" data-act="del" title="删除">${ICON.trash}</button>
      </div>
    </div>`;
}

function projectModal(id) {
  const p = id ? State.projects.find((x) => x.id === id) : null;
  const palette = ['#4f46e5', '#7c3aed', '#0ea5e9', '#16a34a', '#d97706', '#db2777', '#dc2626', '#0891b2'];
  openModal({
    title: p ? '编辑项目' : '新建项目',
    body: `
      <div class="field"><label>项目名称 *</label><input class="input" id="pr-name" value="${esc(p?.name || '')}" placeholder="如：Q3 产品迭代"></div>
      <div class="field"><label>描述</label><textarea class="textarea" id="pr-desc" placeholder="项目简介">${esc(p?.description || '')}</textarea></div>
      <div class="field"><label>颜色标识</label>
        <div id="pr-colors" style="display:flex;gap:9px;flex-wrap:wrap">
          ${palette.map((c) => `<span data-c="${c}" style="width:26px;height:26px;border-radius:8px;cursor:pointer;background:${c};${(!p && c === '#4f46e5') || p?.color === c ? 'box-shadow:0 0 0 3px rgba(0,0,0,.12),0 0 0 5px ' + c : ''}"></span>`).join('')}
        </div>
        <input type="hidden" id="pr-color" value="${esc(p?.color || '#4f46e5')}">
      </div>
      <div class="field"><label>状态</label><select class="select" id="pr-status">
        <option value="active" ${p?.status !== 'archived' ? 'selected' : ''}>进行中</option>
        <option value="archived" ${p?.status === 'archived' ? 'selected' : ''}>已归档</option>
      </select></div>`,
    foot: `<button class="btn btn-ghost" data-close>取消</button><button class="btn btn-primary" id="pr-save">${p ? '保存' : '创建'}</button>`,
    onMount: (ov) => {
      $$('#pr-colors span', ov).forEach((s) => s.onclick = () => {
        $('#pr-color', ov).value = s.dataset.c;
        $$('#pr-colors span', ov).forEach((x) => x.style.boxShadow = 'none');
        s.style.boxShadow = `0 0 0 3px rgba(0,0,0,.12),0 0 0 5px ${s.dataset.c}`;
      });
      $('#pr-save', ov).onclick = async () => {
        const name = $('#pr-name', ov).value.trim();
        if (!name) { toast('请填写名称', 'error'); return; }
        const payload = { name, description: $('#pr-desc', ov).value.trim(), color: $('#pr-color', ov).value, status: $('#pr-status', ov).value };
        try {
          if (p) { const u = await API.backend.projects.update(p.id, payload); Object.assign(p, u); toast('已保存'); }
          else { const n = await API.backend.projects.create(payload); State.projects.unshift(n); toast('已创建'); }
          closeModal(); renderProjects($('#page'));
        } catch (e) { toast(e.message, 'error'); }
      };
    },
  });
}

async function delProject(id) {
  if (!(await confirmModal('删除项目', '确定删除该项目吗？项目下的任务不会被删除，但会解除归属。'))) return;
  try { await API.backend.projects.remove(id); State.projects = State.projects.filter((p) => p.id !== id); toast('已删除'); renderProjects($('#page')); }
  catch (e) { toast(e.message, 'error'); }
}

/* ==========================================================================
   视图：笔记
   ========================================================================== */
function renderNotes(root) {
  root.innerHTML = `
    <div class="page-head">
      <div><h2>知识笔记</h2><p>沉淀工作文档、会议纪要与方法论</p></div>
      <span class="spacer"></span><button class="btn btn-primary" id="nt-new">${ICON.plus} 新建笔记</button>
    </div>
    ${State.notes.length ? `<div class="cards">${State.notes.map(nCard).join('')}</div>`
      : '<div class="empty"><h4>还没有笔记</h4><p>记录第一个工作灵感</p></div>'}`;
  $('#nt-new', root).onclick = () => noteModal();
  $$('.ncard', root).forEach((c) => {
    c.onclick = () => noteModal(c.dataset.id);
  });
}

function nCard(n) {
  return `
    <div class="ncard" data-id="${n.id}">
      <h4>${n.pinned ? ICON.pin : ''} ${esc(n.title)}</h4>
      <div class="body">${esc(n.content || '暂无内容')}</div>
      <div class="meta">${fmtDate(n.updatedAt || n.createdAt)} 更新</div>
    </div>`;
}

function noteModal(id) {
  const n = id ? State.notes.find((x) => x.id === id) : null;
  openModal({
    title: n ? '编辑笔记' : '新建笔记',
    body: `
      <div class="field"><label>标题 *</label><input class="input" id="nt-title" value="${esc(n?.title || '')}" placeholder="笔记标题"></div>
      <div class="field"><label>内容</label><textarea class="textarea" id="nt-content" style="min-height:180px" placeholder="在这里记录…">${esc(n?.content || '')}</textarea></div>
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-2)">
        <input type="checkbox" id="nt-pin" ${n?.pinned ? 'checked' : ''} style="width:16px;height:16px"> 置顶此笔记</label>`,
    foot: `<button class="btn btn-ghost" data-close>取消</button>${n ? '<button class="btn btn-danger" id="nt-del">删除</button>' : ''}<button class="btn btn-primary" id="nt-save">${n ? '保存' : '创建'}</button>`,
    onMount: (ov) => {
      $('#nt-save', ov).onclick = async () => {
        const title = $('#nt-title', ov).value.trim();
        if (!title) { toast('请填写标题', 'error'); return; }
        const payload = { title, content: $('#nt-content', ov).value, pinned: $('#nt-pin', ov).checked };
        try {
          if (n) { const u = await API.backend.notes.update(n.id, payload); Object.assign(n, u); toast('已保存'); }
          else { const c = await API.backend.notes.create(payload); State.notes.unshift(c); toast('已创建'); }
          closeModal(); renderNotes($('#page'));
        } catch (e) { toast(e.message, 'error'); }
      };
      const del = $('#nt-del', ov);
      if (del) del.onclick = async () => { if (!(await confirmModal('删除笔记', '确定删除该笔记？'))) return; try { await API.backend.notes.remove(n.id); State.notes = State.notes.filter((x) => x.id !== n.id); closeModal(); renderNotes($('#page')); } catch (e) { toast(e.message, 'error'); } };
    },
  });
}

/* ==========================================================================
   视图：后台管理
   ========================================================================== */
async function renderAdmin(root) {
  let stats, users, tasks;
  try { [stats, users, tasks] = await Promise.all([API.backend.admin.stats(), API.backend.admin.users(), API.backend.admin.tasks()]); }
  catch { stats = null; users = []; tasks = []; }
  if (!stats) stats = { users: 0, activeUsers: 0, tasks: 0, doneTasks: 0, projects: 0, notes: 0, announcements: 0, signupTrend: [], logs: [] };

  const trend = (stats.signupTrend || []).slice(-14);
  const maxT = Math.max(1, ...trend.map(([, v]) => v));

  root.innerHTML = `
    <div class="stats">
      ${statCard('注册用户', stats.users, `活跃 ${stats.activeUsers || 0}`, '#4f46e5', ICON.user)}
      ${statCard('任务总数', stats.tasks, `已完成 ${stats.doneTasks || 0}`, '#2563eb', ICON.tasks)}
      ${statCard('项目数', stats.projects, '', '#7c3aed', ICON.projects)}
      ${statCard('公告数', stats.announcements, '', '#d97706', ICON.bell)}
    </div>

    <div class="grid-2">
      <div class="panel">
        <div class="panel-head"><h3>成员注册趋势</h3></div>
        <div class="panel-body">
          <div class="chart">
            ${trend.length ? trend.map(([d, v]) => `
              <div class="chart-col"><div class="chart-bar" style="height:${Math.round((v / maxT) * 100)}%" title="${d}: ${v}"></div>
              <span class="chart-x">${d.slice(5)}</span></div>`).join('')
              : '<div class="empty"><p>暂无数据</p></div>'}
          </div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-head"><h3>最近操作日志</h3></div>
        <div class="panel-body"><div class="timeline">
          ${(stats.logs || []).length ? stats.logs.map((l) => `
            <div class="tl-item"><span class="tl-dot"></span>
              <div class="tl-body"><b>${esc(l.action)}</b><span>${esc(l.detail || '')} · ${fmtDate(l.createdAt)}</span></div></div>`).join('')
            : '<div class="empty"><p>暂无日志</p></div>'}
        </div></div>
      </div>
    </div>

    <div class="panel" style="margin-top:16px">
      <div class="panel-head"><h3>发布公告</h3></div>
      <div class="panel-body">
        <div class="form-row" style="align-items:flex-end">
          <div class="field" style="flex:1"><label>标题</label><input class="input" id="an-title" placeholder="公告标题"></div>
          <div class="field"><label>级别</label><select class="select" id="an-level"><option value="info">普通</option><option value="warn">重要</option></select></div>
          <button class="btn btn-primary" id="an-add">${ICON.plus} 发布</button>
        </div>
        <textarea class="textarea" id="an-content" placeholder="公告内容"></textarea>
      </div>
    </div>

    <div class="panel" style="margin-top:16px">
      <div class="panel-head"><h3>用户管理</h3><span class="spacer"></span>
        <span class="tag tag-gray">${users.length} 人</span></div>
      <div class="panel-body flush"><div class="table-wrap"><table>
        <thead><tr><th>用户</th><th>部门</th><th>角色</th><th>状态</th><th>任务</th><th>注册时间</th><th style="text-align:right">操作</th></tr></thead>
        <tbody>
          ${users.map((u) => `
            <tr data-id="${u.id}">
              <td><div class="cell-user"><span class="avatar avatar-sm">${esc(initials(u.name || u.username))}</span>
                <div><b>${esc(u.name || u.username)}</b><span>${esc(u.email)}</span></div></div></td>
              <td>${esc(u.department || '—')}</td>
              <td><span class="tag ${u.role === 'admin' ? 'tag-brand' : 'tag-gray'}">${u.role === 'admin' ? '管理员' : '成员'}</span></td>
              <td><span class="tag ${u.status === 'active' ? 'tag-green' : 'tag-red'}">${u.status === 'active' ? '正常' : '已停用'}</span></td>
              <td>${u.taskCount || 0}</td>
              <td>${fmtDate(u.createdAt)}</td>
              <td><div class="row-acts">
                <button class="btn btn-ghost btn-sm" data-act="role">${u.role === 'admin' ? '降权' : '设管理员'}</button>
                <button class="btn ${u.status === 'active' ? 'btn-soft' : 'btn-soft'} btn-sm" data-act="status">${u.status === 'active' ? '停用' : '启用'}</button>
                <button class="btn btn-danger btn-sm" data-act="del">删除</button>
              </div></td>
            </tr>`).join('')}
        </tbody>
      </table></div></div>
    </div>

    <div class="panel" style="margin-top:16px">
      <div class="panel-head"><h3>全部任务</h3><span class="spacer"></span>
        <span class="tag tag-gray">${tasks.length} 项</span></div>
      <div class="panel-body flush"><div class="table-wrap"><table>
        <thead><tr><th>标题</th><th>负责人</th><th>状态</th><th>优先级</th><th>截止</th></tr></thead>
        <tbody>
          ${tasks.slice(0, 60).map((t) => `
            <tr><td><b style="font-weight:500">${esc(t.title)}</b></td>
              <td>${esc(t.ownerName || '—')}</td>
              <td><span class="tag ${STATUS[t.status]?.tag || 'tag-gray'}">${STATUS[t.status]?.label || t.status}</span></td>
              <td><span class="tag ${PRIORITY[t.priority]?.tag || 'tag-gray'}">${PRIORITY[t.priority]?.label || t.priority}</span></td>
              <td>${fmtDate(t.dueDate) || '—'}</td></tr>`).join('')}
        </tbody>
      </table></div></div>
    </div>`;

  const reload = () => renderAdmin(root);
  $('#an-add', root).onclick = async () => {
    const title = $('#an-title', root).value.trim();
    if (!title) { toast('请填写标题', 'error'); return; }
    try { await API.backend.admin.addAnnouncement({ title, content: $('#an-content', root).value.trim(), level: $('#an-level', root).value }); toast('已发布'); reload(); }
    catch (e) { toast(e.message, 'error'); }
  };
  $$('#page tbody tr[data-id]', root).forEach((tr) => {
    const id = tr.dataset.id;
    const user = users.find((u) => u.id === id); if (!user) return;
    $('[data-act="role"]', tr).onclick = async () => {
      try { await API.backend.admin.updateUser(id, { role: user.role === 'admin' ? 'user' : 'admin' }); toast('已更新角色'); reload(); }
      catch (e) { toast(e.message, 'error'); }
    };
    $('[data-act="status"]', tr).onclick = async () => {
      try { await API.backend.admin.updateUser(id, { status: user.status === 'active' ? 'disabled' : 'active' }); toast('已更新状态'); reload(); }
      catch (e) { toast(e.message, 'error'); }
    };
    $('[data-act="del"]', tr).onclick = async () => {
      if (!(await confirmModal('删除用户', `确定删除「${user.name || user.username}」？其数据将一并清除。`))) return;
      try { await API.backend.admin.deleteUser(id); toast('已删除'); reload(); }
      catch (e) { toast(e.message, 'error'); }
    };
  });
}

function statCard(label, val, sub, color, ico) {
  return `<div class="stat"><div class="stat-top"><span class="stat-label">${label}</span>
    <span class="stat-ico" style="background:${color}1a;color:${color}">${ico}</span></div>
    <div class="stat-val">${val || 0}</div><div class="stat-sub">${sub || ''}</div></div>`;
}

/* ==========================================================================
   身份认证 / 初始化
   ========================================================================== */
const Auth = {
  token: null,
  async me() {
    const t = localStorage.getItem('wt_token');
    if (!t) return false;
    this.token = t;
    try { const { user } = await API.backend.auth.me(); State.user = user; return true; }
    catch { localStorage.removeItem('wt_token'); return false; }
  },
  logout(silent) {
    localStorage.removeItem('wt_token');
    if (!silent) location.reload();
  },
};

function showApp() {
  $('#auth').style.display = 'none';
  $('#app').classList.add('on');
  $('#user-name').textContent = State.user.name || State.user.username;
  $('#user-role').textContent = State.user.role === 'admin' ? '管理员' : '成员';
  $('#user-dept').textContent = State.user.department || '';
  $('#user-avatar').textContent = initials(State.user.name || State.user.username);
  $('.sb-item[data-view="admin"]').style.display = State.user.role === 'admin' ? 'flex' : 'none';
  navigate('dashboard');
}

function showAuth() {
  $('#app').classList.remove('on');
  $('#auth').style.display = 'grid';
}

function bindAuth() {
  $$('.auth-tabs button').forEach((b) => b.onclick = () => {
    $$('.auth-tabs button').forEach((x) => x.classList.remove('on'));
    b.classList.add('on');
    const reg = b.dataset.tab === 'register';
    $('#form-login').style.display = reg ? 'none' : 'block';
    $('#form-register').style.display = reg ? 'block' : 'none';
  });
  const alert = (msg) => { const a = $('#auth-alert'); a.textContent = msg; a.classList.add('show'); };
  $('#form-login').onsubmit = async (e) => {
    e.preventDefault(); const f = e.target;
    try {
      const { token, user } = await API.backend.auth.login({ account: f.account.value.trim(), password: f.password.value });
      localStorage.setItem('wt_token', token); State.user = user; showApp();
    } catch (err) { alert(err.message); }
  };
  $('#form-register').onsubmit = async (e) => {
    e.preventDefault(); const f = e.target;
    if (f.password.value.length < 6) return alert('密码至少 6 位');
    try {
      const { token, user } = await API.backend.auth.register({
        username: f.username.value.trim(), email: f.email.value.trim(),
        password: f.password.value, name: f.name.value.trim(), department: f.department.value.trim(),
      });
      localStorage.setItem('wt_token', token); State.user = user; toast(`欢迎，${user.name || user.username}！`); showApp();
    } catch (err) { alert(err.message); }
  };
}

function bindNav() {
  $$('.sb-item').forEach((b) => b.onclick = () => navigate(b.dataset.view));
  $('#menu-toggle').onclick = () => $('#sidebar').classList.toggle('open');
  $('#mask').onclick = () => $('#sidebar').classList.remove('open');
  $('#logout-btn').onclick = () => {
    if (confirm('确定退出登录？')) { Auth.logout(); location.reload(); }
  };
  $('#user-btn').onclick = () => profileModal();
}

function profileModal() {
  openModal({
    title: '个人设置',
    body: `
      <div style="display:flex;align-items:center;gap:13px;margin-bottom:18px">
        <span class="avatar avatar-lg">${esc(initials(State.user.name || State.user.username))}</span>
        <div><b style="font-size:15px">${esc(State.user.name || State.user.username)}</b>
          <div style="font-size:12.5px;color:var(--text-3)">${esc(State.user.email)} · ${State.user.role === 'admin' ? '管理员' : '成员'}</div></div>
      </div>
      <div class="field"><label>昵称</label><input class="input" id="pf-name" value="${esc(State.user.name || '')}"></div>
      <div class="field"><label>部门</label><input class="input" id="pf-dept" value="${esc(State.user.department || '')}"></div>
      <div class="sb-group" style="padding:14px 0 6px">修改密码（可选）</div>
      <div class="field"><label>原密码</label><input class="input" type="password" id="pf-old" placeholder="留空则不修改"></div>
      <div class="form-row">
        <div class="field"><label>新密码</label><input class="input" type="password" id="pf-new"></div>
        <div class="field"><label>确认新密码</label><input class="input" type="password" id="pf-new2"></div>
      </div>`,
    foot: `<button class="btn btn-ghost" data-close>取消</button><button class="btn btn-primary" id="pf-save">保存</button>`,
    onMount: (ov) => {
      $('#pf-save', ov).onclick = async () => {
        const np = $('#pf-new', ov).value, np2 = $('#pf-new2', ov).value;
        if (np && np !== np2) { toast('两次密码不一致', 'error'); return; }
        if (np && np.length < 6) { toast('新密码至少 6 位', 'error'); return; }
        try {
          const { user } = await API.backend.auth.profile({
            name: $('#pf-name', ov).value.trim(), department: $('#pf-dept', ov).value.trim(),
            oldPassword: $('#pf-old', ov).value, newPassword: np || undefined,
          });
          State.user = user; closeModal(); showApp(); toast('已保存');
        } catch (e) { toast(e.message, 'error'); }
      };
    },
  });
}

async function boot() {
  $('#mode-tag').textContent = API.mode === 'remote' ? '云端模式' : '本地模式';
  $('#mode-tag').style.background = API.mode === 'remote' ? 'var(--brand-50)' : 'var(--amber-bg)';
  $('#mode-tag').style.color = API.mode === 'remote' ? 'var(--brand)' : 'var(--amber)';

  bindAuth(); bindNav();
  if (await Auth.me()) { await refreshAll(); showApp(); }
  else showAuth();
}

(async () => {
  await API.init();
  boot();
})();
