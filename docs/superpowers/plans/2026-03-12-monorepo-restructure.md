# Monorepo 重构实现计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将项目重构为 monorepo 结构，前端代码迁移至 `apps/frontend/`，后端代码迁移至 `apps/server/`

**Architecture:** 使用 pnpm workspaces 管理多包，根目录包含共享配置，apps/ 目录包含前后端应用

**Tech Stack:** pnpm workspaces, Vue 3, Vite, Fastify, Prisma

---

## Chunk 1: 创建目录结构与 Workspace 配置

### Task 1: 创建 apps 目录结构

**Files:**
- Create: `apps/.gitkeep`

- [ ] **Step 1: 创建 apps 目录**

```bash
mkdir -p apps
touch apps/.gitkeep
```

- [ ] **Step 2: 验证目录创建成功**

Run: `ls -la apps/`
Expected: 看到 `.gitkeep` 文件

### Task 2: 创建 pnpm-workspace.yaml

**Files:**
- Create: `pnpm-workspace.yaml`

- [ ] **Step 1: 创建 workspace 配置文件**

```yaml
packages:
  - 'apps/*'
```

- [ ] **Step 2: 验证文件内容**

Run: `cat pnpm-workspace.yaml`
Expected: 输出 workspace 配置内容

### Task 3: 创建根 package.json

**Files:**
- Create: `package.json` (覆盖现有文件)

- [ ] **Step 1: 备份当前 package.json**

```bash
cp package.json package.json.backup
```

- [ ] **Step 2: 创建新的根 package.json**

```json
{
  "name": "gzf-monorepo",
  "private": true,
  "scripts": {
    "dev": "pnpm -r dev",
    "dev:frontend": "pnpm --filter frontend dev",
    "dev:server": "pnpm --filter server dev",
    "build": "pnpm -r build",
    "build:frontend": "pnpm --filter frontend build",
    "build:server": "pnpm --filter server build",
    "lint": "pnpm -r lint",
    "clean": "pnpm -r clean && rm -rf node_modules"
  },
  "devDependencies": {
    "simple-git-hooks": "^2.13.1",
    "lint-staged": "^16.3.3"
  },
  "simple-git-hooks": {
    "pre-commit": "pnpm lint-staged"
  }
}
```

- [ ] **Step 3: 验证文件创建成功**

Run: `cat package.json`
Expected: 输出新的根 package.json 内容

### Task 4: 提交 Chunk 1

- [ ] **Step 1: 提交 workspace 配置**

```bash
git add apps/.gitkeep pnpm-workspace.yaml package.json
git commit -m "$(cat <<'EOF'
chore: 创建 monorepo 目录结构和 workspace 配置

- 创建 apps/ 目录
- 添加 pnpm-workspace.yaml
- 更新根 package.json 为 workspace 配置
EOF
)"
```

---

## Chunk 2: 迁移前端代码

### Task 5: 移动前端源代码目录

**Files:**
- Move: `src/` → `apps/frontend/src/`
- Move: `public/` → `apps/frontend/public/`

- [ ] **Step 1: 创建 apps/frontend 目录**

```bash
mkdir -p apps/frontend
```

- [ ] **Step 2: 移动 src 目录**

```bash
git mv src apps/frontend/src
```

- [ ] **Step 3: 移动 public 目录**

```bash
git mv public apps/frontend/public
```

- [ ] **Step 4: 验证移动成功**

Run: `ls -la apps/frontend/`
Expected: 看到 `src/` 和 `public/` 目录

### Task 6: 移动前端配置文件

**Files:**
- Move: `index.html` → `apps/frontend/index.html`
- Move: `vite.config.ts` → `apps/frontend/vite.config.ts`
- Move: `tsconfig.json` → `apps/frontend/tsconfig.json`
- Move: `tsconfig.app.json` → `apps/frontend/tsconfig.app.json`
- Move: `tsconfig.node.json` → `apps/frontend/tsconfig.node.json`
- Move: `eslint.config.mjs` → `apps/frontend/eslint.config.mjs`

- [ ] **Step 1: 移动 index.html**

```bash
git mv index.html apps/frontend/index.html
```

- [ ] **Step 2: 移动 vite.config.ts**

```bash
git mv vite.config.ts apps/frontend/vite.config.ts
```

- [ ] **Step 3: 移动 tsconfig 文件**

```bash
git mv tsconfig.json apps/frontend/tsconfig.json
git mv tsconfig.app.json apps/frontend/tsconfig.app.json
git mv tsconfig.node.json apps/frontend/tsconfig.node.json
```

- [ ] **Step 4: 移动 eslint 配置**

```bash
git mv eslint.config.mjs apps/frontend/eslint.config.mjs
```

- [ ] **Step 5: 验证文件移动成功**

Run: `ls -la apps/frontend/`
Expected: 看到所有配置文件

### Task 7: 移动前端环境变量文件

**Files:**
- Move: `.env.development` → `apps/frontend/.env.development`
- Move: `.env.production` → `apps/frontend/.env.production`
- Move: `.env.example` → `apps/frontend/.env.example`

- [ ] **Step 1: 移动环境变量文件**

```bash
git mv .env.development apps/frontend/.env.development
git mv .env.production apps/frontend/.env.production
git mv .env.example apps/frontend/.env.example
```

- [ ] **Step 2: 验证文件移动成功**

Run: `ls -la apps/frontend/.env*`
Expected: 看到三个环境变量文件

### Task 8: 创建前端 package.json

**Files:**
- Create: `apps/frontend/package.json`

- [ ] **Step 1: 读取原 package.json.backup 获取依赖**

Run: `cat package.json.backup`

- [ ] **Step 2: 创建前端 package.json**

```json
{
  "name": "frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  },
  "dependencies": {
    "@amap/amap-jsapi-loader": "^1.0.1",
    "@element-plus/icons-vue": "^2.3.2",
    "@vueuse/core": "^14.2.1",
    "element-plus": "^2.13.3",
    "pinia": "^3.0.4",
    "vue": "^3.5.25",
    "vue-router": "^5.0.3"
  },
  "devDependencies": {
    "@antfu/eslint-config": "^7.7.0",
    "@tailwindcss/vite": "^4.2.1",
    "@types/node": "^24.10.1",
    "@vitejs/plugin-vue": "^6.0.2",
    "@vue/tsconfig": "^0.8.1",
    "autoprefixer": "^10.4.27",
    "eslint-plugin-format": "^2.0.1",
    "lint-staged": "^16.3.3",
    "postcss": "^8.5.8",
    "simple-git-hooks": "^2.13.1",
    "tailwindcss": "^4.2.1",
    "typescript": "~5.9.3",
    "vite": "^7.3.1",
    "vue-tsc": "^3.1.5"
  }
}
```

- [ ] **Step 3: 验证文件创建成功**

Run: `cat apps/frontend/package.json`
Expected: 输出前端 package.json 内容

### Task 9: 移动前端相关目录

**Files:**
- Move: `dist/` → `apps/frontend/dist/` (如果存在)
- Remove: `package.json.backup`

- [ ] **Step 1: 移动 dist 目录**

```bash
if [ -d "dist" ]; then
  git mv dist apps/frontend/dist
fi
```

- [ ] **Step 2: 清理备份文件**

```bash
rm package.json.backup
```

### Task 10: 提交 Chunk 2

- [ ] **Step 1: 提交前端迁移**

```bash
git add apps/frontend/
git commit -m "$(cat <<'EOF'
chore: 迁移前端代码到 apps/frontend/

- 移动 src/, public/ 目录
- 移动配置文件 (vite, tsconfig, eslint)
- 移动环境变量文件
- 创建前端 package.json
EOF
)"
```

---

## Chunk 3: 迁移后端代码

### Task 11: 移动后端代码目录

**Files:**
- Move: `server/` → `apps/server/`

- [ ] **Step 1: 移动整个 server 目录**

```bash
git mv server apps/server
```

- [ ] **Step 2: 验证移动成功**

Run: `ls -la apps/server/`
Expected: 看到后端所有文件和目录

### Task 12: 更新后端 package.json 名称

**Files:**
- Modify: `apps/server/package.json`

- [ ] **Step 1: 读取当前后端 package.json**

Run: `cat apps/server/package.json`

- [ ] **Step 2: 更新 package.json 的 name 字段**

将 `"name": "gzf-server"` 改为 `"name": "server"`

### Task 13: 提交 Chunk 3

- [ ] **Step 1: 提交后端迁移**

```bash
git add apps/server/
git commit -m "$(cat <<'EOF'
chore: 迁移后端代码到 apps/server/

- 移动整个 server 目录到 apps/server/
- 更新 package.json name 字段
EOF
)"
```

---

## Chunk 4: 更新配置文件

### Task 14: 更新 .gitignore

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: 读取当前 .gitignore**

Run: `cat .gitignore`

- [ ] **Step 2: 更新 .gitignore 内容**

```gitignore
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
apps/frontend/dist/
apps/server/dist/

# Environment files
.env
apps/*/.env
!apps/*/.env.example

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
```

### Task 15: 更新 vercel.json

**Files:**
- Modify: `vercel.json`

- [ ] **Step 1: 读取当前 vercel.json**

Run: `cat vercel.json`

- [ ] **Step 2: 更新 vercel.json 内容**

```json
{
  "buildCommand": "pnpm build:frontend",
  "outputDirectory": "apps/frontend/dist",
  "installCommand": "pnpm install"
}
```

### Task 16: 移动 .vscode 目录（如果保留）

**Files:**
- Keep: `.vscode/` (在根目录)

- [ ] **Step 1: 确认 .vscode 目录存在**

Run: `ls -la .vscode/`
Expected: 看到 VS Code 配置文件

- [ ] **Step 2: 保留 .vscode 在根目录**

不移动，保持原位置

### Task 17: 移动其他根目录文件

**Files:**
- Keep: `.nvmrc` (根目录)
- Keep: `vercel.json` (根目录)
- Keep: `.gitignore` (根目录)

- [ ] **Step 1: 确认文件位置正确**

Run: `ls -la .nvmrc vercel.json .gitignore`
Expected: 三个文件都在根目录

### Task 18: 提交 Chunk 4

- [ ] **Step 1: 提交配置更新**

```bash
git add .gitignore vercel.json
git commit -m "$(cat <<'EOF'
chore: 更新配置文件路径

- 更新 .gitignore 适配 monorepo 结构
- 更新 vercel.json 构建路径
EOF
)"
```

---

## Chunk 5: 创建 README.md

### Task 19: 创建项目 README.md

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 创建完整 README.md**

```markdown
# 上海宝山公租房信息平台

一个用于浏览和比较上海宝山区公租房房源的 Web 应用，支持房源搜索、筛选、收藏、对比及附近设施查询。

## 技术栈

### 前端
- **Vue 3.5** - 渐进式 JavaScript 框架
- **TypeScript 5.9** - 类型安全
- **Vite 7** - 下一代前端构建工具
- **Tailwind CSS v4** - 实用优先的 CSS 框架
- **Pinia 3** - Vue 状态管理
- **Vue Router 5** - Vue.js 官方路由
- **Element Plus** - Vue 3 组件库
- **VueUse** - Vue Composition API 工具集
- **高德地图 JS API** - 地图和 POI 服务

### 后端
- **Node.js** - JavaScript 运行时
- **Fastify** - 高性能 Web 框架
- **Prisma** - 下一代 ORM
- **SQLite** - 轻量级数据库
- **JWT** - 身份认证

## 环境要求

- **Node.js** >= 18
- **pnpm** >= 8

## 快速开始

### 安装依赖

\`\`\`bash
pnpm install
\`\`\`

### 环境配置

1. 复制环境变量示例文件：

\`\`\`bash
cp apps/frontend/.env.example apps/frontend/.env
cp apps/server/.env.example apps/server/.env
\`\`\`

2. 配置高德地图 API Key（前端）：
   - 在 `apps/frontend/.env` 中设置 `VITE_AMAP_KEY`

3. 配置 JWT 密钥（后端）：
   - 在 `apps/server/.env` 中设置 `JWT_SECRET`

### 启动开发服务器

\`\`\`bash
# 同时启动前端和后端
pnpm dev

# 仅启动前端
pnpm dev:frontend

# 仅启动后端
pnpm dev:server
\`\`\`

前端默认运行在 http://localhost:3000
后端默认运行在 http://localhost:3001

### 构建生产版本

\`\`\`bash
pnpm build
\`\`\`

## 目录结构

\`\`\`
gzf/
├── apps/
│   ├── frontend/           # Vue 3 前端应用
│   │   ├── src/
│   │   │   ├── api/        # API 请求
│   │   │   ├── components/ # Vue 组件
│   │   │   ├── composables/# 组合式函数
│   │   │   ├── config/     # 配置文件
│   │   │   ├── router/     # 路由配置
│   │   │   ├── stores/     # Pinia 状态管理
│   │   │   ├── types/      # TypeScript 类型
│   │   │   ├── utils/      # 工具函数
│   │   │   └── views/      # 页面组件
│   │   ├── public/         # 静态资源
│   │   └── ...
│   │
│   └── server/             # Fastify 后端服务
│       ├── src/
│       │   ├── routes/     # API 路由
│       │   ├── middleware/ # 中间件
│       │   └── ...
│       ├── prisma/         # 数据库模型
│       └── ...
│
├── pnpm-workspace.yaml     # pnpm workspace 配置
├── package.json            # 根 package.json
└── README.md
\`\`\`

## 主要功能

### 房源浏览
- 房源列表无限滚动加载
- 房源详情展示（图片、户型、配套设施等）
- VR 看房链接

### 筛选与排序
- 多维度筛选：户型、租金范围、房型、配套设施、朝向、面积
- 多种排序方式：租金、可租套数、开盘日期

### 收藏与对比
- 房源收藏功能
- 最多 4 个房源对比
- 对比结果可视化展示

### 地图服务
- 高德地图集成
- 周边 POI 查询（地铁、公交、医院、学校等）
- POI 数据缓存

### 用户系统
- 用户注册与登录
- JWT 身份认证
- 浏览历史记录

## 数据来源

房源数据来源于上海宝山公租房官网 (https://www.bsgzf.com.cn)，仅供学习参考。

## 部署

### Vercel 部署

项目支持 Vercel 一键部署，配置见 `vercel.json`。

\`\`\`bash
# 构建命令
pnpm build:frontend

# 输出目录
apps/frontend/dist
\`\`\`

### 环境变量

| 变量名 | 说明 | 位置 |
|--------|------|------|
| `VITE_AMAP_KEY` | 高德地图 API Key | 前端 |
| `JWT_SECRET` | JWT 签名密钥 | 后端 |
| `DATABASE_URL` | 数据库连接字符串 | 后端 |

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `chore:` 构建/工具变更

## 许可证

[MIT](LICENSE)

## 致谢

- [Vue.js](https://vuejs.org/)
- [Element Plus](https://element-plus.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [高德地图](https://lbs.amap.com/)
```

- [ ] **Step 2: 验证 README.md 创建成功**

Run: `head -50 README.md`
Expected: 输出 README.md 前 50 行

### Task 20: 提交 Chunk 5

- [ ] **Step 1: 提交 README.md**

```bash
git add README.md
git commit -m "$(cat <<'EOF'
docs: 创建完整项目 README.md

- 项目概述和技术栈说明
- 环境要求和安装步骤
- 详细的目录结构说明
- 主要功能模块介绍
- 部署和贡献指南
EOF
)"
```

---

## Chunk 6: 安装依赖与验证

### Task 21: 清理旧依赖

- [ ] **Step 1: 删除旧的 node_modules**

```bash
rm -rf node_modules
rm -rf apps/server/node_modules
rm -rf pnpm-lock.yaml
rm -rf apps/server/pnpm-lock.yaml
```

### Task 22: 安装 workspace 依赖

- [ ] **Step 1: 安装所有依赖**

```bash
pnpm install
```

Expected: 成功安装所有依赖，无错误输出

- [ ] **Step 2: 验证依赖安装成功**

Run: `ls -la node_modules/ | head -20`
Expected: 看到依赖目录

### Task 23: 验证前端构建

- [ ] **Step 1: 构建前端**

```bash
cd apps/frontend && pnpm build
```

Expected: 构建成功，无错误

- [ ] **Step 2: 验证构建输出**

Run: `ls -la apps/frontend/dist/`
Expected: 看到 `index.html` 和 `assets/` 目录

### Task 24: 验证后端构建

- [ ] **Step 1: 构建后端**

```bash
cd apps/server && pnpm build
```

Expected: 构建成功，无错误

- [ ] **Step 2: 验证构建输出**

Run: `ls -la apps/server/dist/`
Expected: 看到 `index.js` 文件

### Task 25: 提交最终状态

- [ ] **Step 1: 提交 pnpm-lock.yaml**

```bash
git add pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
chore: 更新 pnpm-lock.yaml 适配 monorepo 结构
EOF
)"
```

### Task 26: 最终验证

- [ ] **Step 1: 运行前端开发服务器**

```bash
pnpm dev:frontend
```

Expected: 前端服务启动成功，访问 http://localhost:3000

- [ ] **Step 2: 停止前端服务器**

按 `Ctrl+C` 停止

- [ ] **Step 3: 验证目录结构**

Run: `tree -L 3 -I 'node_modules|dist' .`
Expected: 看到正确的 monorepo 结构

---

## 总结

迁移完成后，项目将具备以下结构：

```
gzf/
├── apps/
│   ├── frontend/     # Vue 3 前端应用
│   └── server/       # Fastify 后端服务
├── docs/             # 文档
├── script/           # 脚本
├── pnpm-workspace.yaml
├── package.json
├── README.md
├── .gitignore
├── .nvmrc
└── vercel.json
```

可用命令：
- `pnpm dev` - 启动所有开发服务器
- `pnpm dev:frontend` - 仅启动前端
- `pnpm dev:server` - 仅启动后端
- `pnpm build` - 构建所有应用
- `pnpm lint` - 代码检查