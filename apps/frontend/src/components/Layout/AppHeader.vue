<script setup lang="ts">
import type { PoiExportData } from '@/composables/usePoiCache'
import { ElMessage } from 'element-plus'
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { adminApi } from '@/api'
import { usePoiCache } from '@/composables/usePoiCache'
import { useAuthStore } from '@/stores/auth'
import { useFavoriteStore } from '@/stores/favorite'
import { useHistoryStore } from '@/stores/history'

const favoriteStore = useFavoriteStore()
const historyStore = useHistoryStore()
const authStore = useAuthStore()
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
    ElMessage.info('正在导出数据库...')
    await adminApi.exportDatabase()
    ElMessage.success('数据库导出成功')
  }
  catch (e) {
    const message = e instanceof Error ? e.message : '导出失败'
    ElMessage.error(message)
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
    ElMessage.success(`导入成功：用户 ${result.data.usersImported} 条，POI ${result.data.poisImported} 条`)
  }
  catch (e) {
    const message = e instanceof Error ? e.message : '导入失败'
    ElMessage.error(message)
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
  ElMessage.success('已退出登录')
}

// 导出POI缓存
function handleExport() {
  const data = exportCache()
  if (!data || data.totalCount === 0) {
    ElMessage.warning('没有可导出的POI缓存数据')
    return
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `gzf-poi-cache-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`已导出 ${data.totalCount} 条数据`)
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
      ElMessage.error('无效的缓存文件格式')
      return
    }

    const result = importCache(data)
    if (result.imported > 0) {
      ElMessage.success(`已导入 ${result.imported} 条数据${result.skipped > 0 ? `，跳过 ${result.skipped} 条` : ''}`)
    }
    else if (result.skipped > 0) {
      ElMessage.info(`跳过 ${result.skipped} 条数据（本地已有更新版本）`)
    }
  }
  catch (e) {
    console.error('Import error:', e)
    ElMessage.error('导入失败，请检查文件格式')
  }

  // 清空文件选择，允许重复导入同一文件
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
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
          <svg class="w-7 h-7 md:w-8 md:h-8 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
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
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            房源列表
          </RouterLink>
          <RouterLink
            to="/favorites"
            class="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
            active-class="bg-white/20"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
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
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
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
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            房源对比
          </RouterLink>
          <!-- 登录/用户入口 -->
          <div class="flex items-center">
            <template v-if="authStore.isAuthenticated">
              <el-dropdown trigger="click">
                <button class="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-1.5 text-sm text-white">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {{ authStore.user?.username }}
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="handleExport">
                      <div class="flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        导出缓存
                      </div>
                    </el-dropdown-item>
                    <el-dropdown-item @click="triggerImport">
                      <div class="flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        导入缓存
                      </div>
                    </el-dropdown-item>
                    <!-- 管理员菜单 -->
                    <template v-if="isAdmin">
                      <el-dropdown-item divided @click="handleDbExport">
                        <div class="flex items-center gap-2">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          数据库导出
                        </div>
                      </el-dropdown-item>
                      <el-dropdown-item @click="triggerDbImport">
                        <div class="flex items-center gap-2">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          数据库导入
                        </div>
                      </el-dropdown-item>
                    </template>
                    <el-dropdown-item :divided="!isAdmin" @click="handleLogout">
                      退出登录
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
            <RouterLink
              v-else
              to="/login"
              class="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-1.5 text-sm"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
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
          <svg v-if="!isMobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
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
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              房源列表
            </RouterLink>
            <RouterLink
              to="/favorites"
              class="px-4 py-3 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
              active-class="bg-white/20"
              @click="closeMobileMenu"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
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
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
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
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              房源对比
            </RouterLink>
            <!-- 移动端登录入口 -->
            <template v-if="authStore.isAuthenticated">
              <div class="px-4 py-3 flex items-center justify-between">
                <span class="flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
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
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                导出缓存
              </button>
              <button
                class="px-4 py-3 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 text-left w-full"
                @click="triggerImport(); closeMobileMenu()"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                导入缓存
              </button>
              <!-- 移动端管理员菜单 -->
              <template v-if="isAdmin">
                <div class="border-t border-white/20 my-1" />
                <button
                  class="px-4 py-3 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 text-left w-full"
                  @click="handleDbExport(); closeMobileMenu()"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  数据库导出
                </button>
                <button
                  class="px-4 py-3 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 text-left w-full"
                  @click="triggerDbImport(); closeMobileMenu()"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
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
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              登录
            </RouterLink>
          </div>
        </nav>
      </Transition>
    </div>

    <!-- 管理员导入文件选择器 -->
    <input ref="adminFileInput" type="file" accept=".zip" class="hidden" @change="handleDbFileSelect">

    <!-- 导入结果对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="数据库导入"
      width="400px"
    >
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
      <template #footer>
        <el-button @click="importDialogVisible = false">
          关闭
        </el-button>
        <el-button v-if="!importResult" type="primary" :loading="importing" @click="confirmImport">
          确认导入
        </el-button>
      </template>
    </el-dialog>
  </header>
</template>
