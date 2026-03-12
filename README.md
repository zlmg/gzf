# 上海宝山公租房信息平台

一个用于浏览和比较上海宝山区公租房房源信息的 Vue 3 应用程序。

## 功能特性

- 🏠 **房源浏览** - 查看宝山区公租房项目列表，支持无限滚动加载
- 🔍 **筛选排序** - 按户型、房型、价格、面积、配套设施等多维度筛选
- ⭐ **收藏功能** - 收藏感兴趣的房源，数据持久化存储
- 📊 **对比功能** - 最多支持 4 个房源同时对比
- 🗺️ **周边配套** - 集成高德地图 API，查看周边交通、医疗、教育等设施

## 技术栈

- **Vue 3.5** - Composition API + `<script setup>`
- **TypeScript 5.9** - 类型安全
- **Vite 7** - 构建工具
- **Tailwind CSS v4** - 样式框架
- **Element Plus** - UI 组件库
- **Pinia 3** - 状态管理
- **Vue Router 5** - 路由管理
- **VueUse Core** - 工具函数库
- **高德地图 JS API** - 地图与 POI 服务

## 快速开始

### 环境要求

- Node.js 18+
- pnpm (推荐)

### 安装依赖

```bash
pnpm install
```

### 环境配置

创建 `.env` 文件并配置VITE_API_BASE和高德地图 API Key：

```env
VITE_API_BASE=http://localhost:3001
VITE_AMAP_KEY=your_amap_api_key
```

### 开发

```bash
pnpm dev        # 启动开发服务器 (端口 3000，自动打开浏览器)
pnpm build      # 类型检查 + 生产构建
pnpm preview    # 预览生产构建
```

## 项目结构

```
src/
├── types/           # TypeScript 类型定义
├── stores/         # Pinia 状态管理
├── composables/     # Vue 组合式函数
├── components/      # 可复用组件
├── views/           # 页面组件
├── utils/           # 工具函数
├── router/          # 路由配置
└── style.css        # 全局样式
```

## 数据来源

- 房源数据：`public/data/bsgz.json`
- 周边配套：高德地图 POI API

## 许可证

MIT
