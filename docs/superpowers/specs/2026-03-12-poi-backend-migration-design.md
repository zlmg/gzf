# POI 接口后端迁移设计

> 日期：2026-03-12
> 状态：已确认

## 背景

当前前端 `AmapNearby.vue` 组件直接调用高德 API 获取周边 POI 数据，存在以下问题：
- 高德 API Key 暴露在前端，存在安全风险
- 每个用户独立请求，无法共享缓存
- 缓存分散在各用户浏览器，无法统一管理

## 目标

将高德 API 调用迁移至后端，实现：
1. API Key 隐藏在后端，提升安全性
2. 数据库缓存 POI 数据，用户间共享
3. 前端保留 localStorage 作为二级缓存
4. 统一的错误处理和日志记录

## 设计决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 缓存粒度 | 按坐标+分类存储 | 存储空间更省，前端筛选距离 |
| 最大半径 | 20km | 与前端最大筛选范围一致 |
| 认证要求 | 无需认证 | POI 数据为公共信息 |
| 缓存过期 | 永不过期 | POI 数据相对稳定，减少 API 调用 |

## 架构设计

```
┌─────────────┐     GET /api/poi/search     ┌─────────────┐
│   Frontend  │ ──────────────────────────► │   Backend   │
│             │ ◄────────────────────────── │             │
│ localStorage│                             │   Database  │
│   (L2缓存)  │                             │   (L1缓存)  │
└─────────────┘                             └──────┬──────┘
                                                   │
                                                   ▼ 未命中
                                            ┌─────────────┐
                                            │  高德 API   │
                                            └─────────────┘
```

### 请求流程

1. 前端检查 localStorage 缓存
2. 缓存未命中 → 调用后端接口
3. 后端查询数据库
4. 数据库命中 → 返回数据
5. 数据库未命中 → 调用高德 API → 存入数据库 → 返回数据
6. 前端将结果存入 localStorage 缓存

## 数据库设计

### 新增 Poi 表

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

**字段说明：**
- `latitude` / `longitude`: 坐标取3位小数（约111米精度），相近位置共享缓存
- `category`: POI 分类 key，对应前端 `POI_TYPES` 中的 key
- `data`: 完整的 POI JSON 数组，包含 20km 范围内所有结果

## API 设计

### GET /api/poi/search

查询周边 POI 数据

**请求参数（Query）：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| latitude | number | 是 | 纬度 |
| longitude | number | 是 | 经度 |
| category | string | 是 | 分类 key |

**成功响应：**

```json
{
  "success": true,
  "data": {
    "pois": [
      {
        "id": "B0FFFAB6J",
        "name": "地铁站名",
        "address": "详细地址",
        "distance": "1234",
        "type": "150500",
        "location": "121.473701,31.230416",
        "tel": "021-12345678"
      }
    ],
    "searchRadius": 20000,
    "fromCache": true
  }
}
```

**错误响应：**

```json
{
  "success": false,
  "message": "错误描述"
}
```

**HTTP 状态码：**

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 参数校验失败 |
| 500 | 服务器内部错误 |
| 502 | 高德 API 调用失败 |

## 前端改造

### AmapNearby.vue 改动

1. **移除** 直接调用高德 API 的 `fetch` 代码
2. **新增** 调用后端 `/api/poi/search` 接口
3. **保留** `usePoiCache` 作为前端二级缓存

### 改造后的 searchPOI 函数

```typescript
async function searchPOI(category: string, forceRefresh = false) {
  activeCategory.value = category
  loading.value = true

  const poiConfig = POI_TYPES.find(p => p.key === category)
  if (!poiConfig) return

  // 1. 非强制刷新时，先查前端缓存
  if (!forceRefresh) {
    const cached = getCached(props.latitude, props.longitude, category, 20000)
    if (cached) {
      poiData.value[category] = cached.pois
      loading.value = false
      return
    }
  }

  // 2. 调用后端接口
  try {
    const response = await fetch(
      `${API_BASE}/api/poi/search?latitude=${props.latitude}&longitude=${props.longitude}&category=${category}`
    )
    const result = await response.json()

    if (result.success && result.data.pois.length > 0) {
      poiData.value[category] = result.data.pois

      // 3. 存入前端缓存
      setCached(props.latitude, props.longitude, category, 20000, result.data.pois, 20000, `${props.longitude},${props.latitude}`)
    } else {
      poiData.value[category] = []
    }
  } catch (e) {
    console.error('POI search error:', e)
    poiData.value[category] = []
  } finally {
    loading.value = false
    isRefreshing.value = false
  }
}
```

### 简化的距离筛选逻辑

由于后端固定返回 20km 数据，前端 `changeRadius` 函数只需筛选本地数据，无需重新请求：

```typescript
function changeRadius(radius: number) {
  selectedRadius.value = radius
  // 仅筛选本地数据，无需重新请求
}
```

## 后端实现

### 新增路由文件

`apps/server/src/routes/poi.ts`

```typescript
import type { FastifyInstance } from 'fastify'
import { prisma } from '../prisma/client.js'

const AMAP_KEY = process.env.AMAP_KEY
const AMAP_API_URL = 'https://restapi.amap.com/v3/place/around'
const MAX_RADIUS = 20000

export async function poiRoutes(app: FastifyInstance) {
  app.get('/search', {
    schema: {
      querystring: {
        type: 'object',
        required: ['latitude', 'longitude', 'category'],
        properties: {
          latitude: { type: 'number' },
          longitude: { type: 'number' },
          category: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { latitude, longitude, category } = request.query as {
      latitude: number
      longitude: number
      category: string
    }

    // 坐标取3位小数
    const lat = latitude.toFixed(3)
    const lng = longitude.toFixed(3)

    // 1. 查询数据库缓存
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

    // 2. 调用高德 API
    request.log.info(`[POI] fetch from amap: ${lat}, ${lng}, ${category}`)

    try {
      const response = await fetch(
        `${AMAP_API_URL}?key=${AMAP_KEY}&location=${lng},${lat}&types=${getTypes(category)}&keywords=${getKeywords(category)}&radius=${MAX_RADIUS}&offset=50&page=1&extensions=all`
      )

      const result = await response.json()

      if (result.status !== '1') {
        request.log.error(`[POI] amap error: ${result.status} - ${result.info}`)
        return reply.status(502).send({
          success: false,
          message: '高德 API 调用失败'
        })
      }

      const pois = result.pois || []

      // 3. 存入数据库
      await prisma.poi.create({
        data: {
          latitude: lat,
          longitude: lng,
          category,
          data: JSON.stringify(pois)
        }
      })

      request.log.info(`[POI] saved to db: ${pois.length} pois`)

      return reply.send({
        success: true,
        data: {
          pois,
          searchRadius: MAX_RADIUS,
          fromCache: false
        }
      })
    } catch (e) {
      request.log.error(`[POI] error: ${e}`)
      return reply.status(500).send({
        success: false,
        message: '服务器错误'
      })
    }
  })
}

// 辅助函数：获取分类对应的 types
function getTypes(category: string): string {
  const typeMap: Record<string, string> = {
    subway: '150500',
    bus: '150700',
    gym: '080111',
    // ... 其他分类
  }
  return typeMap[category] || ''
}

// 辅助函数：获取分类对应的 keywords
function getKeywords(category: string): string {
  const keywordMap: Record<string, string> = {
    subway: '地铁站',
    bus: '公交站',
    // ... 其他分类
  }
  return keywordMap[category] || ''
}
```

### 注册路由

在 `apps/server/src/app.ts` 中注册：

```typescript
import { poiRoutes } from './routes/poi.js'

// ...

app.register(poiRoutes, { prefix: '/api/poi' })
```

## 日志设计

| 场景 | 级别 | 格式 |
|------|------|------|
| 缓存命中 | info | `[POI] cache hit: {lat}, {lng}, {category}` |
| 调用高德 API | info | `[POI] fetch from amap: {lat}, {lng}, {category}` |
| 存入数据库 | info | `[POI] saved to db: {count} pois` |
| 高德 API 错误 | error | `[POI] amap error: {status} - {info}` |
| 服务器错误 | error | `[POI] error: {message}` |

## 环境变量

后端新增环境变量：

```
AMAP_KEY=your_amap_api_key
```

## 实现任务

1. 后端：新增 Prisma schema 并运行迁移
2. 后端：新增 `/api/poi/search` 路由
3. 后端：配置环境变量 `AMAP_KEY`
4. 前端：改造 `AmapNearby.vue` 调用后端接口
5. 前端：简化 `changeRadius` 逻辑
6. 前端：新增 API 方法到 `api/index.ts`
7. 测试：验证前后端联调