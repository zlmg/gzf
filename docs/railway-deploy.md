# Railway 部署指南

## 1. 安装 Railway CLI（可选）

```bash
npm install -g @railway/cli
railway login
```

## 2. 创建新项目

### 方式 A：通过 CLI
```bash
railway init
railway up
```

### 方式 B：通过 Web 界面
1. 访问 [railway.app](https://railway.app)
2. 点击 "New Project"
3. 选择 "Deploy from GitHub repo"
4. 选择你的仓库

## 3. 配置环境变量

在 Railway Dashboard 中设置以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DATABASE_URL` | `file:/app/apps/server/data.db` | SQLite 数据库路径 |
| `JWT_SECRET` | `<随机字符串>` | JWT 密钥，建议 32 位以上随机字符 |
| `NODE_ENV` | `production` | 生产环境标识 |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` | 前端地址（可选） |

生成 JWT_SECRET：
```bash
openssl rand -base64 32
```

## 4. 配置持久化存储

SQLite 需要持久化存储卷：

1. 在 Railway 项目中，点击服务
2. 进入 "Settings" -> "Volumes"
3. 点击 "Add Volume"
4. 挂载路径：`/app/apps/server`
5. 保存并重新部署

## 5. 获取部署 URL

部署成功后，Railway 会分配一个域名：
```
https://your-app.up.railway.app
```

## 6. 更新前端 API 地址

在前端 `.env` 或 Vercel 环境变量中设置：
```
VITE_API_BASE_URL=https://your-app.up.railway.app
```

## 常见问题

### 构建失败
确保 `pnpm-lock.yaml` 存在并提交到仓库。

### 数据库丢失
检查是否正确配置了持久化 Volume。

### CORS 错误
检查 `FRONTEND_URL` 环境变量是否正确设置。

## 费用说明

Railway 按**使用量计费**：
- 免费额度：$5/月
- 休眠服务不收费
- SQLite 小型应用通常在免费额度内