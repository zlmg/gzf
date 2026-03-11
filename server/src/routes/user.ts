import type { FastifyInstance } from 'fastify'
import { prisma } from '../prisma/client.js'
import { authMiddleware } from '../middleware/auth.js'

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

    // 解析 JSON 字符串
    return reply.send({
      success: true,
      data: {
        favorites: JSON.parse(user.favorites),
        history: JSON.parse(user.history),
        preferences: JSON.parse(user.preferences)
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
      data: { favorites: JSON.stringify(body.favorites) }
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
      data: { history: JSON.stringify(body.history) }
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
      data: { preferences: JSON.stringify(body.preferences) }
    })

    return reply.send({
      success: true,
      message: '偏好同步成功'
    })
  })
}