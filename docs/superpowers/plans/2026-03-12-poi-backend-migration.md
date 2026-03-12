# POI Backend Migration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate Amap POI API calls from frontend to backend with database caching.

**Architecture:** Frontend calls backend `/api/poi/search` endpoint instead of Amap directly. Backend checks database cache first, fetches from Amap API if missing, stores result, and returns data. Frontend retains localStorage as L2 cache.

**Tech Stack:** Fastify, Prisma, SQLite, Vue 3, TypeScript

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `apps/server/prisma/schema.prisma` | Modify | Add Poi model |
| `apps/server/.env` | Modify | Add AMAP_KEY |
| `apps/server/src/routes/poi.ts` | Create | POI search endpoint |
| `apps/server/src/app.ts` | Modify | Register POI routes |
| `apps/frontend/src/api/index.ts` | Modify | Add POI API methods |
| `apps/frontend/src/components/AmapNearby.vue` | Modify | Use backend API |

---

## Chunk 1: Database & Backend

### Task 1: Add Poi Model to Prisma Schema

**Files:**
- Modify: `apps/server/prisma/schema.prisma`

- [ ] **Step 1: Add Poi model to schema**

```prisma
model Poi {
  id        Int      @id @default(autoincrement())
  latitude  String   // 纬度，3位小数
  longitude String   // 经度，3位小数
  category  String   // 分类 key (subway, bus, mall...)
  data      String   // POI 数据 JSON 数组
  createdAt DateTime @default(now())

  @@unique([latitude, longitude, category])
}
```

Append after the `User` model in `apps/server/prisma/schema.prisma`.

- [ ] **Step 2: Generate Prisma client**

Run: `pnpm --filter server db:generate`
Expected: Prisma client generated successfully

- [ ] **Step 3: Create and apply migration**

Run: `pnpm --filter server db:migrate -- --name add_poi_table`
Expected: Migration created and applied

- [ ] **Step 4: Commit**

```bash
git add apps/server/prisma/schema.prisma apps/server/prisma/migrations/
git commit -m "feat(server): add Poi model for caching POI data"
```

---

### Task 2: Configure AMAP_KEY Environment Variable

**Files:**
- Modify: `apps/server/.env`

- [ ] **Step 1: Add AMAP_KEY to backend .env**

Copy the `VITE_AMAP_KEY` value from `apps/frontend/.env` and add to `apps/server/.env`:

```
AMAP_KEY=<your_amap_api_key_value>
```

Note: The value should be the same as `VITE_AMAP_KEY` from the frontend.

- [ ] **Step 2: Commit**

```bash
git add apps/server/.env
git commit -m "chore(server): add AMAP_KEY environment variable"
```

---

### Task 3: Create POI Routes

**Files:**
- Create: `apps/server/src/routes/poi.ts`

- [ ] **Step 1: Create poi.ts route file**

```typescript
import type { FastifyInstance } from 'fastify'
import { prisma } from '../prisma/client.js'

const AMAP_KEY = process.env.AMAP_KEY
const AMAP_API_URL = 'https://restapi.amap.com/v3/place/around'
const MAX_RADIUS = 20000

// POI 分类配置 (与前端保持一致)
const POI_CONFIG: Record<string, { types: string, keywords: string }> = {
  subway: { types: '150500', keywords: '地铁站' },
  bus: { types: '150700', keywords: '公交站' },
  gym: { types: '080111', keywords: '' },
  mall: { types: '060101', keywords: '' },
  shopping: { types: '060100', keywords: '' },
  cinema: { types: '080600|080601|080602', keywords: '' },
  park: { types: '110100', keywords: '' },
  supermarket: { types: '060400', keywords: '' },
  convenience: { types: '060200', keywords: '' },
  market: { types: '060700', keywords: '' },
  food: { types: '050000', keywords: '' },
  government: { types: '130000', keywords: '' },
  sports: { types: '080000', keywords: '' },
  education: { types: '141200', keywords: '' },
  medical: { types: '090100|090200|090300', keywords: '' },
  entertainment: { types: '080000|080100|080200|080300|080400', keywords: '' },
  charging: { types: '011100', keywords: '' },
  transport: { types: '150200', keywords: '火车站' },
  bank: { types: '160100', keywords: '' },
}

export async function poiRoutes(app: FastifyInstance) {
  app.get('/search', async (request, reply) => {
    const query = request.query as {
      latitude?: number
      longitude?: number
      category?: string
    }

    // 参数校验
    if (!query.latitude || !query.longitude || !query.category) {
      return reply.status(400).send({
        success: false,
        message: '缺少必要参数'
      })
    }

    const { latitude, longitude, category } = query

    // 检查分类是否有效
    if (!POI_CONFIG[category]) {
      return reply.status(400).send({
        success: false,
        message: '无效的分类'
      })
    }

    // 坐标取3位小数
    const lat = latitude.toFixed(3)
    const lng = longitude.toFixed(3)

    // 1. 查询数据库缓存
    try {
      const cached = await prisma.poi.findUnique({
        where: {
          latitude_longitude_category: {
            latitude: lat,
            longitude: lng,
            category
          }
        }
      })

      if (cached) {
        request.log.info(`[POI] cache hit: ${lat}, ${lng}, ${category}`)
        return reply.send({
          success: true,
          data: {
            pois: JSON.parse(cached.data),
            searchRadius: MAX_RADIUS,
            fromCache: true
          }
        })
      }
    } catch (e) {
      request.log.error(`[POI] db query error: ${e}`)
    }

    // 2. 检查 AMAP_KEY
    if (!AMAP_KEY) {
      request.log.error('[POI] AMAP_KEY not configured')
      return reply.status(500).send({
        success: false,
        message: '服务器配置错误'
      })
    }

    // 3. 调用高德 API
    request.log.info(`[POI] fetch from amap: ${lat}, ${lng}, ${category}`)

    const config = POI_CONFIG[category]
    const location = `${lng},${lat}`
    const url = `${AMAP_API_URL}?key=${AMAP_KEY}&location=${location}&types=${config.types}&keywords=${encodeURIComponent(config.keywords)}&radius=${MAX_RADIUS}&offset=50&page=1&extensions=all`

    try {
      const response = await fetch(url)
      const result = await response.json() as { status: string, info: string, pois?: any[] }

      if (result.status !== '1') {
        request.log.error(`[POI] amap error: ${result.status} - ${result.info}`)
        return reply.status(502).send({
          success: false,
          message: '高德 API 调用失败'
        })
      }

      const pois = result.pois || []

      // 4. 存入数据库
      try {
        await prisma.poi.create({
          data: {
            latitude: lat,
            longitude: lng,
            category,
            data: JSON.stringify(pois)
          }
        })
        request.log.info(`[POI] saved to db: ${pois.length} pois`)
      } catch (e) {
        request.log.error(`[POI] db save error: ${e}`)
        // 即使保存失败也返回数据
      }

      return reply.send({
        success: true,
        data: {
          pois,
          searchRadius: MAX_RADIUS,
          fromCache: false
        }
      })
    } catch (e) {
      request.log.error(`[POI] fetch error: ${e}`)
      return reply.status(500).send({
        success: false,
        message: '服务器错误'
      })
    }
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/server/src/routes/poi.ts
git commit -m "feat(server): add POI search route with database caching"
```

---

### Task 4: Register POI Routes

**Files:**
- Modify: `apps/server/src/app.ts`

- [ ] **Step 1: Import and register POI routes**

Modify `apps/server/src/app.ts`:

```typescript
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { authRoutes } from './routes/auth.js'
import { userRoutes } from './routes/user.js'
import { poiRoutes } from './routes/poi.js'  // Add this line

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

  // 健康检查
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  // 注册路由
  app.register(authRoutes, { prefix: '/api/auth' })
  app.register(userRoutes, { prefix: '/api/user' })
  app.register(poiRoutes, { prefix: '/api/poi' })  // Add this line

  return app
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/server/src/app.ts
git commit -m "feat(server): register POI routes"
```

---

## Chunk 2: Frontend

### Task 5: Add POI API Method

**Files:**
- Modify: `apps/frontend/src/api/index.ts`

- [ ] **Step 1: Add PoiSearchResponse interface and POI API**

Add to `apps/frontend/src/api/index.ts` after the imports:

```typescript
import type { PoiItem } from '@/composables/usePoiCache'

// POI 搜索响应接口
export interface PoiSearchResponse {
  success: boolean
  data: {
    pois: PoiItem[]
    searchRadius: number
    fromCache: boolean
  }
  message?: string
}
```

Add POI API object after `userApi`:

```typescript
// POI API
export const poiApi = {
  search: (latitude: number | string, longitude: number | string, category: string) =>
    request<PoiSearchResponse>(`/api/poi/search?latitude=${latitude}&longitude=${longitude}&category=${category}`),
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/api/index.ts
git commit -m "feat(frontend): add POI search API method"
```

---

### Task 6: Refactor AmapNearby.vue

**Files:**
- Modify: `apps/frontend/src/components/AmapNearby.vue`

- [ ] **Step 1: Add poiApi import**

Add the import for `poiApi` after the existing imports:

```typescript
import { poiApi } from '@/api/index'
```

- [ ] **Step 2: Replace searchPOI function**

Replace the entire `searchPOI` function:

```typescript
// 搜索周边 POI
async function searchPOI(category: string, forceRefresh = false) {
  activeCategory.value = category
  loading.value = true

  const poiConfig = POI_TYPES.find(p => p.key === category)
  if (!poiConfig)
    return

  // 非强制刷新时，先检查前端缓存
  if (!forceRefresh) {
    const cached = getCached(props.latitude, props.longitude, category, 20000)
    if (cached) {
      poiData.value[category] = cached.pois
      loading.value = false
      return
    }
  }

  try {
    // 调用后端接口
    const result = await poiApi.search(props.latitude, props.longitude, category)

    if (result.success && result.data.pois.length > 0) {
      poiData.value[category] = result.data.pois

      // 保存到前端缓存
      setCached(
        props.latitude,
        props.longitude,
        category,
        20000,
        result.data.pois,
        result.data.searchRadius,
        `${props.longitude},${props.latitude}`,
      )
    }
    else {
      poiData.value[category] = []
    }
  }
  catch (e) {
    console.error('POI search error:', e)
    poiData.value[category] = []
  }
  finally {
    loading.value = false
    isRefreshing.value = false
  }
}
```

- [ ] **Step 3: Update function callers**

Update the calls to `searchPOI` throughout the file to match the new signature `(category, forceRefresh?)`:

```typescript
// 初始化
onMounted(() => {
  searchPOI('subway')
})

// 监听分类切换
watch(activeCategory, (newCategory) => {
  searchPOI(newCategory)
})

// 刷新当前分类数据
function refreshCurrentCategory() {
  isRefreshing.value = true
  searchPOI(activeCategory.value, true)
}
```

- [ ] **Step 4: Simplify changeRadius function**

Replace the `changeRadius` function:

```typescript
// 切换距离筛选
function changeRadius(radius: number) {
  selectedRadius.value = radius
  // 后端固定返回 20km 数据，前端只需筛选本地数据
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/AmapNearby.vue
git commit -m "feat(frontend): refactor AmapNearby to use backend POI API"
```

---

## Chunk 3: Testing & Verification

### Task 7: Test Backend Endpoint

- [ ] **Step 1: Start backend server**

Run: `pnpm dev:server`
Expected: Server starts on port 3001

- [ ] **Step 2: Test POI endpoint manually**

Run:
```bash
curl "http://localhost:3001/api/poi/search?latitude=31.234&longitude=121.473&category=subway"
```

Expected: JSON response with `success: true` and POI data

- [ ] **Step 3: Verify database caching**

Run the same curl command again.
Expected: Response has `fromCache: true`

---

### Task 8: Test Frontend Integration

- [ ] **Step 1: Start both frontend and backend**

Run: `pnpm dev`

- [ ] **Step 2: Test in browser**

1. Open `http://localhost:3000`
2. Navigate to a property detail page
3. Click different POI categories
4. Verify data loads correctly
5. Check distance filter works (local filtering)

- [ ] **Step 3: Verify localStorage caching**

1. Reload the page
2. Click the same POI category
3. Verify instant load from localStorage
4. Check Network tab shows no backend request

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "test: verify POI backend migration complete"
```

---

### Task 9: Cleanup Frontend Amap Key (Optional)

After verification passes, remove the frontend's `VITE_AMAP_KEY` since POI requests now go through the backend.

**Files:**
- Modify: `apps/frontend/.env`

- [ ] **Step 1: Remove VITE_AMAP_KEY from frontend .env**

Delete or comment out the line:
```
VITE_AMAP_KEY=your_amap_key
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/.env
git commit -m "chore(frontend): remove VITE_AMAP_KEY (now handled by backend)"
```

---

## Environment Variables

Add to `apps/server/.env`:

```
AMAP_KEY=your_amap_api_key
```

The frontend's `VITE_AMAP_KEY` can be removed after migration (no longer needed).