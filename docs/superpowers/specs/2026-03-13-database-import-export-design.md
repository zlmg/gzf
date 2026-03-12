# 数据库导入导出功能设计文档

## 概述

为应用程序实现数据库级别的导入导出功能，仅对管理员用户（用户名为 "minos"）开放。支持 User 表和 Poi 表的完整数据导出与导入，导入时对重复数据执行跳过策略。

## 架构设计

### 整体架构

采用后端驱动的流式处理方案：

- **后端**：提供专用管理 API 端点，处理 ZIP 文件的创建和解析
- **前端**：在 AppHeader 中添加管理员菜单，调用后端 API 完成操作
- **权限控制**：后端中间件验证用户身份，确保仅 "minos" 用户可访问

### 数据流

```
导出：DB → Prisma → 后端 ZIP 流 → HTTP Response → 前端 → 文件下载
导入：前端文件 → FormData → 后端 → ZIP 解析 → 事务导入 → 响应
```

## API 设计

### 导出端点

```
GET /api/admin/export
Authorization: Bearer <token>

Response: application/zip (stream)
Content-Disposition: attachment; filename="gzf-db-export-YYYY-MM-DD.zip"
```

### 导入端点

```
POST /api/admin/import
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body: file=<zip file>

Response:
{
  "success": boolean,
  "message": string,
  "data": {
    "usersImported": number,
    "usersSkipped": number,
    "poisImported": number,
    "poisSkipped": number
  }
}
```

### ZIP 文件结构

```
gzf-export/
├── manifest.json     # 元数据：{ version, exportedAt, counts: { users, pois } }
├── users.json        # User 记录数组
└── pois.json         # Poi 记录数组
```

### 导出数据格式

**users.json 结构：**
```json
{
  "users": [
    {
      "username": "minos",
      "favorites": "[]",
      "history": "[]",
      "preferences": "{}"
    }
  ]
}
```
- 排除字段：`id`（避免自增冲突）、`password`（安全考虑）、`createdAt`、`updatedAt`
- `favorites`、`history`、`preferences` 保持 JSON 字符串格式（与数据库存储一致）

**pois.json 结构：**
```json
{
  "pois": [
    {
      "latitude": "31.123",
      "longitude": "121.456",
      "category": "subway",
      "data": "[{...}]"
    }
  ]
}
```
- 排除字段：`id`、`createdAt`

**manifest.json 结构：**
```json
{
  "version": "1.0",
  "exportedAt": "2026-03-13T10:30:00.000Z",
  "counts": {
    "users": 5,
    "pois": 100
  }
}
```

## 权限控制

### 管理员中间件

- 复用现有 `authMiddleware` 进行 JWT 验证
- 额外检查：`request.user.username === 'minos'`
- 非管理员用户返回 403 Forbidden

## 数据处理

### 去重策略

**User 表：**
- 唯一键：`username`
- 导入时检查用户名是否存在
- 存在则跳过，保留现有数据

**Poi 表：**
- 唯一键：`[latitude, longitude, category]` 复合键
- 导入时检查相同坐标和分类的记录是否存在
- 存在则跳过，保留现有数据

### 事务处理

使用 Prisma 事务和 `createMany` 批量导入，确保数据一致性：

```typescript
const result = await prisma.$transaction(async (tx) => {
  // 批量导入用户（skipDuplicates 自动跳过已存在的 username）
  const usersResult = await tx.user.createMany({
    data: users,
    skipDuplicates: true
  })

  // 批量导入 POI（skipDuplicates 自动跳过已存在的复合键）
  const poisResult = await tx.poi.createMany({
    data: pois,
    skipDuplicates: true
  })

  return {
    usersImported: usersResult.count,
    usersSkipped: users.length - usersResult.count,
    poisImported: poisResult.count,
    poisSkipped: pois.length - poisResult.count
  }
})
```

## 错误处理

| 错误场景 | 响应 |
|---------|------|
| 非管理员用户 | 403 Forbidden |
| 无效的 ZIP 格式 | 400 Bad Request |
| ZIP 缺少必需文件 | 400 Bad Request |
| JSON 解析失败 | 400 Bad Request |
| 数据验证失败 | 400 Bad Request |
| 数据库错误 | 500 Internal Error，自动回滚 |
| 文件过大 | 413 Payload Too Large（限制 50MB） |

## 数据验证

使用 Zod 定义导入数据的验证 schema：

```typescript
import { z } from 'zod'

// 用户数据验证
const UserSchema = z.object({
  username: z.string().min(1).max(50),
  favorites: z.string(),
  history: z.string(),
  preferences: z.string()
})

// POI 数据验证
const PoiSchema = z.object({
  latitude: z.string().regex(/^\d+\.\d{3}$/),  // 3位小数
  longitude: z.string().regex(/^\d+\.\d{3}$/),
  category: z.string().min(1),
  data: z.string()
})

// manifest 验证
const ManifestSchema = z.object({
  version: z.string(),
  exportedAt: z.string().datetime(),
  counts: z.object({
    users: z.number().int().nonnegative(),
    pois: z.number().int().nonnegative()
  })
})

// 导入文件验证
const ImportDataSchema = z.object({
  manifest: ManifestSchema,
  users: z.array(UserSchema),
  pois: z.array(PoiSchema)
})
```

## TypeScript 类型定义

**前端新增类型**（添加到 `apps/frontend/src/types/user.ts` 或 `api/index.ts`）：

```typescript
export interface ImportResponse {
  success: boolean
  message: string
  data: {
    usersImported: number
    usersSkipped: number
    poisImported: number
    poisSkipped: number
  }
}

export interface ExportCounts {
  users: number
  pois: number
}
```

## 前端 UI

### 管理员菜单位置

- 条件渲染：`authStore.user?.username === 'minos'`
- **与现有 POI 缓存按钮区分**：现有的"导出/导入"按钮处理前端 localStorage 的 POI 缓存，管理员菜单处理数据库级别的数据
- 桌面端：在用户下拉菜单中添加分隔线和"数据库导出"/"数据库导入"选项（与"退出登录"分开）
- 移动端：在移动导航区域用户信息下方添加分隔线和管理员选项

### 导出流程

1. 用户点击"数据库导出"
2. 显示加载状态
3. 请求 `/api/admin/export`
4. 浏览器自动下载 ZIP 文件
5. 显示成功提示及记录数量

### 导入流程

1. 用户点击"数据库导入"
2. 打开文件选择器（仅接受 `.zip`）
3. 显示确认对话框
4. 确认后上传至 `/api/admin/import`
5. 显示上传进度
6. 显示导入结果对话框

### 组件与样式

- 使用 Element Plus 组件：`ElDropdown`、`ElDialog`、`ElProgress`
- 样式与现有 header 按钮保持一致
- 图标：下载图标用于导出，上传图标用于导入

### 前端 API 实现

现有的 `request<T>()` 辅助函数使用 `response.json()`，无法处理二进制文件。需要为 adminApi 添加特殊处理：

**导出（下载二进制文件）：**
```typescript
async exportDatabase(): Promise<void> {
  const token = localStorage.getItem('gzf-token')
  const response = await fetch(`${API_BASE}/api/admin/export`, {
    headers: { Authorization: `Bearer ${token}` }
  })

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = response.headers.get('content-disposition')?.match(/filename="(.+)"/)?.[1] || 'export.zip'
  link.click()
  URL.revokeObjectURL(url)
}
```

**导入（上传文件）：**
```typescript
async importDatabase(file: File): Promise<ImportResponse> {
  const token = localStorage.getItem('gzf-token')
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE}/api/admin/import`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },  // 不设置 Content-Type，让浏览器自动设置 boundary
    body: formData
  })

  return response.json()
}
```

## 文件变更清单

### 新增文件

| 文件路径 | 说明 |
|---------|------|
| `apps/server/src/routes/admin.ts` | 管理 API 路由 |
| `apps/server/src/middleware/admin.ts` | 管理员权限中间件 |

### 修改文件

| 文件路径 | 说明 |
|---------|------|
| `apps/server/src/app.ts` | 注册管理路由，注册 `@fastify/multipart` 插件 |
| `apps/server/package.json` | 添加 archiver、unzipper、@fastify/multipart 依赖 |
| `apps/frontend/src/components/Layout/AppHeader.vue` | 在用户下拉菜单中添加管理员选项 |
| `apps/frontend/src/api/index.ts` | 添加 adminApi 方法（exportDatabase, importDatabase） |

### app.ts 修改示例

```typescript
import multipart from '@fastify/multipart'
import { adminRoutes } from './routes/admin.js'

// 在现有注册之后添加
await app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } })  // 50MB 限制
app.register(adminRoutes, { prefix: '/api/admin' })
```

### admin.ts 中间件实现

```typescript
import type { FastifyRequest, FastifyReply } from 'fastify'
import { authMiddleware } from './auth.js'

export async function adminMiddleware(request: FastifyRequest, reply: FastifyReply) {
  await authMiddleware(request, reply)

  // authMiddleware 失败时会直接返回响应，需要检查是否已发送
  if (reply.sent) return

  if (request.user?.username !== 'minos') {
    return reply.status(403).send({ success: false, message: '无权限访问' })
  }
}
```

> **注意**：`request.user` 类型已在 `apps/server/src/types/index.ts` 中定义，无需重复声明。

## 依赖项

### 后端新增依赖

- `archiver` - 用于创建 ZIP 文件（流式写入）
- `unzipper` - 用于解析上传的 ZIP 文件
- `@fastify/multipart` - 用于处理 multipart/form-data 文件上传（Fastify 5.x 必需）

### 前端

无新增依赖，使用现有的 Element Plus 组件。