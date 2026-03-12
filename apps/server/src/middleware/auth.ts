import type { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'
import { prisma } from '../prisma/client.js'

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret'

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      success: false,
      message: '未提供认证令牌'
    })
  }

  const token = authHeader.slice(7)

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; username: string }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, username: true }
    })

    if (!user) {
      return reply.status(401).send({
        success: false,
        message: '用户不存在'
      })
    }

    request.user = user
  } catch (error) {
    return reply.status(401).send({
      success: false,
      message: '令牌无效或已过期'
    })
  }
}