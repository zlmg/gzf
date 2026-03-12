# Monorepo 重构设计文档

## 概述

将项目前端和后端代码重构为 monorepo 结构，前端代码迁移至 `apps/frontend/`，后端代码迁移至 `apps/server/`，使用 pnpm workspaces 管理。

## 新目录结构

```
gzf/                              # 项目根目录
├── apps/                         # 应用目录
│   ├── frontend/                 # 前端应用
│   │   ├── src/                  # 源代码
│   │   ├── public/               # 静态资源
│   │   ├── index.html            # 入口 HTML
│   │   ├── vite.config.ts        # Vite 配置
│   │   ├── tsconfig.json         # TS 配置
│   │   ├── tsconfig.app.json
│   │   ├── tsconfig.node.json
│   │   ├── eslint.config.mjs     # ESLint 配置
│   │   ├── .env.development      # 环境变量
│   │   ├── .env.production
│   │   ├── .env.example
│   │   └── package.json          # 前端依赖
│   │
│   └── server/                   # 后端应用
│       ├── src/
│       ├── prisma/
│       ├── package.json
│       └── ...
│
├── pnpm-workspace.yaml          # Workspace 配置
├── package.json                 # 根 package.json
├── README.md                    # 项目文档
├── .gitignore
├── .nvmrc
└── vercel.json                  # 部署配置
```

## Workspace 配置

### pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
```

### 根 package.json

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

### 前端 package.json

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
  }
}
```

## 配置文件更新

### vercel.json

```json
{
  "buildCommand": "pnpm build:frontend",
  "outputDirectory": "apps/frontend/dist",
  "installCommand": "pnpm install"
}
```

### .gitignore

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

## README.md 大纲

```markdown
# 上海宝山公租房信息平台

一个用于浏览和比较上海宝山区公租房房源的 Web 应用。

## 技术栈

### 前端
- Vue 3.5 + TypeScript 5.9
- Vite 7 + Tailwind CSS v4
- Pinia 3 + Vue Router 5
- Element Plus + VueUse
- 高德地图 JS API

### 后端
- Node.js + Fastify
- Prisma + SQLite
- JWT 认证

## 环境要求

- Node.js >= 18
- pnpm >= 8

## 快速开始

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

## 目录结构

\`\`\`
apps/
├── frontend/
└── server/
\`\`\`

## 主要功能

- 房源列表与详情
- 筛选与排序
- 收藏与对比
- 地图 POI 查询
- 用户认证

## 部署

## 贡献指南

## 许可证

MIT
```

## 迁移步骤

1. 创建 `apps/` 目录结构
2. 移动前端文件到 `apps/frontend/`
3. 移动后端文件到 `apps/server/`
4. 创建 workspace 配置文件
5. 更新各配置文件路径
6. 创建 README.md
7. 重新安装依赖并验证构建