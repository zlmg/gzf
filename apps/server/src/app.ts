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
    credentials: true,
    exposedHeaders: ['Content-Disposition']
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