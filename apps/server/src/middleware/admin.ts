import type { FastifyRequest, FastifyReply } from 'fastify'
import { authMiddleware } from './auth.js'

export async function adminMiddleware(request: FastifyRequest, reply: FastifyReply) {
  await authMiddleware(request, reply)

  // authMiddleware 失败时会直接返回响应，需要检查是否已发送
  if (reply.sent) return

  if (request.user?.username !== 'minos') {
    return reply.status(403).send({
      success: false,
      message: '无权限访问'
    })
  }
}