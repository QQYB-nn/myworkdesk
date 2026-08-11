/**
 * 极简 JSON 文件存储层（零依赖）
 * 生产环境可平滑替换为 MySQL / PostgreSQL / MongoDB
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const EMPTY_DB = {
  users: [],
  tasks: [],
  projects: [],
  notes: [],
  announcements: [],
  logs: [],
};

let db = null;
let writeTimer = null;

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function load() {
  if (db) return db;
  ensureDir();
  if (fs.existsSync(DB_FILE)) {
    try {
      db = { ...EMPTY_DB, ...JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) };
    } catch {
      db = structuredClone(EMPTY_DB);
    }
  } else {
    db = structuredClone(EMPTY_DB);
  }
  seed();
  return db;
}

export function save() {
  clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    ensureDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  }, 80);
}

export function saveNow() {
  clearTimeout(writeTimer);
  ensureDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

export const uid = (p = 'id') =>
  `${p}_${Date.now().toString(36)}${crypto.randomBytes(4).toString('hex')}`;

/* ---------------- 密码哈希（scrypt，内置模块） ---------------- */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const calc = crypto.scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(calc, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* ---------------- 内置管理员 + 示例数据 ---------------- */
function seed() {
  if (db.users.length > 0) return;

  const adminId = uid('u');
  db.users.push({
    id: adminId,
    username: 'admin',
    name: '系统管理员',
    email: 'admin@worktable.local',
    password: hashPassword('admin123'),
    role: 'admin',
    status: 'active',
    department: '管理中心',
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
  });

  const projectId = uid('p');
  db.projects.push({
    id: projectId,
    ownerId: adminId,
    name: '工作台平台建设',
    color: '#6366f1',
    description: '统一管理团队所有工作内容的平台项目',
    status: 'active',
    createdAt: new Date().toISOString(),
  });

  const now = Date.now();
  const day = 86400000;
  const demo = [
    ['完成平台需求梳理', '整理前台展示与后台管理的功能清单', 'done', 'high', -2],
    ['设计数据模型与接口', '用户 / 任务 / 项目 / 笔记 / 公告', 'doing', 'high', 1],
    ['前端界面视觉走查', '统一配色、间距、组件圆角', 'todo', 'medium', 3],
    ['编写部署文档', '包含线上部署与备份方案', 'todo', 'low', 6],
  ];
  demo.forEach(([title, description, status, priority, offset]) => {
    db.tasks.push({
      id: uid('t'),
      ownerId: adminId,
      projectId,
      title,
      description,
      status,
      priority,
      dueDate: new Date(now + offset * day).toISOString().slice(0, 10),
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  db.notes.push({
    id: uid('n'),
    ownerId: adminId,
    title: '平台使用说明',
    content:
      '欢迎使用 WorkTable 工作台。\n\n· 工作看板：拖动式管理任务状态\n· 项目：把任务归类到不同项目\n· 知识笔记：沉淀工作文档\n· 后台管理：管理员可管理成员与全局内容',
    pinned: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  db.announcements.push({
    id: uid('a'),
    title: '工作台正式上线',
    content: '欢迎各位同事注册使用。如有功能建议，请通过后台反馈给管理员。',
    level: 'info',
    authorName: '系统管理员',
    createdAt: new Date().toISOString(),
  });

  saveNow();
}

export function log(userId, action, detail) {
  db.logs.unshift({
    id: uid('l'),
    userId,
    action,
    detail,
    createdAt: new Date().toISOString(),
  });
  if (db.logs.length > 500) db.logs.length = 500;
  save();
}

export const getDB = () => load();
