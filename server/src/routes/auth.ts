import type { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../prisma/client.js'

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

const registerSchema = z.object({
  username: z.string().min(3, '用户名至少3个字符').max(20, '用户名最多20个字符'),
  password: z.string().min(6, '密码至少6个字符')
})

const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码')
})

export async function authRoutes(app: FastifyInstance) {
  // 注册
  app.post('/register', async (request, reply) => {
    const body = request.body as unknown

    const parseResult = registerSchema.safeParse(body)
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        message: parseResult.error.errors[0]?.message || '参数错误'
      })
    }

    const { username, password } = parseResult.data

    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUser) {
      return reply.status(400).send({
        success: false,
        message: '用户名已存在'
      })
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 创建用户
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword
      }
    })

    // 生成 token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    return reply.status(201).send({
      success: true,
      message: '注册成功',
      token,
      user: {
        id: user.id,
        username: user.username
      }
    })
  })

  // 登录
  app.post('/login', async (request, reply) => {
    const body = request.body as unknown

    const parseResult = loginSchema.safeParse(body)
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        message: parseResult.error.errors[0]?.message || '参数错误'
      })
    }

    const { username, password } = parseResult.data

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      return reply.status(401).send({
        success: false,
        message: '用户名或密码错误'
      })
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      return reply.status(401).send({
        success: false,
        message: '用户名或密码错误'
      })
    }

    // 生成 token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    return reply.send({
      success: true,
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username
      }
    })
  })
}