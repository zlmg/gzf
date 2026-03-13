<script setup lang="ts">
import type { PoiExportData } from '@/composables/usePoiCache'
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { adminApi } from '@/api'
import { useAppToast } from '@/composables/useAppToast'
import { usePoiCache } from '@/composables/usePoiCache'
import { useAuthStore } from '@/stores/auth'
import { useFavoriteStore } from '@/stores/favorite'
import { useHistoryStore } from '@/stores/history'

const favoriteStore = useFavoriteStore()
const historyStore = useHistoryStore()
const authStore = useAuthStore()
const toast = useAppToast()
const { exportCache, importCache } = usePoiCache()
const isMobileMenuOpen = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// 管理员功能
const isAdmin = computed(() => authStore.user?.username === 'minos')
const adminFileInput = ref<HTMLInputElement | null>(null)
const importDialogVisible = ref(false)
const importFile = ref<File | null>(null)
const importing = ref(false)
const importResult = ref<{ usersImported: number, usersSkipped: number, poisImported: number, poisSkipped: number } | null>(null)

// 数据库导出
async function handleDbExport() {
  try {
    toast.info('正在导出数据库...')
    await adminApi.exportDatabase()
    toast.success('数据库导出成功')
  }
  catch (e) {
    const message = e instanceof Error ? e.message : '导出失败'
    toast.error(message)
  }
}

// 触发数据库导入文件选择
function triggerDbImport() {
  adminFileInput.value?.click()
}

// 选择导入文件
function handleDbFileSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    importFile.value = file
    importResult.value = null
    importDialogVisible.value = true
  }
  // 清空文件选择
  if (adminFileInput.value) {
    adminFileInput.value.value = ''
  }
}

// 确认导入
async function confirmImport() {
  if (!importFile.value)
    return

  importing.value = true
  try {
    const result = await adminApi.importDatabase(importFile.value)
    importResult.value = result.data
    toast.success(`导入成功：用户 ${result.data.usersImported} 条，POI ${result.data.poisImported} 条`)
  }
  catch (e) {
    const message = e instanceof Error ? e.message : '导入失败'
    toast.error(message)
  }
  finally {
    importing.value = false
  }
}

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false
}

function handleLogout() {
  authStore.logout()
  toast.success('已退出登录')
}

// 导出POI缓存
function handleExport() {
  const data = exportCache()
  if (!data || data.totalCount === 0) {
    toast.warning('没有可导出的POI缓存数据')
    return
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `gzf-poi-cache-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
  toast.success(`已导出 ${data.totalCount} 条数据`)
}

// 触发文件选择
function triggerImport() {
  fileInput.value?.click()
}

// 导入POI缓存
async function handleImport(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file)
    return

  try {
    const text = await file.text()
    const data = JSON.parse(text) as PoiExportData

    if (!data.version || !data.entries) {
      toast.error('无效的缓存文件格式')
      return
    }

    const result = importCache(data)
    if (result.imported > 0) {
      toast.success(`已导入 ${result.imported} 条数据${result.skipped > 0 ? `，跳过 ${result.skipped} 条` : ''}`)
    }
    else if (result.skipped > 0) {
      toast.info(`跳过 ${result.skipped} 条数据（本地已有更新版本）`)
    }
  }
  catch (e) {
    console.error('Import error:', e)
    toast.error('导入失败，请检查文件格式')
  }

  // 清空文件选择，允许重复导入同一文件
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 用户下拉菜单项
const userMenuItems = computed(() => {
  const items: Array<Array<{ label: string, icon: string, click: () => void }>> = [
    [
      { label: '导出缓存', icon: 'i-lucide-download', click: handleExport },
      { label: '导入缓存', icon: 'i-lucide-upload', click: triggerImport },
    ],
  ]

  if (isAdmin.value) {
    items.push([
      { label: '数据库导出', icon: 'i-lucide-database', click: handleDbExport },
      { label: '数据库导入', icon: 'i-lucide-database', click: triggerDbImport },
    ])
  }

  items.push([
    { label: '退出登录', icon: 'i-lucide-log-out', click: handleLogout },
  ])

  return items
})
</script>

<template>
  <header class="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
    <div class="container-app py-3 md:py-4">
      <div class="flex items-center justify-between">
        <!-- Logo and Title -->
        <RouterLink
          to="/"
          class="flex items-center gap-2 md:gap-3 hover:opacity-90 transition-opacity"
          @click="closeMobileMenu"
        >
          <UIcon name="i-lucide-home" class="size-7 md:size-8 flex-shrink-0" />
          <h1 class="text-base md:text-xl font-bold truncate">
            宝山公租房查询demo
          </h1>
        </RouterLink>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center space-x-4">
          <RouterLink
            to="/"
            class="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
            active-class="bg-white/20"
          >
            <UIcon name="i-lucide-list" class="size-5" />
            房源列表
          </RouterLink>
          <RouterLink
            to="/favorites"
            class="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
            active-class="bg-white/20"
          >
            <UIcon name="i-lucide-heart" class="size-5" />
            收藏
            <span
              v-if="favoriteStore.count > 0"
              class="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
            >
              {{ favoriteStore.count > 99 ? '99+' : favoriteStore.count }}
            </span>
          </RouterLink>
          <RouterLink
            to="/history"
            class="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
            active-class="bg-white/20"
          >
            <UIcon name="i-lucide-clock" class="size-5" />
            浏览记录
            <span
              v-if="historyStore.count > 0"
              class="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
            >
              {{ historyStore.count > 99 ? '99+' : historyStore.count }}
            </span>
          </RouterLink>
          <RouterLink
            to="/compare"
            class="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
            active-class="bg-white/20"
          >
            <UIcon name="i-lucide-bar-chart-3" class="size-5" />
            房源对比
          </RouterLink>
          <!-- 登录/用户入口 -->
          <div class="flex items-center">
            <template v-if="authStore.isAuthenticated">
              <UDropdownMenu :items="userMenuItems">
                <UButton icon="i-lucide-chevron-down" variant="ghost" color="white">
                  <UIcon name="i-lucide-user" class="size-4 mr-1.5" />
                  {{ authStore.user?.username }}
                </UButton>
              </UDropdownMenu>
            </template>
            <RouterLink
              v-else
              to="/login"
              class="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-1.5 text-sm"
            >
              <UIcon name="i-lucide-user" class="size-4" />
              登录
            </RouterLink>
            <input ref="fileInput" type="file" accept=".json" class="hidden" @change="handleImport">
          </div>
        </nav>

        <!-- Mobile Menu Button -->
        <button
          class="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="菜单"
          @click="toggleMobileMenu"
        >
          <UIcon v-if="!isMobileMenuOpen" name="i-lucide-menu" class="size-6" />
          <UIcon v-else name="i-lucide-x" class="size-6" />
        </button>
      </div>

      <!-- Mobile Navigation Dropdown -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <nav v-if="isMobileMenuOpen" class="md:hidden mt-3 pt-3 border-t border-white/20">
          <div class="flex flex-col space-y-1">
            <RouterLink
              to="/"
              class="px-4 py-3 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
              active-class="bg-white/20"
              @click="closeMobileMenu"
            >
              <UIcon name="i-lucide-list" class="size-5" />
              房源列表
            </RouterLink>
            <RouterLink
              to="/favorites"
              class="px-4 py-3 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
              active-class="bg-white/20"
              @click="closeMobileMenu"
            >
              <UIcon name="i-lucide-heart" class="size-5" />
              收藏
              <span
                v-if="favoriteStore.count > 0"
                class="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
              >
                {{ favoriteStore.count > 99 ? '99+' : favoriteStore.count }}
              </span>
            </RouterLink>
            <RouterLink
              to="/history"
              class="px-4 py-3 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
              active-class="bg-white/20"
              @click="closeMobileMenu"
            >
              <UIcon name="i-lucide-clock" class="size-5" />
              浏览记录
              <span
                v-if="historyStore.count > 0"
                class="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
              >
                {{ historyStore.count > 99 ? '99+' : historyStore.count }}
              </span>
            </RouterLink>
            <RouterLink
              to="/compare"
              class="px-4 py-3 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
              active-class="bg-white/20"
              @click="closeMobileMenu"
            >
              <UIcon name="i-lucide-bar-chart-3" class="size-5" />
              房源对比
            </RouterLink>
            <!-- 移动端登录入口 -->
            <template v-if="authStore.isAuthenticated">
              <div class="px-4 py-3 flex items-center justify-between">
                <span class="flex items-center gap-2">
                  <UIcon name="i-lucide-user" class="size-5" />
                  {{ authStore.user?.username }}
                </span>
                <button
                  class="text-sm text-red-200 hover:text-red-100"
                  @click="handleLogout"
                >
                  退出
                </button>
              </div>
              <!-- 移动端缓存管理 -->
              <div class="border-t border-white/20 my-1" />
              <button
                class="px-4 py-3 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 text-left w-full"
                @click="handleExport(); closeMobileMenu()"
              >
                <UIcon name="i-lucide-download" class="size-5" />
                导出缓存
              </button>
              <button
                class="px-4 py-3 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 text-left w-full"
                @click="triggerImport(); closeMobileMenu()"
              >
                <UIcon name="i-lucide-upload" class="size-5" />
                导入缓存
              </button>
              <!-- 移动端管理员菜单 -->
              <template v-if="isAdmin">
                <div class="border-t border-white/20 my-1" />
                <button
                  class="px-4 py-3 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 text-left w-full"
                  @click="handleDbExport(); closeMobileMenu()"
                >
                  <UIcon name="i-lucide-database" class="size-5" />
                  数据库导出
                </button>
                <button
                  class="px-4 py-3 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 text-left w-full"
                  @click="triggerDbImport(); closeMobileMenu()"
                >
                  <UIcon name="i-lucide-database" class="size-5" />
                  数据库导入
                </button>
              </template>
            </template>
            <RouterLink
              v-else
              to="/login"
              class="px-4 py-3 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
              @click="closeMobileMenu"
            >
              <UIcon name="i-lucide-user" class="size-5" />
              登录
            </RouterLink>
          </div>
        </nav>
      </Transition>
    </div>

    <!-- 管理员导入文件选择器 -->
    <input ref="adminFileInput" type="file" accept=".zip" class="hidden" @change="handleDbFileSelect">

    <!-- 导入结果对话框 -->
    <UModal v-model:open="importDialogVisible" title="数据库导入">
      <template #body>
        <div v-if="!importResult">
          <p class="mb-4">
            确认导入文件：<strong>{{ importFile?.name }}</strong>
          </p>
          <p class="text-gray-500 text-sm">
            导入时会跳过已存在的记录（用户名相同的用户，坐标和分类相同的POI）
          </p>
        </div>
        <div v-else>
          <p class="font-medium mb-3">
            导入完成
          </p>
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
  </header>
</template>
