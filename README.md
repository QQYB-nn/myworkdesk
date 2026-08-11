# WorkTable 工作台

一个面向团队协作的「工作内容统一管理平台」：支持多成员注册登录、工作看板、项目管理、知识笔记，并内置可视化后台管理。界面美观、响应式，零第三方依赖（仅使用 Node.js 内置模块）。

---

## ✨ 功能一览

| 模块 | 说明 |
| --- | --- |
| 登录 / 注册 | 账号密码认证，支持用户名或邮箱登录；首个注册用户自动成为管理员 |
| 工作台首页 | 任务统计、完成进度、最新公告、最近工作一览 |
| 工作看板 | 待办 / 进行中 / 已完成 三栏拖拽管理，支持搜索与筛选 |
| 项目管理 | 按项目分组任务，自定义颜色标识 |
| 知识笔记 | 富文本/纯文本笔记沉淀，支持置顶 |
| 后台管理 | 用户管理（角色/状态/删除）、发布公告、注册趋势、操作日志、全量任务视图 |

## 🧩 运行模式（智能探测）

1. **云端模式（已部署后端）**：前端自动调用后端 API，所有成员共享同一份数据，支持真正的多用户协作。
2. **本地模式（无后端）**：若前端直接以静态文件打开、探测不到后端，会自动回退到浏览器 `localStorage` 存储，数据保存在本机，方便离线体验与演示。

页面右上角会显示当前模式。

---

## 🚀 本地运行

```bash
cd worktable
node server/index.js
# 默认监听 http://localhost:8080
```

环境变量（可选）：
- `PORT`：端口（默认 8080）
- `HOST`：监听地址（默认 0.0.0.0）
- `JWT_SECRET`：登录令牌签名密钥（生产务必修改）
- `DATA_DIR`：数据存储目录（默认 `server/data`）

> 默认管理员账号：`admin` / `admin123`（首次启动自动写入）。请登录后尽快在「个人设置」中修改密码。

---

## ☁️ 线上部署

整套应用是「单进程 Node 服务 + 静态前端」，无需数据库、零第三方依赖，**任意支持 Node 的环境都能跑**。

### 方式一：平台托管（推荐，最省心）⭐

无需自己买服务器、装环境，也不用管 HTTPS —— 平台自动提供子域名 + 免费证书，多人可直接注册协作。

#### Render
1. 把本目录推送到一个 GitHub 仓库。
2. 登录 [render.com](https://render.com) → **New** → **Blueprint** → 关联该仓库。
3. 平台会读取 `render.yaml`：自动用 `node server/index.js` 启动，并注入 `PORT` 与随机 `JWT_SECRET`。
4. 部署完成后，Render 会给你一个 `xxx.onrender.com` 的地址，**默认就是 HTTPS**，直接发给同事即可注册使用。

> 也可不上传 `render.yaml`，手动建 Web Service：Runtime 选 Node，Build Command 填 `echo skip`、Start Command 填 `node server/index.js`，其余默认即可。

#### Railway
1. 仓库推到 GitHub 后，在 [railway.app](https://railway.app) 点 **New Project → Deploy from GitHub repo**。
2. 平台读取 `railway.toml`：自动 `node server/index.js` 启动，注入 `PORT`，健康检查走 `/api/health`。
3. 完成后在 Settings 里打开 **Generate Domain**，即得到一个 `xxx.up.railway.app` 的 HTTPS 地址。

两种平台都**有免费额度可用**；数据仍以 JSON 文件（`server/data/db.json`）形式保存在运行实例中，重启不丢失（注意平台休眠 / 重建实例可能清空文件系统，生产可在控制台挂载磁盘或日后换数据库）。

### 方式二：云服务器 / 任意 Node 主机
```bash
git clone <repo> && cd worktable
PORT=8080 JWT_SECRET="你的密钥" node server/index.js
```
配合 Nginx 反代 + HTTPS 即可对外提供服务（进程建议用 `pm2` 或 `systemd` 守护）。

### 方式三：纯静态预览（无后端，本地模式）
直接用任意静态托管（如本工具内置的 CloudStudio / Nginx / GitHub Pages）托管 `public/` 目录即可运行，**多人注册的数据仅保存在各自浏览器**，适合做 UI 演示。

> 数据持久化：所有数据以 JSON 文件形式保存在 `DATA_DIR`（默认 `server/data/db.json`），备份该文件即可。后续如需更高并发，可将 `server/store.js` 换成 MySQL / PostgreSQL / MongoDB，接口层无需改动。

---

## 📁 目录结构

```
worktable/
├─ server/
│  ├─ index.js        # 零依赖 Node 服务（静态托管 + REST API）
│  └─ store.js        # JSON 文件存储层（可平滑替换为数据库）
├─ public/
│  ├─ index.html      # 应用外壳（登录页 + 主界面）
│  └─ assets/
│     ├─ css/app.css  # 设计系统 + 组件样式
│     └─ js/
│        ├─ api.js    # API 适配层（自动探测云端/本地模式）
│        └─ app.js    # 应用主逻辑（路由 + 各视图渲染）
└─ README.md
```

## 🔒 安全建议（生产环境）
- 修改 `JWT_SECRET`，避免令牌被伪造。
- 使用 HTTPS 与反代，限制请求频率以防暴力破解。
- 定期备份 `server/data/db.json`。
- 当前密码使用 Node 内置 `scrypt` 加盐哈希，未引入第三方加密库。

## 📤 推送到 GitHub（首次部署）

本仓库已 `git init` 并提交，远端 `origin` 指向 `https://github.com/QQYB-nn/myworkdesk.git`。
由于运行环境屏蔽了对外 443 端口，推送需在你**自己的电脑终端**（PowerShell / Git Bash / CMD，需已装 git 且有网络）完成：

```bash
cd "C:\Users\62587\WorkBuddy\我的工作台\worktable"
git push -u origin main --force
```

> `--force` 会用本仓库覆盖远端仓库的初始提交（适用于全新仓库，无害）。
> 若想保留远端初始提交，改为先 `git pull --rebase --allow-unrelated-histories origin main` 再 `git push -u origin main`。

### 认证方式（GitHub 已停用密码登录，需用 Personal Access Token）
1. 打开 GitHub → 右上角头像 → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)** → **Generate new token (classic)**。
2. 勾选 `repo`（全选 repo 下子项），过期时间按需设置，点击 **Generate token**。
3. **复制生成的 token**（只显示一次）。
4. 执行 `git push` 时：
   - Username 填：`QQYB-nn`
   - Password 处**粘贴上面的 token**（输入时不显示，粘贴后回车即可）。

推送成功后，即可在 Render / Railway 关联该仓库完成部署（见上方「线上部署」章节）。
