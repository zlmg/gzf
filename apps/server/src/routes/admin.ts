import type { FastifyInstance } from 'fastify'
import archiver from 'archiver'
import { Readable } from 'stream'
import { prisma } from '../prisma/client.js'
import { adminMiddleware } from '../middleware/admin.js'

export async function adminRoutes(app: FastifyInstance) {
  // 所有管理路由都需要管理员权限
  app.addHook('preHandler', adminMiddleware)

  // 导出数据库
  app.get('/export', async (request, reply) => {
    try {
      // 查询所有用户（排除敏感字段）
      const users = await prisma.user.findMany({
        select: {
          username: true,
          favorites: true,
          history: true,
          preferences: true
        }
      })

      // 查询所有 POI（排除 id 和 createdAt）
      const pois = await prisma.poi.findMany({
        select: {
          latitude: true,
          longitude: true,
          category: true,
          data: true
        }
      })

      // 创建 manifest
      const manifest = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        counts: {
          users: users.length,
          pois: pois.length
        }
      }

      // 准备 JSON 数据
      const usersData = JSON.stringify({ users }, null, 2)
      const poisData = JSON.stringify({ pois }, null, 2)
      const manifestData = JSON.stringify(manifest, null, 2)

      // 设置响应头
      const filename = `gzf-db-export-${new Date().toISOString().slice(0, 10)}.zip`
      reply.header('Content-Type', 'application/zip')
      reply.header('Content-Disposition', `attachment; filename="${filename}"`)

      // 创建 ZIP 流
      const archive = archiver('zip', { zlib: { level: 9 } })

      // 添加文件到 ZIP
      archive.append(Readable.from([manifestData]), { name: 'manifest.json' })
      archive.append(Readable.from([usersData]), { name: 'users.json' })
      archive.append(Readable.from([poisData]), { name: 'pois.json' })

      // 完成打包
      archive.finalize()

      // 发送流式响应
      return reply.send(archive)
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: '导出失败'
      })
    }
  })
}