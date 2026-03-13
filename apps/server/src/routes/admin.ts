import type { FastifyInstance } from 'fastify'
import archiver from 'archiver'
import { Readable } from 'stream'
import { z } from 'zod'
import { prisma } from '../prisma/client.js'
import { adminMiddleware } from '../middleware/admin.js'

// 验证 schema
const UserImportSchema = z.object({
  username: z.string().min(1).max(50),
  favorites: z.string(),
  history: z.string(),
  preferences: z.string()
})

const PoiImportSchema = z.object({
  latitude: z.string().regex(/^\d+\.\d{3}$/, '纬度格式错误'),
  longitude: z.string().regex(/^\d+\.\d{3}$/, '经度格式错误'),
  category: z.string().min(1),
  data: z.string()
})

const ManifestSchema = z.object({
  version: z.string(),
  exportedAt: z.string().datetime(),
  counts: z.object({
    users: z.number().int().nonnegative(),
    pois: z.number().int().nonnegative()
  })
})

const ImportFileSchema = z.object({
  manifest: ManifestSchema,
  users: z.array(UserImportSchema),
  pois: z.array(PoiImportSchema)
})

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
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)
      const filename = `gzf-db-${timestamp}-u${users.length}-p${pois.length}.zip`
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

  // 导入数据库
  app.post('/import', async (request, reply) => {
    try {
      // 获取上传的文件
      const file = await request.file()

      if (!file) {
        return reply.status(400).send({
          success: false,
          message: '未提供文件'
        })
      }

      // 检查文件类型
      if (!file.filename.endsWith('.zip') && file.mimetype !== 'application/zip') {
        return reply.status(400).send({
          success: false,
          message: '无效的文件格式，请上传 ZIP 文件'
        })
      }

      // 解析 ZIP 文件
      const unzipper = await import('unzipper')
      const buffer = await file.toBuffer()
      const directory = await unzipper.Open.buffer(buffer)

      const files: Record<string, string> = {}

      for (const entry of directory.files) {
        const content = await entry.buffer()
        files[entry.path] = content.toString('utf-8')
      }

      // 验证必需文件存在
      if (!files['manifest.json'] || !files['users.json'] || !files['pois.json']) {
        return reply.status(400).send({
          success: false,
          message: 'ZIP 文件缺少必需文件：manifest.json, users.json 或 pois.json'
        })
      }

      // 解析并验证数据
      let manifest: unknown, users: unknown, pois: unknown

      try {
        manifest = JSON.parse(files['manifest.json'])
        users = JSON.parse(files['users.json']).users
        pois = JSON.parse(files['pois.json']).pois
      } catch (e) {
        return reply.status(400).send({
          success: false,
          message: 'JSON 解析失败，文件格式错误'
        })
      }

      // 验证数据结构
      const validationResult = ImportFileSchema.safeParse({
        manifest,
        users,
        pois
      })

      if (!validationResult.success) {
        return reply.status(400).send({
          success: false,
          message: `数据验证失败：${validationResult.error.message}`
        })
      }

      const validUsers = validationResult.data.users
      const validPois = validationResult.data.pois

      // 事务导入
      const result = await prisma.$transaction(async (tx) => {
        // 获取已存在的用户名
        const existingUsers = await tx.user.findMany({
          where: { username: { in: validUsers.map(u => u.username) } },
          select: { username: true }
        })
        const existingUsernames = new Set(existingUsers.map(u => u.username))

        // 过滤出新用户
        const newUsers = validUsers.filter(u => !existingUsernames.has(u.username))

        // 批量导入用户
        if (newUsers.length > 0) {
          await tx.user.createMany({
            data: newUsers.map(u => ({
              username: u.username,
              password: '', // 导入的用户需要重置密码
              favorites: u.favorites,
              history: u.history,
              preferences: u.preferences
            }))
          })
        }

        // 获取已存在的 POI 坐标+分类组合
        const existingPois = await tx.poi.findMany({
          select: { latitude: true, longitude: true, category: true }
        })
        const existingPoiKeys = new Set(
          existingPois.map(p => `${p.latitude}:${p.longitude}:${p.category}`)
        )

        // 过滤出新 POI
        const newPois = validPois.filter(
          p => !existingPoiKeys.has(`${p.latitude}:${p.longitude}:${p.category}`)
        )

        // 批量导入 POI
        if (newPois.length > 0) {
          await tx.poi.createMany({
            data: newPois
          })
        }

        return {
          usersImported: newUsers.length,
          usersSkipped: validUsers.length - newUsers.length,
          poisImported: newPois.length,
          poisSkipped: validPois.length - newPois.length
        }
      })

      return reply.send({
        success: true,
        message: '导入成功',
        data: result
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({
        success: false,
        message: '导入失败，请检查服务器日志'
      })
    }
  })
}