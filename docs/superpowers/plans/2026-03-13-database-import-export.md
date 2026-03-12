# 数据库导入导出功能实现计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement admin-only database export/import functionality for User and Poi tables with ZIP file format.

**Architecture:** Backend-driven streaming approach. Admin middleware checks username === 'minos'. Export creates ZIP with manifest, users.json, pois.json. Import validates ZIP, uses Prisma transactions with skipDuplicates. Frontend adds admin menu in user dropdown.

**Tech Stack:** Fastify 5, Prisma, Zod, archiver, unzipper, @fastify/multipart, Vue 3, Element Plus

---

## File Structure

**New files:**
- `apps/server/src/middleware/admin.ts` - Admin permission middleware
- `apps/server/src/routes/admin.ts` - Export/import API routes

**Modified files:**
- `apps/server/package.json` - Add dependencies
- `apps/server/src/app.ts` - Register multipart plugin and admin routes
- `apps/frontend/src/api/index.ts` - Add adminApi methods and types
- `apps/frontend/src/components/Layout/AppHeader.vue` - Add admin menu

---

## Chunk 1: Backend Dependencies and Admin Middleware

### Task 1: Install Backend Dependencies

**Files:**
- Modify: `apps/server/package.json`

- [ ] **Step 1: Install required packages**

Run:
```bash
cd /Users/minos/File/WebFile/demo/gzf && pnpm --filter server add archiver unzipper @fastify/multipart
```

Expected: Packages installed successfully

- [ ] **Step 2: Install type definitions for archiver**

Run:
```bash
pnpm --filter server add -D @types/archiver
```

Expected: Type definitions installed

- [ ] **Step 3: Verify installation**

Run:
```bash
cat apps/server/package.json | grep -E "(archiver|unzipper|multipart)"
```

Expected: Shows all three packages in dependencies

- [ ] **Step 4: Commit**

```bash
git add apps/server/package.json pnpm-lock.yaml
git commit -m "chore(server): add archiver, unzipper, @fastify/multipart dependencies"
```

---

### Task 2: Create Admin Middleware

**Files:**
- Create: `apps/server/src/middleware/admin.ts`

- [ ] **Step 1: Create admin middleware file**

```typescript
// apps/server/src/middleware/admin.ts
import type { FastifyRequest, FastifyReply } from 'fastify'
import { authMiddleware } from './auth.js'

export async function adminMiddleware(request: FastifyRequest, reply: FastifyReply) {
  await authMiddleware(request, reply)

  // authMiddleware 失败时会直接返回响应，需要检查是否已发送
  if (reply.sent) return

  if (request.user?.username !== 'minos') {
    return reply.status(403).send({
      success: false,
      message: '无权限访问'
    })
  }
}
```

- [ ] **Step 2: Verify file created**

Run:
```bash
cat apps/server/src/middleware/admin.ts
```

Expected: File content matches above

- [ ] **Step 3: Commit**

```bash
git add apps/server/src/middleware/admin.ts
git commit -m "feat(server): add admin middleware for permission control"
```

---

## Chunk 2: Admin Routes - Export Endpoint

### Task 3: Create Admin Routes with Export Endpoint

**Files:**
- Create: `apps/server/src/routes/admin.ts`

- [ ] **Step 1: Create admin routes file with export endpoint**

```typescript
// apps/server/src/routes/admin.ts
import type { FastifyInstance } from 'fastify'
import archiver from 'archiver'
import { Readable } from 'stream'
import { prisma } from '../prisma/client.js'
import { adminMiddleware } from '../middleware/admin.js'

export async function adminRoutes(app: FastifyInstance) {
  // 所有管理路由都需要管理员权限
  app.addHook('preHandler', adminMiddleware)

  // 导出数据库
  app.get('/export', async (request, reply) => {
    try {
      // 查询所有用户（排除敏感字段）
      const users = await prisma.user.findMany({
        select: {
          username: true,
          favorites: true,
          history: true,
          preferences: true
        }
      })

      // 查询所有 POI（排除 id 和 createdAt）
      const pois = await prisma.poi.findMany({
        select: {
          latitude: true,
          longitude: true,
          category: true,
          data: true
        }
      })

      // 创建 manifest
      const manifest = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        counts: {
          users: users.length,
          pois: pois.length
        }
      }

      // 准备 JSON 数据
      const usersData = JSON.stringify({ users }, null, 2)
      const poisData = JSON.stringify({ pois }, null, 2)
      const manifestData = JSON.stringify(manifest, null, 2)

      // 设置响应头
      const filename = `gzf-db-export-${new Date().toISOString().slice(0, 10)}.zip`
      reply.header('Content-Type', 'application/zip')
      reply.header('Content-Disposition', `attachment; filename="${filename}"`)

      // 创建 ZIP 流
      const archive = archiver('zip', { zlib: { level: 9 } })

      // 添加文件到 ZIP
      archive.append(Readable.from([manifestData]), { name: 'manifest.json' })
      archive.append(Readable.from([usersData]), { name: 'users.json' })
      archive.append(Readable.from([poisData]), { name: 'pois.json' })

      // 完成打包
      archive.finalize()

      // 发送流式响应
      return reply.send(archive)
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: '导出失败'
      })
    }
  })
}
```

- [ ] **Step 2: Verify file created**

Run:
```bash
cat apps/server/src/routes/admin.ts
```

Expected: File content matches above

- [ ] **Step 3: Commit**

```bash
git add apps/server/src/routes/admin.ts
git commit -m "feat(server): add admin export endpoint for database backup"
```

---

## Chunk 3: Admin Routes - Import Endpoint

### Task 4: Add Import Endpoint to Admin Routes

**Files:**
- Modify: `apps/server/src/routes/admin.ts`

- [ ] **Step 1: Add Zod import and validation schemas**

First add the import line after the existing imports in `apps/server/src/routes/admin.ts`:

```typescript
import { z } from 'zod'
```

Then add the validation schemas after the imports:

```typescript
import { z } from 'zod'

// 验证 schema
const UserImportSchema = z.object({
  username: z.string().min(1).max(50),
  favorites: z.string(),
  history: z.string(),
  preferences: z.string()
})

const PoiImportSchema = z.object({
  latitude: z.string().regex(/^\d+\.\d{3}$/, '纬度格式错误'),
  longitude: z.string().regex(/^\d+\.\d{3}$/, '经度格式错误'),
  category: z.string().min(1),
  data: z.string()
})

const ManifestSchema = z.object({
  version: z.string(),
  exportedAt: z.string().datetime(),
  counts: z.object({
    users: z.number().int().nonnegative(),
    pois: z.number().int().nonnegative()
  })
})

const ImportFileSchema = z.object({
  manifest: ManifestSchema,
  users: z.array(UserImportSchema),
  pois: z.array(PoiImportSchema)
})
```

- [ ] **Step 2: Add import endpoint**

Add after the export endpoint in `apps/server/src/routes/admin.ts`:

```typescript
  // 导入数据库
  app.post('/import', async (request, reply) => {
    try {
      // 获取上传的文件
      const file = await request.file()

      if (!file) {
        return reply.status(400).send({
          success: false,
          message: '未提供文件'
        })
      }

      // 检查文件类型
      if (!file.filename.endsWith('.zip') && file.mimetype !== 'application/zip') {
        return reply.status(400).send({
          success: false,
          message: '无效的文件格式，请上传 ZIP 文件'
        })
      }

      // 解析 ZIP 文件
      const unzipper = await import('unzipper')
      const buffer = await file.toBuffer()
      const directory = await unzipper.Open.buffer(buffer)

      const files: Record<string, string> = {}

      for (const entry of directory.files) {
        const content = await entry.buffer()
        files[entry.path] = content.toString('utf-8')
      }

      // 验证必需文件存在
      if (!files['manifest.json'] || !files['users.json'] || !files['pois.json']) {
        return reply.status(400).send({
          success: false,
          message: 'ZIP 文件缺少必需文件：manifest.json, users.json 或 pois.json'
        })
      }

      // 解析并验证数据
      let manifest: unknown, users: unknown, pois: unknown

      try {
        manifest = JSON.parse(files['manifest.json'])
        users = JSON.parse(files['users.json']).users
        pois = JSON.parse(files['pois.json']).pois
      } catch (e) {
        return reply.status(400).send({
          success: false,
          message: 'JSON 解析失败，文件格式错误'
        })
      }

      // 验证数据结构
      const validationResult = ImportFileSchema.safeParse({
        manifest,
        users,
        pois
      })

      if (!validationResult.success) {
        return reply.status(400).send({
          success: false,
          message: `数据验证失败：${validationResult.error.message}`
        })
      }

      const validUsers = validationResult.data.users
      const validPois = validationResult.data.pois

      // 事务导入
      const result = await prisma.$transaction(async (tx) => {
        // 批量导入用户
        const usersResult = await tx.user.createMany({
          data: validUsers.map(u => ({
            username: u.username,
            password: '', // 导入的用户需要重置密码
            favorites: u.favorites,
            history: u.history,
            preferences: u.preferences
          })),
          skipDuplicates: true
        })

        // 批量导入 POI
        const poisResult = await tx.poi.createMany({
          data: validPois,
          skipDuplicates: true
        })

        return {
          usersImported: usersResult.count,
          usersSkipped: validUsers.length - usersResult.count,
          poisImported: poisResult.count,
          poisSkipped: validPois.length - poisResult.count
        }
      })

      return reply.send({
        success: true,
        message: '导入成功',
        data: result
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: '导入失败，请检查服务器日志'
      })
    }
  })
```

- [ ] **Step 3: Verify complete file**

Run:
```bash
cat apps/server/src/routes/admin.ts | head -50
cat apps/server/src/routes/admin.ts | tail -50
```

Expected: Both validation schema and import endpoint present

- [ ] **Step 4: Commit**

```bash
git add apps/server/src/routes/admin.ts
git commit -m "feat(server): add admin import endpoint with validation"
```

---

## Chunk 4: Register Admin Routes in App

### Task 5: Update App Configuration

**Files:**
- Modify: `apps/server/src/app.ts`

- [ ] **Step 1: Add imports and register multipart and admin routes**

Replace `apps/server/src/app.ts` with:

```typescript
import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import { authRoutes } from './routes/auth.js'
import { userRoutes } from './routes/user.js'
import { poiRoutes } from './routes/poi.js'
import { adminRoutes } from './routes/admin.js'

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
    }
  })

  // 注册 CORS - 允许所有来源
  await app.register(cors, {
    origin: true,
    credentials: true
  })

  // 注册 multipart - 用于文件上传，限制 50MB
  await app.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024
    }
  })

  // 健康检查
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  // 注册路由
  app.register(authRoutes, { prefix: '/api/auth' })
  app.register(userRoutes, { prefix: '/api/user' })
  app.register(poiRoutes, { prefix: '/api/poi' })
  app.register(adminRoutes, { prefix: '/api/admin' })

  return app
}
```

- [ ] **Step 2: Verify file content**

Run:
```bash
cat apps/server/src/app.ts
```

Expected: multipart and adminRoutes registered

- [ ] **Step 3: Test server starts**

Run:
```bash
cd apps/server && pnpm dev &
sleep 3
curl http://localhost:3001/health
```

Expected: `{"status":"ok","timestamp":"..."}`

- [ ] **Step 4: Stop server and commit**

Run:
```bash
pkill -f "tsx watch" || true
```

```bash
git add apps/server/src/app.ts
git commit -m "feat(server): register multipart plugin and admin routes"
```

---

## Chunk 5: Frontend API and Types

### Task 6: Add Frontend Types and Admin API

**Files:**
- Modify: `apps/frontend/src/api/index.ts`

- [ ] **Step 1: Add types at the top of api/index.ts**

After `PoiSearchResponse` interface, add:

```typescript
// 管理员 API 响应类型
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
```

- [ ] **Step 2: Add adminApi object before the final export**

Add before `export { ApiError }`:

```typescript
// 管理员 API
export const adminApi = {
  // 导出数据库
  exportDatabase: async (): Promise<void> => {
    const token = localStorage.getItem('gzf-token')
    const response = await fetch(`${API_BASE}/api/admin/export`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (!response.ok) {
      const data = await response.json()
      throw new ApiError(data.message || '导出失败', response.status)
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const filename = response.headers.get('content-disposition')?.match(/filename="(.+)"/)?.[1] || 'export.zip'
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  },

  // 导入数据库
  importDatabase: async (file: File): Promise<ImportResponse> => {
    const token = localStorage.getItem('gzf-token')
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE}/api/admin/import`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    })

    const data = await response.json()

    if (!response.ok) {
      throw new ApiError(data.message || '导入失败', response.status, data)
    }

    return data
  }
}
```

- [ ] **Step 3: Verify complete file**

Run:
```bash
cat apps/frontend/src/api/index.ts
```

Expected: `ImportResponse` type and `adminApi` object present

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/api/index.ts
git commit -m "feat(frontend): add adminApi with export/import methods"
```

---

## Chunk 6: Frontend Admin Menu UI

### Task 7: Update AppHeader with Admin Menu

**Files:**
- Modify: `apps/frontend/src/components/Layout/AppHeader.vue`

- [ ] **Step 1: Add adminApi import and computed**

Update the imports in `<script setup>`. Add `computed` and `adminApi` to the existing imports:

```typescript
import type { PoiExportData } from '@/composables/usePoiCache'
import { ElMessage } from 'element-plus'
import { computed, ref } from 'vue'  // Add computed
import { RouterLink } from 'vue-router'
import { usePoiCache } from '@/composables/usePoiCache'
import { useAuthStore } from '@/stores/auth'
import { useFavoriteStore } from '@/stores/favorite'
import { useHistoryStore } from '@/stores/history'
import { adminApi } from '@/api'  // Add this import
```

- [ ] **Step 2: Add admin state and methods**

Add after `const fileInput = ref<HTMLInputElement | null>(null)`:

```typescript
// 管理员功能
const isAdmin = computed(() => authStore.user?.username === 'minos')
const adminFileInput = ref<HTMLInputElement | null>(null)
const importDialogVisible = ref(false)
const importFile = ref<File | null>(null)
const importing = ref(false)
const importResult = ref<{ usersImported: number; usersSkipped: number; poisImported: number; poisSkipped: number } | null>(null)

// 数据库导出
async function handleDbExport() {
  try {
    ElMessage.info('正在导出数据库...')
    await adminApi.exportDatabase()
    ElMessage.success('数据库导出成功')
  } catch (e) {
    const message = e instanceof Error ? e.message : '导出失败'
    ElMessage.error(message)
  }
}

// 触发数据库导入文件选择
function triggerDbImport() {
  adminFileInput.value?.click()
}

// 选择导入文件
function handleDbFileSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    importFile.value = file
    importResult.value = null
    importDialogVisible.value = true
  }
  // 清空文件选择
  if (adminFileInput.value) {
    adminFileInput.value.value = ''
  }
}

// 确认导入
async function confirmImport() {
  if (!importFile.value) return

  importing.value = true
  try {
    const result = await adminApi.importDatabase(importFile.value)
    importResult.value = result.data
    ElMessage.success(`导入成功：用户 ${result.data.usersImported} 条，POI ${result.data.poisImported} 条`)
  } catch (e) {
    const message = e instanceof Error ? e.message : '导入失败'
    ElMessage.error(message)
  } finally {
    importing.value = false
  }
}
```

- [ ] **Step 3: Add admin menu items to desktop navigation**

Find the `<!-- 登录/用户入口 -->` section in the template. Replace the `el-dropdown` section with:

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
                    <!-- 管理员菜单 -->
                    <template v-if="isAdmin">
                      <el-dropdown-item @click="handleDbExport">
                        <div class="flex items-center gap-2">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          数据库导出
                        </div>
                      </el-dropdown-item>
                      <el-dropdown-item @click="triggerDbImport">
                        <div class="flex items-center gap-2">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          数据库导入
                        </div>
                      </el-dropdown-item>
                    </template>
                    <el-dropdown-item :divided="isAdmin" @click="handleLogout">
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

- [ ] **Step 4: Add admin file input and dialog before closing `</header>`**

Add before `</header>`:

```vue
      <!-- 管理员导入文件选择器 -->
      <input ref="adminFileInput" type="file" accept=".zip" class="hidden" @change="handleDbFileSelect">

      <!-- 导入结果对话框 -->
      <el-dialog
        v-model="importDialogVisible"
        title="数据库导入"
        width="400px"
      >
        <div v-if="!importResult">
          <p class="mb-4">确认导入文件：<strong>{{ importFile?.name }}</strong></p>
          <p class="text-gray-500 text-sm">导入时会跳过已存在的记录（用户名相同的用户，坐标和分类相同的POI）</p>
        </div>
        <div v-else>
          <p class="font-medium mb-3">导入完成</p>
          <div class="space-y-2 text-sm">
            <p>用户：导入 {{ importResult.usersImported }} 条，跳过 {{ importResult.usersSkipped }} 条</p>
            <p>POI：导入 {{ importResult.poisImported }} 条，跳过 {{ importResult.poisSkipped }} 条</p>
          </div>
        </div>
        <template #footer>
          <el-button @click="importDialogVisible = false">关闭</el-button>
          <el-button v-if="!importResult" type="primary" :loading="importing" @click="confirmImport">
            确认导入
          </el-button>
        </template>
      </el-dialog>
```

- [ ] **Step 5: Add admin menu to mobile navigation**

Find the mobile menu section (inside the `<!-- 移动端登录入口 -->` template). Replace with:

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
              <!-- 移动端管理员菜单 -->
              <template v-if="isAdmin">
                <div class="border-t border-white/20 my-1" />
                <button
                  class="px-4 py-3 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 text-left w-full"
                  @click="handleDbExport(); closeMobileMenu()"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  数据库导出
                </button>
                <button
                  class="px-4 py-3 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 text-left w-full"
                  @click="triggerDbImport(); closeMobileMenu()"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  数据库导入
                </button>
              </template>
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

- [ ] **Step 6: Verify file compiles**

Run:
```bash
cd apps/frontend && pnpm build 2>&1 | head -30
```

Expected: Build succeeds without errors

- [ ] **Step 7: Commit**

```bash
git add apps/frontend/src/components/Layout/AppHeader.vue
git commit -m "feat(frontend): add admin menu to AppHeader for database export/import"
```

---

## Chunk 7: Integration Testing

### Task 8: Test Complete Flow

**Files:**
- None (manual testing)

- [ ] **Step 1: Start development servers**

Run:
```bash
pnpm dev &
sleep 5
```

Expected: Both frontend and backend running

- [ ] **Step 2: Test export endpoint directly**

Run:
```bash
# First login to get token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"minos","password":"your_password"}' | jq -r '.token')

# Test export
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/admin/export -o test-export.zip

# Verify ZIP contents
unzip -l test-export.zip
```

Expected: ZIP file with manifest.json, users.json, pois.json

- [ ] **Step 3: Test import endpoint**

Run:
```bash
# Test import with the exported file
curl -s -X POST http://localhost:3001/api/admin/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-export.zip" | jq .
```

Expected: JSON response with import counts

- [ ] **Step 4: Test non-admin access is denied**

Run:
```bash
# Create a test user if needed, then test with non-minos user
# This should return 403
```

Expected: 403 Forbidden for non-admin users

- [ ] **Step 5: Clean up test files**

Run:
```bash
rm -f test-export.zip
pkill -f "pnpm dev" || true
```

- [ ] **Step 6: Final commit if any fixes needed**

```bash
git status
# If changes, commit them
```

---

## Summary

After completing all tasks:

1. ✅ Backend has `/api/admin/export` and `/api/admin/import` endpoints
2. ✅ Only user "minos" can access admin features
3. ✅ Export creates a ZIP with manifest, users.json, pois.json
4. ✅ Import validates ZIP and skips duplicates
5. ✅ Frontend has admin menu in user dropdown for "minos" user
6. ✅ Export downloads ZIP, import shows confirmation and result dialog