/**
 * WorkTable 工作台 - 零依赖 Node 服务
 * 提供静态资源托管 + REST API（注册/登录/任务/项目/笔记/公告/后台管理）
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  getDB, save, uid, hashPassword, verifyPassword, log,
} from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const SECRET = process.env.JWT_SECRET || 'worktable-dev-secret-change-me';

/* ------------------------- 轻量 JWT ------------------------- */
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const sign = (data) => crypto.createHmac('sha256', SECRET).update(data).digest('base64url');

function createToken(payload, days = 7) {
  const body = { ...payload, exp: Date.now() + days * 86400000 };
  const head = b64({ alg: 'HS256', typ: 'JWT' });
  const data = `${head}.${b64(body)}`;
  return `${data}.${sign(data)}`;
}

function readToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const data = `${parts[0]}.${parts[1]}`;
  if (sign(data) !== parts[2]) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/* ------------------------- 工具 ------------------------- */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function send(res, status, data, headers = {}) {
  const body = typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
    ...headers,
  });
  res.end(body);
}

const ok = (res, data) => send(res, 200, { ok: true, data });
const fail = (res, status, message) => send(res, status, { ok: false, message });

function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => {
      raw += c;
      if (raw.length > 2e6) req.destroy();
    });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve({}); }
    });
  });
}

const publicUser = (u) => u && ({
  id: u.id, username: u.username, name: u.name, email: u.email, role: u.role,
  status: u.status, department: u.department, createdAt: u.createdAt, lastLoginAt: u.lastLoginAt,
});

function auth(req) {
  const h = req.headers.authorization || '';
  const payload = readToken(h.replace(/^Bearer\s+/i, ''));
  if (!payload) return null;
  const db = getDB();
  const user = db.users.find((u) => u.id === payload.uid);
  if (!user || user.status !== 'active') return null;
  return user;
}

/* ------------------------- 通用 CRUD ------------------------- */
function ownedCollection(name, prefix, fields) {
  return {
    list(user) {
      const db = getDB();
      return db[name].filter((x) => x.ownerId === user.id);
    },
    create(user, body) {
      const db = getDB();
      const now = new Date().toISOString();
      const item = { id: uid(prefix), ownerId: user.id, createdAt: now, updatedAt: now };
      fields.forEach((f) => { if (body[f] !== undefined) item[f] = body[f]; });
      db[name].unshift(item);
      save();
      return item;
    },
    update(user, id, body) {
      const db = getDB();
      const item = db[name].find((x) => x.id === id);
      if (!item) return null;
      if (item.ownerId !== user.id && user.role !== 'admin') return 'forbidden';
      fields.forEach((f) => { if (body[f] !== undefined) item[f] = body[f]; });
      item.updatedAt = new Date().toISOString();
      save();
      return item;
    },
    remove(user, id) {
      const db = getDB();
      const idx = db[name].findIndex((x) => x.id === id);
      if (idx < 0) return null;
      if (db[name][idx].ownerId !== user.id && user.role !== 'admin') return 'forbidden';
      db[name].splice(idx, 1);
      save();
      return true;
    },
  };
}

const TASK_FIELDS = ['title', 'description', 'status', 'priority', 'dueDate', 'projectId', 'tags'];
const PROJECT_FIELDS = ['name', 'color', 'description', 'status'];
const NOTE_FIELDS = ['title', 'content', 'pinned'];

const tasks = ownedCollection('tasks', 't', TASK_FIELDS);
const projects = ownedCollection('projects', 'p', PROJECT_FIELDS);
const notes = ownedCollection('notes', 'n', NOTE_FIELDS);

/* ------------------------- 路由 ------------------------- */
async function api(req, res, url) {
  const seg = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  const [group, action, id] = seg;
  const method = req.method;
  const db = getDB();

  if (group === 'health') return ok(res, { status: 'up', time: new Date().toISOString() });

  /* -------- 认证 -------- */
  if (group === 'auth') {
    if (action === 'register' && method === 'POST') {
      const b = await readBody(req);
      const username = String(b.username || '').trim();
      const email = String(b.email || '').trim().toLowerCase();
      const password = String(b.password || '');
      if (username.length < 2) return fail(res, 400, '用户名至少 2 个字符');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail(res, 400, '邮箱格式不正确');
      if (password.length < 6) return fail(res, 400, '密码至少 6 位');
      if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase()))
        return fail(res, 409, '该用户名已被注册');
      if (db.users.some((u) => u.email === email)) return fail(res, 409, '该邮箱已被注册');

      const user = {
        id: uid('u'),
        username,
        name: b.name?.trim() || username,
        email,
        password: hashPassword(password),
        role: 'user',
        status: 'active',
        department: b.department?.trim() || '未分配',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      db.users.push(user);
      log(user.id, 'register', `新用户注册：${username}`);
      save();
      return ok(res, { token: createToken({ uid: user.id }), user: publicUser(user) });
    }

    if (action === 'login' && method === 'POST') {
      const b = await readBody(req);
      const account = String(b.account || '').trim().toLowerCase();
      const user = db.users.find(
        (u) => u.username.toLowerCase() === account || u.email === account,
      );
      if (!user || !verifyPassword(String(b.password || ''), user.password))
        return fail(res, 401, '账号或密码错误');
      if (user.status !== 'active') return fail(res, 403, '账号已被停用，请联系管理员');
      user.lastLoginAt = new Date().toISOString();
      log(user.id, 'login', `${user.username} 登录`);
      save();
      return ok(res, { token: createToken({ uid: user.id }), user: publicUser(user) });
    }

    if (action === 'me' && method === 'GET') {
      const user = auth(req);
      if (!user) return fail(res, 401, '未登录或登录已过期');
      return ok(res, { user: publicUser(user) });
    }

    if (action === 'profile' && method === 'PATCH') {
      const user = auth(req);
      if (!user) return fail(res, 401, '未登录');
      const b = await readBody(req);
      ['name', 'department'].forEach((f) => { if (b[f] !== undefined) user[f] = String(b[f]).trim(); });
      if (b.newPassword) {
        if (!verifyPassword(String(b.oldPassword || ''), user.password))
          return fail(res, 400, '原密码不正确');
        if (String(b.newPassword).length < 6) return fail(res, 400, '新密码至少 6 位');
        user.password = hashPassword(String(b.newPassword));
      }
      save();
      return ok(res, { user: publicUser(user) });
    }
  }

  /* -------- 公开内容（前台展示） -------- */
  if (group === 'public') {
    if (action === 'announcements' && method === 'GET') {
      return ok(res, db.announcements.slice(0, 20));
    }
    if (action === 'stats' && method === 'GET') {
      return ok(res, {
        users: db.users.length,
        tasks: db.tasks.length,
        done: db.tasks.filter((t) => t.status === 'done').length,
        projects: db.projects.length,
      });
    }
  }

  /* -------- 以下均需登录 -------- */
  const user = auth(req);
  if (!user) return fail(res, 401, '未登录或登录已过期');

  const routes = { tasks, projects, notes };
  if (routes[group]) {
    const c = routes[group];
    if (method === 'GET') return ok(res, c.list(user));
    if (method === 'POST') return ok(res, c.create(user, await readBody(req)));
    if (method === 'PATCH' || method === 'PUT') {
      const r = c.update(user, action, await readBody(req));
      if (r === 'forbidden') return fail(res, 403, '无权操作');
      return r ? ok(res, r) : fail(res, 404, '记录不存在');
    }
    if (method === 'DELETE') {
      const r = c.remove(user, action);
      if (r === 'forbidden') return fail(res, 403, '无权操作');
      return r ? ok(res, { id: action }) : fail(res, 404, '记录不存在');
    }
  }

  if (group === 'overview' && method === 'GET') {
    const mine = db.tasks.filter((t) => t.ownerId === user.id);
    const today = new Date().toISOString().slice(0, 10);
    return ok(res, {
      total: mine.length,
      todo: mine.filter((t) => t.status === 'todo').length,
      doing: mine.filter((t) => t.status === 'doing').length,
      done: mine.filter((t) => t.status === 'done').length,
      overdue: mine.filter((t) => t.status !== 'done' && t.dueDate && t.dueDate < today).length,
      projects: db.projects.filter((p) => p.ownerId === user.id).length,
      notes: db.notes.filter((n) => n.ownerId === user.id).length,
      announcements: db.announcements.slice(0, 5),
      recent: mine.slice().sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')).slice(0, 6),
    });
  }

  /* -------- 后台管理（仅管理员） -------- */
  if (group === 'admin') {
    if (user.role !== 'admin') return fail(res, 403, '需要管理员权限');

    if (action === 'stats' && method === 'GET') {
      const byDay = {};
      db.users.forEach((u) => {
        const d = (u.createdAt || '').slice(0, 10);
        if (d) byDay[d] = (byDay[d] || 0) + 1;
      });
      return ok(res, {
        users: db.users.length,
        activeUsers: db.users.filter((u) => u.status === 'active').length,
        tasks: db.tasks.length,
        doneTasks: db.tasks.filter((t) => t.status === 'done').length,
        projects: db.projects.length,
        notes: db.notes.length,
        announcements: db.announcements.length,
        signupTrend: Object.entries(byDay).sort().slice(-14),
        logs: db.logs.slice(0, 20),
      });
    }

    if (action === 'users') {
      if (method === 'GET') {
        return ok(res, db.users.map((u) => ({
          ...publicUser(u),
          taskCount: db.tasks.filter((t) => t.ownerId === u.id).length,
        })));
      }
      const target = db.users.find((u) => u.id === id);
      if (method === 'PATCH') {
        if (!target) return fail(res, 404, '用户不存在');
        const b = await readBody(req);
        if (b.role && ['admin', 'user'].includes(b.role)) {
          if (target.id === user.id && b.role !== 'admin') return fail(res, 400, '不能取消自己的管理员权限');
          target.role = b.role;
        }
        if (b.status && ['active', 'disabled'].includes(b.status)) {
          if (target.id === user.id) return fail(res, 400, '不能停用自己的账号');
          target.status = b.status;
        }
        if (b.department !== undefined) target.department = String(b.department).trim();
        if (b.resetPassword) target.password = hashPassword(String(b.resetPassword));
        log(user.id, 'admin.user.update', `更新用户 ${target.username}`);
        save();
        return ok(res, publicUser(target));
      }
      if (method === 'DELETE') {
        if (!target) return fail(res, 404, '用户不存在');
        if (target.id === user.id) return fail(res, 400, '不能删除自己');
        db.users = db.users.filter((u) => u.id !== id);
        db.tasks = db.tasks.filter((t) => t.ownerId !== id);
        db.projects = db.projects.filter((p) => p.ownerId !== id);
        db.notes = db.notes.filter((n) => n.ownerId !== id);
        log(user.id, 'admin.user.delete', `删除用户 ${target.username}`);
        save();
        return ok(res, { id });
      }
    }

    if (action === 'tasks' && method === 'GET') {
      return ok(res, db.tasks.map((t) => ({
        ...t,
        ownerName: db.users.find((u) => u.id === t.ownerId)?.name || '已删除用户',
      })));
    }

    if (action === 'announcements') {
      if (method === 'POST') {
        const b = await readBody(req);
        if (!b.title?.trim()) return fail(res, 400, '标题不能为空');
        const item = {
          id: uid('a'),
          title: b.title.trim(),
          content: String(b.content || '').trim(),
          level: b.level || 'info',
          authorName: user.name,
          createdAt: new Date().toISOString(),
        };
        db.announcements.unshift(item);
        save();
        return ok(res, item);
      }
      if (method === 'DELETE') {
        db.announcements = db.announcements.filter((a) => a.id !== id);
        save();
        return ok(res, { id });
      }
    }
  }

  return fail(res, 404, '接口不存在');
}

/* ------------------------- 静态资源 ------------------------- */
function serveStatic(req, res, url) {
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  const filePath = path.join(PUBLIC_DIR, path.normalize(rel).replace(/^(\.\.[/\\])+/, ''));
  if (!filePath.startsWith(PUBLIC_DIR)) return fail(res, 403, 'forbidden');

  fs.readFile(filePath, (err, buf) => {
    if (err) {
      // SPA 回退
      fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (e2, html) => {
        if (e2) return send(res, 404, 'Not Found', { 'Content-Type': 'text/plain' });
        send(res, 200, html, { 'Content-Type': 'text/html; charset=utf-8' });
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, buf, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=300',
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'OPTIONS') return send(res, 204, '');
  try {
    if (url.pathname.startsWith('/api')) return await api(req, res, url);
    return serveStatic(req, res, url);
  } catch (err) {
    console.error(err);
    return fail(res, 500, '服务器内部错误');
  }
});

getDB();
server.listen(PORT, HOST, () => {
  console.log(`\n  WorkTable 工作台已启动`);
  console.log(`  本地访问: http://localhost:${PORT}`);
  console.log(`  默认管理员: admin / admin123（请尽快修改密码）\n`);
});
