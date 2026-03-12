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
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://172.31.7.188:3000',
    // Railway 前端域名（通过环境变量配置）
    process.env.FRONTEND_URL,
    // 支持 Vercel 预览部署
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ].filter(Boolean) as string[]

  await app.register(cors, {
    origin: (origin, callback) => {
      // 允许无 origin 的请求（如移动端、curl）
      if (!origin) return callback(null, true)
      // 生产环境允许所有 Railway/Vercel 域名
      if (process.env.NODE_ENV === 'production') {
        const isAllowed = allowedOrigins.some(allowed => origin === allowed) ||
          origin.endsWith('.railway.app') ||
          origin.endsWith('.vercel.app')
        return callback(null, isAllowed)
      }
      // 开发环境只允许白名单
      callback(null, allowedOrigins.includes(origin))
    },
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