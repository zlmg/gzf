# 用户登录功能设计文档

## 概述

为公租房浏览应用添加用户登录功能，实现收藏、浏览记录、筛选偏好的跨设备同步。

## 1. 整体架构

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────┐
│   Vue 前端       │────▶│   Node 后端      │────▶│   SQLite    │
│   (Port 3000)   │◀────│   (Port 3001)   │◀────│   数据库     │
└─────────────────┘     └─────────────────┘     └─────────────┘
        │                       │
        ▼                       ▼
  localStorage            JWT 认证
  (离线缓存)              Prisma ORM
```

**核心流程**：
- 用户登录后，前端获取 JWT token
- 需同步的数据变更时，自动调用后端 API
- 后端验证 token，存储/读取用户数据
- 前端优先使用本地缓存，后台静默同步

## 2. 后端设计

### 技术选型

- **Fastify** - 高性能 Node.js 框架，内置 JSON schema 验证
- **Prisma ORM** - 类型安全，迁移管理方便
- **bcryptjs** - 密码加密
- **jsonwebtoken** - JWT 签发

### API 设计

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录，返回 JWT |
| GET | `/api/user/data` | 获取用户所有同步数据 |
| PUT | `/api/user/favorites` | 同步收藏 |
| PUT | `/api/user/history` | 同步浏览记录 |
| PUT | `/api/user/preferences` | 同步筛选偏好 |

### 数据模型

```prisma
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  password  String   // bcrypt 哈希
  favorites Json     // 收藏数据
  history   Json     // 浏览记录
  createdAt DateTime @default(now())
}
```

## 3. 前端设计

### 新增文件结构

```
src/
├── api/
│   └── index.ts           # API 请求封装
├── stores/
│   └── auth.ts            # 用户认证状态
├── composables/
│   └── useSync.ts         # 数据同步逻辑
├── views/
│   ├── LoginView.vue      # 登录页
│   └── RegisterView.vue   # 注册页
└── types/
    └── user.ts            # 用户相关类型
```

### auth store 设计

```typescript
// 状态：user, token, isAuthenticated
// 操作：login(), register(), logout()
// 持久化：token 存 localStorage，自动恢复登录态
```

### 同步策略

1. **登录时**：拉取云端数据，合并本地数据（本地优先）
2. **数据变更时**：防抖 2 秒后自动同步到云端
3. **退出登录**：清除本地 token，保留本地数据

### UI 变更

- AppHeader 右上角添加「登录/用户头像」入口
- 登录后显示用户名 + 同步状态图标

## 4. 数据同步与错误处理

### 同步流程

```
用户操作 → 更新本地 store → 防抖等待 → 推送到云端
                ↓
           离线时存队列 → 联网后重试
```

### 合并策略

- **收藏**：按 `addedAt` 时间戳，保留最新的
- **浏览记录**：按访问时间，保留最近 100 条
- **筛选偏好**：直接覆盖，以最后修改为准

### 错误处理

- 网络失败：静默重试 3 次，显示离线提示
- Token 过期：自动跳转登录页
- 冲突解决：本地优先，后台合并

### 安全性

- 密码 bcrypt 加密（cost=10）
- JWT 有效期 7 天
- API 请求需验证 Authorization header

## 5. 实现范围

### 同步数据

- 收藏数据（favorites）
- 浏览记录（history）
- 筛选偏好（preferences）