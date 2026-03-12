import type { Plugin } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// SPA history fallback 插件
function spaFallback(): Plugin {
  return {
    name: 'spa-fallback',
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] || ''
        // 如果是静态资源请求（有文件扩展名），直接放行
        if (path.extname(url)) {
          return next()
        }
        // 否则返回 index.html（SPA fallback）
        const indexPath = path.resolve(__dirname, 'dist/index.html')
        fs.readFile(indexPath, (err, data) => {
          if (err)
            return next()
          res.setHeader('Content-Type', 'text/html')
          res.end(data)
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss(), spaFallback()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
})
