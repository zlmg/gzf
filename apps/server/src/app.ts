import Fastify from 'fastify'
import cors from '@fastify/cors'
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