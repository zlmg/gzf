# Element-Plus to Nuxt-UI Migration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the frontend UI from Element-Plus to Nuxt-UI component library, maintaining all existing functionality.

**Architecture:** Replace Element-Plus components with Nuxt-UI equivalents. Use Embla Carousel for the image gallery. Migrate form validation to Zod schema. Use useToast composable for notifications.

**Tech Stack:** Vue 3, Vite, Nuxt-UI, Tailwind CSS v4, Zod, Embla Carousel, Iconify (Lucide icons)

---

## File Structure

### Create
- `src/composables/useAppToast.ts` - Toast utility wrapper
- `src/components/ConfirmModal.vue` - Reusable confirmation modal

### Modify
- `package.json` - Dependencies
- `vite.config.ts` - Add Nuxt-UI plugin
- `src/main.ts` - Remove ElementPlus, add ui plugin
- `src/style.css` - Remove Element-Plus CSS
- `src/App.vue` - Wrap with UApp
- `index.html` - Add isolate class
- `src/views/LoginView.vue` - Form migration
- `src/views/RegisterView.vue` - Form migration
- `src/views/FavoritesView.vue` - Component replacement
- `src/views/HistoryView.vue` - Component replacement
- `src/components/Layout/AppHeader.vue` - Component replacement
- `src/components/ImageGallery.vue` - Carousel replacement

---

## Chunk 1: Project Configuration

### Task 1: Update Dependencies

**Files:**
- Modify: `apps/frontend/package.json`

- [ ] **Step 1: Remove Element-Plus and add Nuxt-UI dependencies**

Update `apps/frontend/package.json` dependencies section:

```json
{
  "dependencies": {
    "@amap/amap-jsapi-loader": "^1.0.1",
    "@iconify-json/lucide": "^1.0.0",
    "@nuxt/ui": "^3.0.0",
    "@vueuse/core": "^14.2.1",
    "embla-carousel-vue": "^8.0.0",
    "pinia": "^3.0.4",
    "vue": "^3.5.25",
    "vue-router": "^5.0.3",
    "zod": "^3.24.0"
  }
}
```

Remove from dependencies:
- `element-plus`
- `@element-plus/icons-vue`

- [ ] **Step 2: Install dependencies**

Run: `cd /Users/minos/File/WebFile/demo/gzf && pnpm install`
Expected: Dependencies installed successfully

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/package.json pnpm-lock.yaml
git commit -m "chore: replace element-plus with nuxt-ui dependencies"
```

### Task 2: Configure Vite Plugin

**Files:**
- Modify: `apps/frontend/vite.config.ts`

- [ ] **Step 1: Add Nuxt-UI Vite plugin**

```typescript
import type { Plugin } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'
import { defineConfig } from 'vite'

// SPA history fallback 插件
function spaFallback(): Plugin {
  return {
    name: 'spa-fallback',
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] || ''
        if (path.extname(url)) {
          return next()
        }
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

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    ui({
      ui: { colors: { primary: 'blue', neutral: 'gray' } }
    }),
    spaFallback()
  ],
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
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/vite.config.ts
git commit -m "feat: add nuxt-ui vite plugin configuration"
```

### Task 3: Update Main Entry

**Files:**
- Modify: `apps/frontend/src/main.ts`
- Modify: `apps/frontend/src/style.css`
- Modify: `apps/frontend/index.html`
- Modify: `apps/frontend/src/App.vue`

- [ ] **Step 1: Update main.ts**

```typescript
import { createApp } from 'vue'
import { pinia } from './stores'
import router from './router'
import ui from '@nuxt/ui/vue-plugin'
import App from './App.vue'
import './style.css'

const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(ui)

app.mount('#app')
```

- [ ] **Step 2: Update style.css - remove Element-Plus**

```css
@import 'tailwindcss';

/* Container with max-width */
.container-app {
  width: 100%;
  max-width: 1500px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

@media (min-width: 640px) {
  .container-app {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}

/* Base styles */
:root {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color: #1f2937;
  background-color: #f9fafb;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
}

a {
  color: inherit;
  text-decoration: none;
}

#app {
  width: 100%;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
```

- [ ] **Step 3: Update index.html - add isolate class**

Find the `<div id="app">` and add `class="isolate"`:

```html
<div id="app" class="isolate"></div>
```

- [ ] **Step 4: Update App.vue - wrap with UApp**

```vue
<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <UApp>
    <RouterView />
  </UApp>
</template>
```

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/main.ts apps/frontend/src/style.css apps/frontend/index.html apps/frontend/src/App.vue
git commit -m "feat: configure nuxt-ui in main entry and app root"
```

### Task 4: Create Toast Utility Composable

**Files:**
- Create: `apps/frontend/src/composables/useAppToast.ts`

- [ ] **Step 1: Create useAppToast composable**

```typescript
import { useToast } from '#imports'

export function useAppToast() {
  const toast = useToast()

  return {
    success: (title: string) => toast.add({ title, color: 'success', icon: 'i-lucide-check' }),
    error: (title: string) => toast.add({ title, color: 'error', icon: 'i-lucide-x' }),
    warning: (title: string) => toast.add({ title, color: 'warning', icon: 'i-lucide-alert-triangle' }),
    info: (title: string) => toast.add({ title, color: 'info', icon: 'i-lucide-info' }),
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/composables/useAppToast.ts
git commit -m "feat: add useAppToast composable for consistent notifications"
```

---

## Chunk 2: Form Components Migration

### Task 5: Migrate LoginView

**Files:**
- Modify: `apps/frontend/src/views/LoginView.vue`

- [ ] **Step 1: Rewrite LoginView with Nuxt-UI components**

```vue
<script setup lang="ts">
import { z } from 'zod'
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAppToast } from '@/composables/useAppToast'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const toast = useAppToast()

const schema = z.object({
  username: z.string().min(3, '用户名长度为3-20个字符').max(20, '用户名长度为3-20个字符'),
  password: z.string().min(6, '密码至少6个字符'),
})

type Schema = z.output<typeof schema>
const state = ref<Partial<Schema>>({
  username: '',
  password: '',
})

async function onSubmit() {
  const result = await authStore.login(state.value.username ?? '', state.value.password ?? '')

  if (result.success) {
    toast.success('登录成功')
    router.push('/')
  }
  else {
    toast.error(result.message || '登录失败')
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          登录账号
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          登录后可跨设备同步收藏和浏览记录
        </p>
      </div>

      <UForm :schema="schema" :state="state" class="mt-8 space-y-6" @submit="onSubmit">
        <UFormField name="username" required>
          <UInput
            v-model="state.username"
            placeholder="用户名"
            size="lg"
          >
            <template #leading>
              <UIcon name="i-lucide-user" class="size-5" />
            </template>
          </UInput>
        </UFormField>

        <UFormField name="password" required>
          <UInput
            v-model="state.password"
            type="password"
            placeholder="密码"
            size="lg"
          >
            <template #leading>
              <UIcon name="i-lucide-lock" class="size-5" />
            </template>
          </UInput>
        </UFormField>

        <UButton
          type="submit"
          color="primary"
          size="lg"
          block
          :loading="authStore.loading"
        >
          登录
        </UButton>

        <div class="text-center">
          <RouterLink
            to="/register"
            class="text-sm text-blue-600 hover:text-blue-500"
          >
            没有账号？立即注册
          </RouterLink>
        </div>
      </UForm>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/views/LoginView.vue
git commit -m "refactor: migrate LoginView to Nuxt-UI components"
```

### Task 6: Migrate RegisterView

**Files:**
- Modify: `apps/frontend/src/views/RegisterView.vue`

- [ ] **Step 1: Rewrite RegisterView with Nuxt-UI components**

```vue
<script setup lang="ts">
import { z } from 'zod'
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAppToast } from '@/composables/useAppToast'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const toast = useAppToast()

const schema = z.object({
  username: z.string().min(3, '用户名长度为3-20个字符').max(20, '用户名长度为3-20个字符'),
  password: z.string().min(6, '密码至少6个字符'),
  confirmPassword: z.string().min(6, '密码至少6个字符'),
}).refine(data => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
})

type Schema = z.output<typeof schema>
const state = ref<Partial<Schema>>({
  username: '',
  password: '',
  confirmPassword: '',
})

async function onSubmit() {
  const result = await authStore.register(state.value.username ?? '', state.value.password ?? '')

  if (result.success) {
    toast.success('注册成功')
    router.push('/')
  }
  else {
    toast.error(result.message || '注册失败')
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          注册账号
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          注册后可跨设备同步收藏和浏览记录
        </p>
      </div>

      <UForm :schema="schema" :state="state" class="mt-8 space-y-6" @submit="onSubmit">
        <UFormField name="username" required>
          <UInput
            v-model="state.username"
            placeholder="用户名"
            size="lg"
          >
            <template #leading>
              <UIcon name="i-lucide-user" class="size-5" />
            </template>
          </UInput>
        </UFormField>

        <UFormField name="password" required>
          <UInput
            v-model="state.password"
            type="password"
            placeholder="密码"
            size="lg"
          >
            <template #leading>
              <UIcon name="i-lucide-lock" class="size-5" />
            </template>
          </UInput>
        </UFormField>

        <UFormField name="confirmPassword" required>
          <UInput
            v-model="state.confirmPassword"
            type="password"
            placeholder="确认密码"
            size="lg"
          >
            <template #leading>
              <UIcon name="i-lucide-lock" class="size-5" />
            </template>
          </UInput>
        </UFormField>

        <UButton
          type="submit"
          color="primary"
          size="lg"
          block
          :loading="authStore.loading"
        >
          注册
        </UButton>

        <div class="text-center">
          <RouterLink
            to="/login"
            class="text-sm text-blue-600 hover:text-blue-500"
          >
            已有账号？立即登录
          </RouterLink>
        </div>
      </UForm>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/views/RegisterView.vue
git commit -m "refactor: migrate RegisterView to Nuxt-UI components"
```

---

## Chunk 3: View Components Migration

### Task 7: Create ConfirmModal Component

**Files:**
- Create: `apps/frontend/src/components/ConfirmModal.vue`

- [ ] **Step 1: Create ConfirmModal component**

```vue
<script setup lang="ts">
defineProps<{
  title?: string
  message?: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <UModal>
    <template #header>
      <h3 class="text-lg font-semibold">
        {{ title || '确认' }}
      </h3>
    </template>

    <template #body>
      <p class="text-gray-600">
        {{ message }}
      </p>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="ghost" @click="emit('cancel')">
          取消
        </UButton>
        <UButton color="primary" @click="emit('confirm')">
          确认
        </UButton>
      </div>
    </template>
  </UModal>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/components/ConfirmModal.vue
git commit -m "feat: add ConfirmModal component for confirmation dialogs"
```

### Task 8: Migrate FavoritesView

**Files:**
- Modify: `apps/frontend/src/views/FavoritesView.vue`

- [ ] **Step 1: Replace Element-Plus imports and components**

Remove Element-Plus imports and replace with Nuxt-UI:

```typescript
// Remove this import
import { ElButton, ElEmpty, ElMessage, ElMessageBox } from 'element-plus'

// Add this import
import { useAppToast } from '@/composables/useAppToast'
```

- [ ] **Step 2: Replace ElMessage calls with useAppToast**

Replace all `ElMessage.success/warning/error/info` calls:

```typescript
const toast = useAppToast()

// Replace ElMessage.success('message') with:
toast.success('message')

// Replace ElMessage.warning('message') with:
toast.warning('message')

// Replace ElMessage.error('message') with:
toast.error('message')

// Replace ElMessage.info('message') with:
toast.info('message')
```

- [ ] **Step 3: Replace ElMessageBox.confirm with UModal**

Create a reactive modal state:

```typescript
const confirmModal = ref({
  open: false,
  message: '',
  onConfirm: () => {},
})
```

Replace the ElMessageBox.confirm call in handleImport:

```typescript
// Before
await ElMessageBox.confirm(message, '导入收藏', {
  confirmButtonText: '导入',
  cancelButtonText: '取消',
  type: 'info',
})

// After
confirmModal.value = {
  open: true,
  message,
  onConfirm: async () => {
    // Execute the import logic
    const result = favoriteStore.importFavorites(data)
    // ... handle result
  },
}
```

- [ ] **Step 4: Replace ElButton with UButton**

```vue
<!-- Before -->
<ElButton plain size="small">导入</ElButton>
<ElButton type="danger" plain size="small">删除</ElButton>

<!-- After -->
<UButton variant="outline" size="sm">导入</UButton>
<UButton color="error" variant="outline" size="sm">删除</UButton>
```

- [ ] **Step 5: Replace ElEmpty with custom Tailwind component**

```vue
<!-- Before -->
<el-empty description="暂无收藏房源" class="py-16 md:py-20">
  <el-button type="primary" @click="router.push('/')">
    去浏览房源
  </el-button>
</el-empty>

<!-- After -->
<div class="flex flex-col items-center justify-center py-16 md:py-20">
  <UIcon name="i-lucide-heart-off" class="size-16 text-gray-300 mb-4" />
  <p class="text-gray-500 mb-4">暂无收藏房源</p>
  <UButton color="primary" @click="router.push('/')">
    去浏览房源
  </UButton>
</div>
```

- [ ] **Step 6: Add confirmation modal to template**

```vue
<UModal v-model:open="confirmModal.open" title="导入收藏">
  <template #body>
    <p class="text-gray-600">{{ confirmModal.message }}</p>
  </template>
  <template #footer>
    <UButton variant="ghost" @click="confirmModal.open = false">
      取消
    </UButton>
    <UButton color="primary" @click="confirmModal.onConfirm(); confirmModal.open = false">
      导入
    </UButton>
  </template>
</UModal>
```

- [ ] **Step 7: Commit**

```bash
git add apps/frontend/src/views/FavoritesView.vue
git commit -m "refactor: migrate FavoritesView to Nuxt-UI components"
```

### Task 9: Migrate HistoryView

**Files:**
- Modify: `apps/frontend/src/views/HistoryView.vue`

- [ ] **Step 1: Replace Element-Plus imports**

```typescript
// Remove
import { ElButton, ElEmpty, ElMessage } from 'element-plus'

// Add
import { useAppToast } from '@/composables/useAppToast'
```

- [ ] **Step 2: Replace ElMessage calls**

```typescript
const toast = useAppToast()

// Replace all ElMessage calls
toast.success(`已移除 ${removed} 条失效记录`)
toast.warning('对比列表已满，最多只能添加4个房源')
```

- [ ] **Step 3: Replace ElButton with UButton**

```vue
<UButton color="warning" variant="outline" size="sm">清理失效</UButton>
<UButton color="error" variant="outline" size="sm">清空全部</UButton>
```

- [ ] **Step 4: Replace ElEmpty**

```vue
<div class="flex flex-col items-center justify-center py-16 md:py-20">
  <UIcon name="i-lucide-clock" class="size-16 text-gray-300 mb-4" />
  <p class="text-gray-500 mb-4">暂无浏览记录</p>
  <UButton color="primary" @click="router.push('/')">
    去浏览房源
  </UButton>
</div>
```

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/views/HistoryView.vue
git commit -m "refactor: migrate HistoryView to Nuxt-UI components"
```

---

## Chunk 4: Header and Carousel Migration

### Task 10: Migrate AppHeader

**Files:**
- Modify: `apps/frontend/src/components/Layout/AppHeader.vue`

- [ ] **Step 1: Replace Element-Plus imports**

```typescript
// Remove
import { ElMessage } from 'element-plus'

// Add
import { useAppToast } from '@/composables/useAppToast'
```

- [ ] **Step 2: Replace ElMessage calls**

```typescript
const toast = useAppToast()

// Replace all ElMessage calls
toast.info('正在导出数据库...')
toast.success('数据库导出成功')
toast.error(message)
// etc.
```

- [ ] **Step 3: Replace el-dropdown with UDropdownMenu**

```vue
<!-- Before -->
<el-dropdown trigger="click">
  <button>...</button>
  <template #dropdown>
    <el-dropdown-menu>
      <el-dropdown-item @click="handleExport">导出缓存</el-dropdown-item>
      <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
    </el-dropdown-menu>
  </template>
</el-dropdown>

<!-- After -->
<UDropdownMenu
  :items="[
    [{ label: '导出缓存', icon: 'i-lucide-download', click: handleExport }],
    [{ label: '导入缓存', icon: 'i-lucide-upload', click: triggerImport }],
    ...(isAdmin ? [[{ label: '数据库导出', icon: 'i-lucide-database', click: handleDbExport }], [{ label: '数据库导入', icon: 'i-lucide-database', click: triggerDbImport }]] : []),
    [{ label: '退出登录', icon: 'i-lucide-log-out', click: handleLogout }],
  ]"
>
  <UButton icon="i-lucide-chevron-down" variant="ghost" color="white">
    {{ authStore.user?.username }}
  </UButton>
</UDropdownMenu>
```

- [ ] **Step 4: Replace el-dialog with UModal**

```vue
<!-- Before -->
<el-dialog v-model="importDialogVisible" title="数据库导入" width="400px">
  ...
</el-dialog>

<!-- After -->
<UModal v-model:open="importDialogVisible" title="数据库导入">
  <template #body>
    <div v-if="!importResult">
      <p class="mb-4">
        确认导入文件：<strong>{{ importFile?.name }}</strong>
      </p>
      <p class="text-gray-500 text-sm">
        导入时会跳过已存在的记录
      </p>
    </div>
    <div v-else>
      <p class="font-medium mb-3">导入完成</p>
      <div class="space-y-2 text-sm">
        <p>用户：导入 {{ importResult.usersImported }} 条，跳过 {{ importResult.usersSkipped }} 条</p>
        <p>POI：导入 {{ importResult.poisImported }} 条，跳过 {{ importResult.poisSkipped }} 条</p>
      </div>
    </div>
  </template>
  <template #footer>
    <UButton variant="ghost" @click="importDialogVisible = false">
      关闭
    </UButton>
    <UButton v-if="!importResult" color="primary" :loading="importing" @click="confirmImport">
      确认导入
    </UButton>
  </template>
</UModal>
```

- [ ] **Step 5: Replace el-button with UButton in modal**

```vue
<!-- Already handled in Step 4 -->
```

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/components/Layout/AppHeader.vue
git commit -m "refactor: migrate AppHeader to Nuxt-UI components"
```

### Task 11: Migrate ImageGallery to Embla Carousel

**Files:**
- Modify: `apps/frontend/src/components/ImageGallery.vue`

- [ ] **Step 1: Rewrite ImageGallery with Embla Carousel**

```vue
<script setup lang="ts">
import emblaCarouselVue from 'embla-carousel-vue'
import { computed, ref, watch } from 'vue'
import ImageViewer from '@/components/ImageViewer.vue'
import { getImageUrl } from '@/config'

const props = defineProps<{
  images: string[]
  title?: string
}>()

const parsedImages = computed(() => {
  if (!props.images || props.images.length === 0)
    return []
  return props.images.map((img) => {
    if (typeof img === 'string' && img.startsWith('http'))
      return img
    if (typeof img === 'string')
      return getImageUrl(img)
    return img
  })
})

const [emblaRef, emblaApi] = emblaCarouselVue({ loop: false })
const activeIndex = ref(0)

const showViewer = ref(false)
const viewerIndex = ref(0)

// Sync active index
watch(emblaApi, (api) => {
  if (api) {
    api.on('select', () => {
      activeIndex.value = api.selectedScrollSnap()
    })
  }
})

function scrollTo(index: number) {
  emblaApi.value?.scrollTo(index)
}

function openViewer(index: number) {
  viewerIndex.value = index
  showViewer.value = true
}

function closeViewer() {
  showViewer.value = false
}
</script>

<template>
  <div v-if="parsedImages.length > 0" class="gallery-container">
    <!-- Carousel -->
    <div ref="emblaRef" class="overflow-hidden rounded-lg">
      <div class="flex">
        <div
          v-for="(image, index) in parsedImages"
          :key="index"
          class="flex-[0_0_100%] min-w-0"
        >
          <div
            class="h-[400px] bg-gray-100 cursor-pointer"
            @click="openViewer(index)"
          >
            <img
              :src="image"
              :alt="title || `图片 ${index + 1}`"
              class="w-full h-full object-contain"
              loading="lazy"
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Dot indicators -->
    <div v-if="parsedImages.length > 1" class="flex justify-center gap-2 mt-4">
      <button
        v-for="(_, index) in parsedImages"
        :key="index"
        class="w-2.5 h-2.5 rounded-full transition-colors"
        :class="activeIndex === index ? 'bg-blue-500' : 'bg-gray-300 hover:bg-gray-400'"
        @click="scrollTo(index)"
      />
    </div>

    <!-- Thumbnails -->
    <div v-if="parsedImages.length > 1" class="flex gap-2 mt-3 overflow-x-auto pb-2">
      <button
        v-for="(image, index) in parsedImages"
        :key="index"
        class="flex-shrink-0 w-20 h-14 rounded overflow-hidden border-2 transition-colors"
        :class="activeIndex === index ? 'border-blue-500' : 'border-transparent hover:border-gray-300'"
        @click="scrollTo(index)"
      >
        <img
          :src="image"
          :alt="`缩略图 ${index + 1}`"
          class="w-full h-full object-cover"
          loading="lazy"
        >
      </button>
    </div>

    <!-- Image Viewer -->
    <ImageViewer
      v-if="showViewer"
      :images="parsedImages"
      :title="title"
      :initial-index="viewerIndex"
      @close="closeViewer"
    />
  </div>

  <!-- Empty state -->
  <div
    v-else
    class="w-full h-80 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400"
  >
    <UIcon name="i-lucide-image" class="size-20" />
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/components/ImageGallery.vue
git commit -m "refactor: migrate ImageGallery to Embla Carousel"
```

---

## Chunk 5: Testing and Verification

### Task 12: Run Development Server and Test

**Files:**
- None (testing task)

- [ ] **Step 1: Start development server**

Run: `cd /Users/minos/File/WebFile/demo/gzf && pnpm dev:frontend`
Expected: Server starts on port 3000 without errors

- [ ] **Step 2: Test login page**

Navigate to: `http://localhost:3000/login`
Expected:
- Form renders correctly
- Validation works (empty fields, short username/password)
- Icons display (user, lock)
- Submit button shows loading state
- Toast notifications appear on success/failure

- [ ] **Step 3: Test register page**

Navigate to: `http://localhost:3000/register`
Expected:
- Form renders correctly
- Password confirmation validation works
- Toast notifications work

- [ ] **Step 4: Test header dropdown**

Navigate to: `http://localhost:3000/`
Expected:
- User dropdown menu works after login
- All menu items are clickable
- Icons display correctly

- [ ] **Step 5: Test favorites page**

Navigate to: `http://localhost:3000/favorites`
Expected:
- Empty state displays correctly
- Buttons work (import, export, clear)
- Confirmation modal appears when needed

- [ ] **Step 6: Test history page**

Navigate to: `http://localhost:3000/history`
Expected:
- Empty state displays correctly
- Buttons work
- Toast notifications appear

- [ ] **Step 7: Test property detail carousel**

Navigate to a property detail page with images
Expected:
- Carousel displays images
- Navigation dots work
- Thumbnails navigate carousel
- Click opens image viewer

### Task 13: Build and Check Bundle Size

**Files:**
- None (build task)

- [ ] **Step 1: Build frontend**

Run: `cd /Users/minos/File/WebFile/demo/gzf && pnpm build:frontend`
Expected: Build completes without errors

- [ ] **Step 2: Check bundle size**

Run: `ls -la apps/frontend/dist/assets/*.js | head -5`
Expected: Bundle sizes are reasonable (smaller than with Element-Plus)

- [ ] **Step 3: Commit final state**

```bash
git add -A
git commit -m "chore: verify build and final migration state"
```

### Task 14: Update CLAUDE.md Documentation

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update Tech Stack section**

Update the Tech Stack section in CLAUDE.md to reflect Nuxt-UI instead of Element-Plus:

```markdown
**Tech Stack:**
- **Vue 3.5** with Composition API (`<script setup lang="ts">`)
- **TypeScript 5.9** for type safety
- **Vite 7** as build tool
- **Tailwind CSS v4** (via `@tailwindcss/vite` plugin)
- **Nuxt-UI** for UI components (standalone Vue/Vite mode)
- **Zod** for form validation
- **Embla Carousel** for image carousels
- **Pinia 3** for state management (setup store syntax)
- **Vue Router 5** with lazy-loaded routes
- **VueUse Core** for utility composables
- **AMap JS API** for maps and POI search
```

- [ ] **Step 2: Update Element-Plus references**

Remove references to Element-Plus and replace with Nuxt-UI patterns where applicable.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for Nuxt-UI migration"
```

---

## Summary

This plan migrates all Element-Plus components to Nuxt-UI:

1. **Configuration** - Update dependencies, vite config, main entry
2. **Utilities** - Create toast composable for consistent notifications
3. **Forms** - Migrate Login and Register views with Zod validation
4. **Views** - Migrate Favorites and History views
5. **Header** - Replace dropdown and dialog with Nuxt-UI equivalents
6. **Carousel** - Use Embla Carousel for image gallery
7. **Testing** - Verify all functionality works correctly
8. **Documentation** - Update project docs

Total tasks: 14
Estimated commits: ~12