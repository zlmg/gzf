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

```bash
pnpm install
```

### 环境配置

1. 复制环境变量示例文件：

```bash
cp apps/frontend/.env.example apps/frontend/.env
cp apps/server/.env.example apps/server/.env
```

2. 配置高德地图 API Key（前端）：
   - 在 `apps/frontend/.env` 中设置 `VITE_AMAP_KEY`

3. 配置 JWT 密钥（后端）：
   - 在 `apps/server/.env` 中设置 `JWT_SECRET`

### 启动开发服务器

```bash
# 同时启动前端和后端
pnpm dev

# 仅启动前端
pnpm dev:frontend

# 仅启动后端
pnpm dev:server
```

前端默认运行在 http://localhost:3000
后端默认运行在 http://localhost:3001

### 构建生产版本

```bash
pnpm build
```

## 目录结构

```
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
```

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

```bash
# 构建命令
pnpm build:frontend

# 输出目录
apps/frontend/dist
```

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

MIT