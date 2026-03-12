import Fastify from 'fastify'
import cors from '@fastify/cors'
import { authRoutes } from './routes/auth.js'
import { userRoutes } from './routes/user.js'
import { poiRoutes } from './routes/poi.js'

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
  app.register(poiRoutes, { prefix: '/api/poi' })

  return app
}