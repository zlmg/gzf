import type { FastifyInstance } from 'fastify'
import { prisma } from '../prisma/client.js'

const AMAP_KEY = process.env.AMAP_KEY
const AMAP_API_URL = 'https://restapi.amap.com/v3/place/around'
const MAX_RADIUS = 10000

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
      latitude?: string
      longitude?: string
      category?: string
    }

    // 参数校验
    if (!query.latitude || !query.longitude || !query.category) {
      return reply.status(400).send({
        success: false,
        message: '缺少必要参数'
      })
    }

    const latitude = parseFloat(query.latitude)
    const longitude = parseFloat(query.longitude)
    const { category } = query

    // 检查坐标是否有效
    if (isNaN(latitude) || isNaN(longitude)) {
      return reply.status(400).send({
        success: false,
        message: '无效的坐标'
      })
    }

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