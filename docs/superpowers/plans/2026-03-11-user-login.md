# 用户登录功能实现计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为公租房应用添加用户登录功能，实现收藏、浏览记录、筛选偏好的跨设备同步

**Architecture:** 前后端分离，JWT 无状态认证。后端使用 Fastify + Prisma + SQLite，前端新增 auth store 和同步 composable，数据变更时自动同步到云端。

**Tech Stack:** Fastify, Prisma, SQLite, bcryptjs, jsonwebtoken (后端); Vue 3, Pinia, Vue Router (前端)

---

## Chunk 1: 后端项目初始化

### 文件结构

```
server/
├── src/
│   ├── index.ts           # 入口文件
│   ├── app.ts             # Fastify 应用配置
│   ├── prisma/
│   │   └── schema.prisma  # 数据模型
│   ├── routes/
│   │   ├── auth.ts        # 认证路由
│   │   └── user.ts        # 用户数据路由
│   ├── middleware/
│   │   └── auth.ts        # JWT 验证中间件
│   └── types/
│       └── index.ts       # 类型定义
├── package.json
├── tsconfig.json
└── .env
```

### Task 1: 初始化后端项目

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/.env`
- Create: `server/.env.example`

- [ ] **Step 1: 创建 server 目录和 package.json**

```bash
mkdir -p server/src/{routes,middleware,types,prisma}
```

```json
{
  "name": "gzf-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@fastify/cors": "^10.0.1",
    "@prisma/client": "^6.4.1",
    "bcryptjs": "^2.4.3",
    "fastify": "^5.2.0",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.8",
    "@types/node": "^22.13.5",
    "prisma": "^6.4.1",
    "tsx": "^4.19.3",
    "typescript": "^5.7.3"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: 创建环境变量文件**

`.env`:
```
DATABASE_URL="file:./data.db"
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"
PORT=3001
```

`.env.example`:
```
DATABASE_URL="file:./data.db"
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"
PORT=3001
```

- [ ] **Step 4: 安装依赖**

```bash
cd server && pnpm install
```

Expected: 依赖安装成功

- [ ] **Step 5: Commit**

```bash
git add server/
git commit -m "chore(server): 初始化后端项目结构

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: 配置 Prisma 数据模型

**Files:**
- Create: `server/src/prisma/schema.prisma`
- Create: `server/src/prisma/client.ts`

- [ ] **Step 1: 创建 Prisma schema**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  password  String
  favorites Json     @default("[]")
  history   Json     @default("[]")
  preferences Json   @default("{}")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

- [ ] **Step 2: 生成 Prisma client**

```bash
cd server && pnpm db:generate
```

Expected: Prisma client 生成成功

- [ ] **Step 3: 创建 Prisma client 单例**

`server/src/prisma/client.ts`:
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production')
  globalForPrisma.prisma = prisma
```

- [ ] **Step 4: 运行数据库迁移**

```bash
cd server && pnpm db:migrate --name init
```

Expected: 迁移成功，生成 `prisma/data.db`

- [ ] **Step 5: Commit**

```bash
git add server/
git commit -m "feat(server): 配置 Prisma 数据模型

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: 创建类型定义

**Files:**
- Create: `server/src/types/index.ts`

- [ ] **Step 1: 创建类型定义文件**

```typescript
import type { User } from '@prisma/client'
import type { FastifyRequest } from 'fastify'

// ============ 收藏相关类型 ============
export interface FavoriteItem {
  projectNo: string
  projectName: string
  location: string
  layout: string
  roomType: string
  minRent: number
  maxRent: number
  thumbnail: string
  kezuCount: number
  openQueue: string
  addedAt: number // timestamp
  // 可选字段
  district?: string
  houseType?: string
  totalCount?: string
  openingDate?: string
  totalArea?: string
  houseSource?: string
  roomTypeDetails?: RoomTypeDetail[]
}

// ============ 浏览记录相关类型 ============
export interface HistoryItem {
  projectNo: string
  projectName: string
  location: string
  layout: string
  roomType: string
  minRent: number
  maxRent: number
  thumbnail: string
  kezuCount: number
  openQueue: string
  viewedAt: number // 浏览时间戳（毫秒）
  // 可选字段
  district?: string
  houseType?: string
  totalCount?: string
  openingDate?: string
  totalArea?: string
  houseSource?: string
  roomTypeDetails?: RoomTypeDetail[]
}

// ============ 户型详情类型 ============
export interface HouseType {
  area: string
  vrUrl: string
  roomPicUrl: string
  roomDescription: string
  roomLabel: string
  houseTypeName: string
  roomEquipment: string
  towards: string
  roomType: string
}

export interface RoomTypeDetail {
  queueCount: number
  maxRent: number
  minRent: number
  totalCount: number
  kezuCount: number
  houseTypeList: HouseType[]
}

// ============ 筛选偏好相关类型 ============
export type SortField = 'minPrice' | 'maxPrice' | 'kezuCount' | 'openingDate' | 'minArea' | 'maxArea' | ''
export type SortOrder = 'asc' | 'desc'

export interface FilterState {
  layout: string[]
  roomType: string[]
  priceRange: [number, number]
  keyword: string
  availableStatus: '' | 'available' | 'unavailable'
  openStatus: '' | 'open' | 'closed'
  equipment: string[]
  label: string[]
  areaRange: [number, number]
  towards: string[]
  excludeLayout: boolean
  excludeRoomType: boolean
  excludeEquipment: boolean
  excludeLabel: boolean
  excludeTowards: boolean
}

export interface SortState {
  field: SortField
  order: SortOrder
}

export interface Preferences {
  filters: FilterState
  sort: SortState
}

// ============ 请求体类型 ============
export interface RegisterBody {
  username: string
  password: string
}

export interface LoginBody {
  username: string
  password: string
}

export interface SyncFavoritesBody {
  favorites: FavoriteItem[]
}

export interface SyncHistoryBody {
  history: HistoryItem[]
}

export interface SyncPreferencesBody {
  preferences: Preferences
}

// 扩展 Fastify 类型
declare module 'fastify' {
  interface FastifyRequest {
    user?: Pick<User, 'id' | 'username'>
  }
}

// ============ 响应类型 ============
export interface AuthResponse {
  success: boolean
  message: string
  token?: string
  user?: {
    id: number
    username: string
  }
}

export interface UserDataResponse {
  success: boolean
  data: {
    favorites: FavoriteItem[]
    history: HistoryItem[]
    preferences: Preferences
  }
}

export interface SyncResponse {
  success: boolean
  message: string
}
```

- [ ] **Step 2: Commit**

```bash
git add server/src/types/
git commit -m "feat(server): 添加类型定义

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: 创建 JWT 认证中间件

**Files:**
- Create: `server/src/middleware/auth.ts`

- [ ] **Step 1: 创建认证中间件**

```typescript
import type { FastifyReply, FastifyRequest } from 'fastify'
import jwt from 'jsonwebtoken'
import { prisma } from '../prisma/client.js'

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret'

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      success: false,
      message: '未提供认证令牌'
    })
  }

  const token = authHeader.slice(7)

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number, username: string }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, username: true }
    })

    if (!user) {
      return reply.status(401).send({
        success: false,
        message: '用户不存在'
      })
    }

    request.user = user
  }
  catch (error) {
    return reply.status(401).send({
      success: false,
      message: '令牌无效或已过期'
    })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add server/src/middleware/
git commit -m "feat(server): 添加 JWT 认证中间件

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 2: 后端 API 实现

### Task 5: 创建认证路由

**Files:**
- Create: `server/src/routes/auth.ts`

- [ ] **Step 1: 创建认证路由**

```typescript
import type { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../prisma/client.js'

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

const registerSchema = z.object({
  username: z.string().min(3, '用户名至少3个字符').max(20, '用户名最多20个字符'),
  password: z.string().min(6, '密码至少6个字符')
})

const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码')
})

export async function authRoutes(app: FastifyInstance) {
  // 注册
  app.post('/register', async (request, reply) => {
    const body = request.body as unknown

    const parseResult = registerSchema.safeParse(body)
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        message: parseResult.error.errors[0]?.message || '参数错误'
      })
    }

    const { username, password } = parseResult.data

    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUser) {
      return reply.status(400).send({
        success: false,
        message: '用户名已存在'
      })
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 创建用户
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword
      }
    })

    // 生成 token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    return reply.status(201).send({
      success: true,
      message: '注册成功',
      token,
      user: {
        id: user.id,
        username: user.username
      }
    })
  })

  // 登录
  app.post('/login', async (request, reply) => {
    const body = request.body as unknown

    const parseResult = loginSchema.safeParse(body)
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        message: parseResult.error.errors[0]?.message || '参数错误'
      })
    }

    const { username, password } = parseResult.data

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      return reply.status(401).send({
        success: false,
        message: '用户名或密码错误'
      })
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      return reply.status(401).send({
        success: false,
        message: '用户名或密码错误'
      })
    }

    // 生成 token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    return reply.send({
      success: true,
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username
      }
    })
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add server/src/routes/
git commit -m "feat(server): 添加注册和登录 API

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6: 创建用户数据路由

**Files:**
- Create: `server/src/routes/user.ts`

- [ ] **Step 1: 创建用户数据路由**

```typescript
import type { FastifyInstance } from 'fastify'
import { authMiddleware } from '../middleware/auth.js'
import { prisma } from '../prisma/client.js'

export async function userRoutes(app: FastifyInstance) {
  // 所有用户路由都需要认证
  app.addHook('preHandler', authMiddleware)

  // 获取用户所有数据
  app.get('/data', async (request, reply) => {
    const userId = request.user!.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        favorites: true,
        history: true,
        preferences: true
      }
    })

    if (!user) {
      return reply.status(404).send({
        success: false,
        message: '用户不存在'
      })
    }

    return reply.send({
      success: true,
      data: {
        favorites: user.favorites,
        history: user.history,
        preferences: user.preferences
      }
    })
  })

  // 同步收藏
  app.put('/favorites', async (request, reply) => {
    const userId = request.user!.id
    const body = request.body as { favorites?: unknown }

    if (!body || !Array.isArray(body.favorites)) {
      return reply.status(400).send({
        success: false,
        message: '无效的收藏数据'
      })
    }

    await prisma.user.update({
      where: { id: userId },
      data: { favorites: body.favorites }
    })

    return reply.send({
      success: true,
      message: '收藏同步成功'
    })
  })

  // 同步浏览记录
  app.put('/history', async (request, reply) => {
    const userId = request.user!.id
    const body = request.body as { history?: unknown }

    if (!body || !Array.isArray(body.history)) {
      return reply.status(400).send({
        success: false,
        message: '无效的浏览记录数据'
      })
    }

    await prisma.user.update({
      where: { id: userId },
      data: { history: body.history }
    })

    return reply.send({
      success: true,
      message: '浏览记录同步成功'
    })
  })

  // 同步筛选偏好
  app.put('/preferences', async (request, reply) => {
    const userId = request.user!.id
    const body = request.body as { preferences?: unknown }

    if (!body || typeof body.preferences !== 'object') {
      return reply.status(400).send({
        success: false,
        message: '无效的偏好数据'
      })
    }

    await prisma.user.update({
      where: { id: userId },
      data: { preferences: body.preferences }
    })

    return reply.send({
      success: true,
      message: '偏好同步成功'
    })
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add server/src/routes/
git commit -m "feat(server): 添加用户数据同步 API

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 7: 创建 Fastify 应用入口

**Files:**
- Create: `server/src/app.ts`
- Create: `server/src/index.ts`

- [ ] **Step 1: 创建 Fastify 应用配置**

`server/src/app.ts`:
```typescript
import cors from '@fastify/cors'
import Fastify from 'fastify'
import { authRoutes } from './routes/auth.js'
import { userRoutes } from './routes/user.js'

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
    }
  })

  // 注册 CORS
  await app.register(cors, {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://172.31.7.188:3000'],
    credentials: true
  })

  // 健康检查
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  // 注册路由
  app.register(authRoutes, { prefix: '/api/auth' })
  app.register(userRoutes, { prefix: '/api/user' })

  return app
}
```

- [ ] **Step 2: 创建入口文件**

`server/src/index.ts`:
```typescript
import { buildApp } from './app.js'

const PORT = Number(process.env.PORT) || 3001

async function start() {
  const app = await buildApp()

  try {
    await app.listen({ port: PORT, host: '0.0.0.0' })
    console.log(`Server running at http://localhost:${PORT}`)
  }
  catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
```

- [ ] **Step 3: 测试后端启动**

```bash
cd server && pnpm dev
```

Expected: 服务器在端口 3001 启动成功

- [ ] **Step 4: Commit**

```bash
git add server/src/
git commit -m "feat(server): 创建 Fastify 应用入口

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 3: 前端类型和 API 层

### Task 8: 创建用户类型定义

**Files:**
- Create: `src/types/user.ts`

- [ ] **Step 1: 创建类型定义文件**

```typescript
import type { FilterState, RoomTypeDetail, SortField, SortOrder } from './property'

// ============ 用户信息 ============
export interface User {
  id: number
  username: string
}

// ============ 收藏相关类型 ============
export interface FavoriteItem {
  projectNo: string
  projectName: string
  location: string
  layout: string
  roomType: string
  minRent: number
  maxRent: number
  thumbnail: string
  kezuCount: number
  openQueue: string
  addedAt: number
  district?: string
  houseType?: string
  totalCount?: string
  openingDate?: string
  totalArea?: string
  houseSource?: string
  roomTypeDetails?: RoomTypeDetail[]
}

// ============ 浏览记录相关类型 ============
export interface HistoryItem {
  projectNo: string
  projectName: string
  location: string
  layout: string
  roomType: string
  minRent: number
  maxRent: number
  thumbnail: string
  kezuCount: number
  openQueue: string
  viewedAt: number
  district?: string
  houseType?: string
  totalCount?: string
  openingDate?: string
  totalArea?: string
  houseSource?: string
  roomTypeDetails?: RoomTypeDetail[]
}

// ============ 筛选偏好相关类型 ============
export interface SortState {
  field: SortField
  order: SortOrder
}

export interface Preferences {
  filters: FilterState
  sort: SortState
}

// ============ 认证响应 ============
export interface AuthResponse {
  success: boolean
  message: string
  token?: string
  user?: User
}

// ============ 用户数据响应 ============
export interface UserDataResponse {
  success: boolean
  data: {
    favorites: FavoriteItem[]
    history: HistoryItem[]
    preferences: Preferences
  }
}

// ============ 同步响应 ============
export interface SyncResponse {
  success: boolean
  message: string
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/user.ts
git commit -m "feat(frontend): 添加用户相关类型定义

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 9: 创建 API 请求封装

**Files:**
- Create: `src/api/index.ts`

- [ ] **Step 1: 创建 API 封装**

```typescript
import type { AuthResponse, FavoriteItem, HistoryItem, Preferences, SyncResponse, UserDataResponse } from '@/types/user'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('gzf-token')

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  })

  const data = await response.json()

  if (!response.ok) {
    throw new ApiError(
      data.message || '请求失败',
      response.status,
      data
    )
  }

  return data
}

// 认证 API
export const authApi = {
  register: (username: string, password: string) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),

  login: (username: string, password: string) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
}

// 用户数据 API
export const userApi = {
  getData: () =>
    request<UserDataResponse>('/api/user/data'),

  syncFavorites: (favorites: FavoriteItem[]) =>
    request<SyncResponse>('/api/user/favorites', {
      method: 'PUT',
      body: JSON.stringify({ favorites })
    }),

  syncHistory: (history: HistoryItem[]) =>
    request<SyncResponse>('/api/user/history', {
      method: 'PUT',
      body: JSON.stringify({ history })
    }),

  syncPreferences: (preferences: Preferences) =>
    request<SyncResponse>('/api/user/preferences', {
      method: 'PUT',
      body: JSON.stringify({ preferences })
    })
}

export { ApiError }
```

- [ ] **Step 2: Commit**

```bash
git add src/api/
git commit -m "feat(frontend): 创建 API 请求封装

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 4: 认证 Store

### Task 10: 创建 auth store

**Files:**
- Create: `src/stores/auth.ts`

- [ ] **Step 1: 创建认证 store**

```typescript
import type { FilterState, SortField, SortOrder } from '@/types/property'
import type { FavoriteItem, HistoryItem, Preferences, User } from '@/types/user'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { ApiError, authApi, userApi } from '@/api'
import { useFavoriteStore } from './favorite'
import { useFilterStore } from './filter'
import { useHistoryStore } from './history'

const TOKEN_KEY = 'gzf-token'
const USER_KEY = 'gzf-user'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const syncStatus = ref<'idle' | 'syncing' | 'error'>('idle')

  // 初始化时恢复用户信息
  const storedUser = localStorage.getItem(USER_KEY)
  if (storedUser) {
    try {
      user.value = JSON.parse(storedUser)
    }
    catch {
      localStorage.removeItem(USER_KEY)
    }
  }

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  // 登录
  const login = async (username: string, password: string) => {
    loading.value = true
    error.value = null

    try {
      const response = await authApi.login(username, password)

      if (response.success && response.token && response.user) {
        token.value = response.token
        user.value = response.user
        localStorage.setItem(TOKEN_KEY, response.token)
        localStorage.setItem(USER_KEY, JSON.stringify(response.user))

        // 登录成功后拉取云端数据
        await pullCloudData()

        return { success: true }
      }

      return { success: false, message: response.message }
    }
    catch (e) {
      const message = e instanceof ApiError ? e.message : '登录失败'
      error.value = message
      return { success: false, message }
    }
    finally {
      loading.value = false
    }
  }

  // 注册
  const register = async (username: string, password: string) => {
    loading.value = true
    error.value = null

    try {
      const response = await authApi.register(username, password)

      if (response.success && response.token && response.user) {
        token.value = response.token
        user.value = response.user
        localStorage.setItem(TOKEN_KEY, response.token)
        localStorage.setItem(USER_KEY, JSON.stringify(response.user))

        return { success: true }
      }

      return { success: false, message: response.message }
    }
    catch (e) {
      const message = e instanceof ApiError ? e.message : '注册失败'
      error.value = message
      return { success: false, message }
    }
    finally {
      loading.value = false
    }
  }

  // 登出
  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  // 拉取云端数据并合并
  const pullCloudData = async () => {
    if (!isAuthenticated.value)
      return

    try {
      syncStatus.value = 'syncing'
      const response = await userApi.getData()

      if (response.success && response.data) {
        // 合并收藏（本地优先）
        if (Array.isArray(response.data.favorites)) {
          mergeFavorites(response.data.favorites)
        }

        // 合并浏览记录（本地优先）
        if (Array.isArray(response.data.history)) {
          mergeHistory(response.data.history)
        }

        // 合并筛选偏好
        if (response.data.preferences) {
          mergePreferences(response.data.preferences)
        }
      }

      syncStatus.value = 'idle'
    }
    catch (e) {
      console.error('Failed to pull cloud data:', e)
      syncStatus.value = 'error'
    }
  }

  // 合并收藏数据
  const mergeFavorites = (cloudFavorites: FavoriteItem[]) => {
    const favoriteStore = useFavoriteStore()
    const localFavorites = [...favoriteStore.favorites]

    // 创建合并 map，以 projectNo 为 key
    const merged = new Map<string, FavoriteItem>()

    // 先加入本地数据
    for (const item of localFavorites) {
      merged.set(item.projectNo, item)
    }

    // 合并云端数据，比较时间戳
    for (const cloudItem of cloudFavorites) {
      const localItem = merged.get(cloudItem.projectNo)
      if (!localItem || (cloudItem.addedAt && cloudItem.addedAt > localItem.addedAt)) {
        merged.set(cloudItem.projectNo, cloudItem)
      }
    }

    // 更新 store
    favoriteStore.favorites = [...merged.values()].sort((a, b) => b.addedAt - a.addedAt).slice(0, 50) // 限制最大数量

    // 保存到 localStorage
    localStorage.setItem('gzf-favorites', JSON.stringify(favoriteStore.favorites))
  }

  // 合并浏览记录
  const mergeHistory = (cloudHistory: HistoryItem[]) => {
    const historyStore = useHistoryStore()
    const localHistory = [...historyStore.history]

    // 创建合并 map，以 projectNo 为 key
    const merged = new Map<string, HistoryItem>()

    // 先加入本地数据
    for (const item of localHistory) {
      merged.set(item.projectNo, item)
    }

    // 合并云端数据，比较时间戳
    for (const cloudItem of cloudHistory) {
      const localItem = merged.get(cloudItem.projectNo)
      if (!localItem || (cloudItem.viewedAt && cloudItem.viewedAt > localItem.viewedAt)) {
        merged.set(cloudItem.projectNo, cloudItem)
      }
    }

    // 更新 store
    historyStore.history = [...merged.values()].sort((a, b) => b.viewedAt - a.viewedAt).slice(0, 100) // 限制最大数量

    // 保存到 localStorage
    localStorage.setItem('gzf-history', JSON.stringify(historyStore.history))
  }

  // 合并筛选偏好
  const mergePreferences = (prefs: Preferences) => {
    const filterStore = useFilterStore()

    if (prefs.filters) {
      filterStore.filters = { ...filterStore.filters, ...prefs.filters }
      localStorage.setItem('gzf-filters', JSON.stringify(filterStore.filters))
    }

    if (prefs.sort) {
      filterStore.sortField = prefs.sort.field
      filterStore.sortOrder = prefs.sort.order
      localStorage.setItem('gzf-sort', JSON.stringify(prefs.sort))
    }
  }

  return {
    token,
    user,
    loading,
    error,
    syncStatus,
    isAuthenticated,
    login,
    register,
    logout,
    pullCloudData
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add src/stores/auth.ts
git commit -m "feat(frontend): 创建认证 store

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 5: 数据同步 Composable

### Task 11: 创建 useSync composable

**Files:**
- Create: `src/composables/useSync.ts`

- [ ] **Step 1: 创建同步 composable**

```typescript
import type { Preferences } from '@/types/user'
import { useDebounceFn } from '@vueuse/core'
import { ref, watch } from 'vue'
import { userApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useFavoriteStore } from '@/stores/favorite'
import { useFilterStore } from '@/stores/filter'
import { useHistoryStore } from '@/stores/history'

export function useSync() {
  const authStore = useAuthStore()
  const favoriteStore = useFavoriteStore()
  const historyStore = useHistoryStore()
  const filterStore = useFilterStore()

  const isSyncing = ref(false)
  const syncError = ref<string | null>(null)

  // 同步收藏
  const syncFavorites = async () => {
    if (!authStore.isAuthenticated || isSyncing.value)
      return

    try {
      isSyncing.value = true
      await userApi.syncFavorites(favoriteStore.favorites)
    }
    catch (e) {
      console.error('Failed to sync favorites:', e)
      syncError.value = '收藏同步失败'
    }
    finally {
      isSyncing.value = false
    }
  }

  // 同步浏览记录
  const syncHistory = async () => {
    if (!authStore.isAuthenticated || isSyncing.value)
      return

    try {
      isSyncing.value = true
      await userApi.syncHistory(historyStore.history)
    }
    catch (e) {
      console.error('Failed to sync history:', e)
      syncError.value = '浏览记录同步失败'
    }
    finally {
      isSyncing.value = false
    }
  }

  // 同步筛选偏好
  const syncPreferences = async () => {
    if (!authStore.isAuthenticated || isSyncing.value)
      return

    try {
      isSyncing.value = true
      const preferences: Preferences = {
        filters: filterStore.filters,
        sort: {
          field: filterStore.sortField,
          order: filterStore.sortOrder
        }
      }
      await userApi.syncPreferences(preferences)
    }
    catch (e) {
      console.error('Failed to sync preferences:', e)
      syncError.value = '偏好同步失败'
    }
    finally {
      isSyncing.value = false
    }
  }

  // 同步所有数据
  const syncAll = async () => {
    if (!authStore.isAuthenticated)
      return

    isSyncing.value = true
    syncError.value = null

    try {
      await Promise.all([
        syncFavorites(),
        syncHistory(),
        syncPreferences()
      ])
    }
    finally {
      isSyncing.value = false
    }
  }

  // 防抖同步（2秒后执行）
  const debouncedSyncFavorites = useDebounceFn(syncFavorites, 2000)
  const debouncedSyncHistory = useDebounceFn(syncHistory, 2000)
  const debouncedSyncPreferences = useDebounceFn(syncPreferences, 2000)

  // 监听数据变化，自动同步
  const startAutoSync = () => {
    // 监听收藏变化
    watch(
      () => favoriteStore.favorites,
      () => {
        if (authStore.isAuthenticated) {
          debouncedSyncFavorites()
        }
      },
      { deep: true }
    )

    // 监听浏览记录变化
    watch(
      () => historyStore.history,
      () => {
        if (authStore.isAuthenticated) {
          debouncedSyncHistory()
        }
      },
      { deep: true }
    )

    // 监听筛选偏好变化
    watch(
      () => [filterStore.filters, filterStore.sortField, filterStore.sortOrder],
      () => {
        if (authStore.isAuthenticated) {
          debouncedSyncPreferences()
        }
      },
      { deep: true }
    )
  }

  return {
    isSyncing,
    syncError,
    syncFavorites,
    syncHistory,
    syncPreferences,
    syncAll,
    startAutoSync
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/composables/useSync.ts
git commit -m "feat(frontend): 创建数据同步 composable

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 6: 登录/注册页面

### Task 12: 创建登录页面

**Files:**
- Create: `src/views/LoginView.vue`

- [ ] **Step 1: 创建登录页面**

```vue
<script setup lang="ts">
import { Lock, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const formRef = ref()

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为3-20个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' }
  ]
}

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid)
    return

  const result = await authStore.login(username.value, password.value)

  if (result.success) {
    ElMessage.success('登录成功')
    router.push('/')
  }
  else {
    ElMessage.error(result.message || '登录失败')
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          登录账号
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          登录后可跨设备同步收藏和浏览记录
        </p>
      </div>

      <el-form
        ref="formRef"
        :model="{ username, password }"
        :rules="rules"
        class="mt-8 space-y-6"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="username"
            placeholder="用户名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="password"
            type="password"
            placeholder="密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-button
          type="primary"
          size="large"
          class="w-full"
          :loading="authStore.loading"
          @click="handleLogin"
        >
          登录
        </el-button>

        <div class="text-center">
          <RouterLink
            to="/register"
            class="text-sm text-blue-600 hover:text-blue-500"
          >
            没有账号？立即注册
          </RouterLink>
        </div>
      </el-form>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/views/LoginView.vue
git commit -m "feat(frontend): 创建登录页面

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 13: 创建注册页面

**Files:**
- Create: `src/views/RegisterView.vue`

- [ ] **Step 1: 创建注册页面**

```vue
<script setup lang="ts">
import { Lock, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const formRef = ref()

function validateConfirmPassword(_rule: unknown, value: string, callback: (error?: Error) => void) {
  if (value !== password.value) {
    callback(new Error('两次输入的密码不一致'))
  }
  else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为3-20个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

async function handleRegister() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid)
    return

  const result = await authStore.register(username.value, password.value)

  if (result.success) {
    ElMessage.success('注册成功')
    router.push('/')
  }
  else {
    ElMessage.error(result.message || '注册失败')
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          注册账号
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          注册后可跨设备同步收藏和浏览记录
        </p>
      </div>

      <el-form
        ref="formRef"
        :model="{ username, password, confirmPassword }"
        :rules="rules"
        class="mt-8 space-y-6"
        @submit.prevent="handleRegister"
      >
        <el-form-item prop="username">
          <el-input
            v-model="username"
            placeholder="用户名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="password"
            type="password"
            placeholder="密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input
            v-model="confirmPassword"
            type="password"
            placeholder="确认密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-button
          type="primary"
          size="large"
          class="w-full"
          :loading="authStore.loading"
          @click="handleRegister"
        >
          注册
        </el-button>

        <div class="text-center">
          <RouterLink
            to="/login"
            class="text-sm text-blue-600 hover:text-blue-500"
          >
            已有账号？立即登录
          </RouterLink>
        </div>
      </el-form>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/views/RegisterView.vue
git commit -m "feat(frontend): 创建注册页面

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 7: AppHeader 和路由更新

### Task 14: 更新 AppHeader 添加登录入口

**Files:**
- Modify: `src/components/Layout/AppHeader.vue`

- [ ] **Step 1: 在 script setup 中添加 auth 相关逻辑**

在现有 import 后添加：

```typescript
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

function handleLogout() {
  authStore.logout()
  ElMessage.success('已退出登录')
}
```

- [ ] **Step 2: 在桌面导航中添加登录/用户菜单**

在 `<nav class="hidden md:flex ...">` 中的 `<input ref="fileInput".../>` 后添加：

```vue
<!-- 登录/用户入口 -->
<div class="flex items-center">
  <template v-if="authStore.isAuthenticated">
    <el-dropdown trigger="click">
      <button class="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-1.5 text-sm">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        {{ authStore.user?.username }}
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item @click="handleLogout">
            退出登录
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </template>
  <RouterLink
    v-else
    to="/login"
    class="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-1.5 text-sm"
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
    登录
  </RouterLink>
</div>
```

- [ ] **Step 3: 在移动端导航中添加登录入口**

在移动端导航的最后一个 button 后添加：

```vue
<!-- 移动端登录入口 -->
<template v-if="authStore.isAuthenticated">
  <div class="px-4 py-3 flex items-center justify-between">
    <span class="flex items-center gap-2">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      {{ authStore.user?.username }}
    </span>
    <button
      class="text-sm text-red-200 hover:text-red-100"
      @click="handleLogout"
    >
      退出
    </button>
  </div>
</template>

<RouterLink
  v-else
  to="/login"
  class="px-4 py-3 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
  @click="closeMobileMenu"
>
  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
  登录
</RouterLink>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Layout/AppHeader.vue
git commit -m "feat(frontend): AppHeader 添加登录入口和用户菜单

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 15: 更新路由配置

**Files:**
- Modify: `src/router/index.ts`

- [ ] **Step 1: 添加登录和注册路由**

在现有 routes 数组中添加：

```typescript
{
  path: '/login',
  name: 'login',
  component: () => import('@/views/LoginView.vue'),
  meta: { guest: true }
},
{
  path: '/register',
  name: 'register',
  component: () => import('@/views/RegisterView.vue'),
  meta: { guest: true }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/router/index.ts
git commit -m "feat(frontend): 添加登录和注册路由

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Chunk 8: 应用初始化和最终测试

### Task 16: 在 App.vue 中初始化自动同步

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: 读取现有 App.vue 内容**

- [ ] **Step 2: 在 script setup 中添加自动同步初始化**

在现有代码中添加：

```typescript
import { useSync } from '@/composables/useSync'

const { startAutoSync } = useSync()

// 启动自动同步
startAutoSync()
```

- [ ] **Step 3: Commit**

```bash
git add src/App.vue
git commit -m "feat(frontend): 应用启动时初始化自动同步

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 17: 添加环境变量配置

**Files:**
- Create: `.env.example`
- Create: `.env` (本地)

- [ ] **Step 1: 创建环境变量示例文件**

`.env.example`:
```
VITE_AMAP_KEY=your-amap-key
VITE_API_BASE=http://localhost:3001
```

- [ ] **Step 2: 创建本地环境变量文件**

`.env`:
```
VITE_AMAP_KEY=your-amap-key
VITE_API_BASE=http://localhost:3001
```

- [ ] **Step 3: 更新 .gitignore**

确保 `.env` 在 `.gitignore` 中

- [ ] **Step 4: Commit**

```bash
git add .env.example
git commit -m "chore: 添加环境变量配置示例

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 18: 最终集成测试

- [ ] **Step 1: 启动后端服务**

```bash
cd server && pnpm dev
```

Expected: 后端在 http://localhost:3001 启动

- [ ] **Step 2: 启动前端服务**

```bash
pnpm dev
```

Expected: 前端在 http://localhost:3000 启动

- [ ] **Step 3: 测试注册流程**

1. 访问 http://localhost:3000/register
2. 输入用户名和密码注册
3. 验证注册成功后自动登录并跳转首页

- [ ] **Step 4: 测试登录流程**

1. 点击退出登录
2. 访问 http://localhost:3000/login
3. 输入用户名和密码登录
4. 验证登录成功后跳转首页

- [ ] **Step 5: 测试数据同步**

1. 登录状态下收藏一个房源
2. 查看浏览器 Network 面板，验证 PUT /api/user/favorites 请求
3. 退出登录再重新登录
4. 验证收藏数据已恢复

- [ ] **Step 6: Commit 最终代码**

```bash
git add -A
git commit -m "feat: 完成用户登录功能

- JWT 认证
- 收藏、浏览记录、筛选偏好跨设备同步
- 自动同步防抖处理

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## 总结

实现完成后，用户可以：

1. 注册账号（用户名 + 密码）
2. 登录/退出登录
3. 登录后自动同步收藏、浏览记录、筛选偏好到云端
4. 数据变更时自动同步（2秒防抖）
5. 跨设备访问时数据保持一致
