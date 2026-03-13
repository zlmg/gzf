import type { FavoriteItem, FavoriteRef, HistoryItem, HistoryRef, Preferences, User } from '@/types/user'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { ApiError, authApi, userApi } from '@/api'
import { useFavoriteStore } from './favorite'
import { useFilterStore } from './filter'
import { useHistoryStore } from './history'

const TOKEN_KEY = 'gzf-token'
const USER_KEY = 'gzf-user'

// 云端数据可能为旧格式或新格式
type CloudFavorite = FavoriteRef | FavoriteItem
type CloudHistory = HistoryRef | HistoryItem

function isFavoriteItem(item: CloudFavorite): item is FavoriteItem {
  return 'projectName' in item
}

function isHistoryItem(item: CloudHistory): item is HistoryItem {
  return 'projectName' in item
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const syncStatus = ref<'idle' | 'syncing' | 'error'>('idle')

  // 初始化时恢复用户信息
  const storedUser = localStorage.getItem(USER_KEY)
  if (storedUser) {
    try {
      user.value = JSON.parse(storedUser)
    }
    catch {
      localStorage.removeItem(USER_KEY)
    }
  }

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  // 登录
  const login = async (username: string, password: string) => {
    loading.value = true
    error.value = null

    try {
      const response = await authApi.login(username, password)

      if (response.success && response.token && response.user) {
        token.value = response.token
        user.value = response.user
        localStorage.setItem(TOKEN_KEY, response.token)
        localStorage.setItem(USER_KEY, JSON.stringify(response.user))

        // 登录成功后拉取云端数据
        await pullCloudData()

        return { success: true }
      }

      return { success: false, message: response.message }
    }
    catch (e) {
      const message = e instanceof ApiError ? e.message : '登录失败'
      error.value = message
      return { success: false, message }
    }
    finally {
      loading.value = false
    }
  }

  // 注册
  const register = async (username: string, password: string) => {
    loading.value = true
    error.value = null

    try {
      const response = await authApi.register(username, password)

      if (response.success && response.token && response.user) {
        token.value = response.token
        user.value = response.user
        localStorage.setItem(TOKEN_KEY, response.token)
        localStorage.setItem(USER_KEY, JSON.stringify(response.user))

        return { success: true }
      }

      return { success: false, message: response.message }
    }
    catch (e) {
      const message = e instanceof ApiError ? e.message : '注册失败'
      error.value = message
      return { success: false, message }
    }
    finally {
      loading.value = false
    }
  }

  // 登出
  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  // 拉取云端数据并合并
  const pullCloudData = async () => {
    if (!isAuthenticated.value)
      return

    try {
      syncStatus.value = 'syncing'
      const response = await userApi.getData()

      if (response.success && response.data) {
        // 合并收藏（本地优先）
        if (Array.isArray(response.data.favorites)) {
          mergeFavorites(response.data.favorites as CloudFavorite[])
        }

        // 合并浏览记录（本地优先）
        if (Array.isArray(response.data.history)) {
          mergeHistory(response.data.history as CloudHistory[])
        }

        // 合并筛选偏好
        if (response.data.preferences) {
          mergePreferences(response.data.preferences)
        }
      }

      syncStatus.value = 'idle'
    }
    catch (e) {
      console.error('Failed to pull cloud data:', e)
      syncStatus.value = 'error'
    }
  }

  // 合并收藏数据（支持旧格式和新格式）
  const mergeFavorites = (cloudFavorites: CloudFavorite[]) => {
    const favoriteStore = useFavoriteStore()
    const localFavorites = [...favoriteStore.favorites]

    // 创建合并 map，以 projectNo 为 key
    const merged = new Map<string, FavoriteRef>()

    // 先加入本地数据
    for (const item of localFavorites) {
      merged.set(item.projectNo, item)
    }

    // 合并云端数据，比较时间戳
    for (const cloudItem of cloudFavorites) {
      // 转换为简化格式
      const ref: FavoriteRef = isFavoriteItem(cloudItem)
        ? { projectNo: cloudItem.projectNo, addedAt: cloudItem.addedAt }
        : { projectNo: cloudItem.projectNo, addedAt: cloudItem.addedAt }

      const localItem = merged.get(ref.projectNo)
      if (!localItem || ref.addedAt > localItem.addedAt) {
        merged.set(ref.projectNo, ref)
      }
    }

    // 更新 store
    favoriteStore.favorites = [...merged.values()].toSorted((a, b) => b.addedAt - a.addedAt).slice(0, 50) // 限制最大数量

    // 保存到 localStorage
    localStorage.setItem('gzf-favorites', JSON.stringify(favoriteStore.favorites))
  }

  // 合并浏览记录（支持旧格式和新格式）
  const mergeHistory = (cloudHistory: CloudHistory[]) => {
    const historyStore = useHistoryStore()
    const localHistory = [...historyStore.history]

    // 创建合并 map，以 projectNo 为 key
    const merged = new Map<string, HistoryRef>()

    // 先加入本地数据
    for (const item of localHistory) {
      merged.set(item.projectNo, item)
    }

    // 合并云端数据，比较时间戳
    for (const cloudItem of cloudHistory) {
      // 转换为简化格式
      const ref: HistoryRef = isHistoryItem(cloudItem)
        ? { projectNo: cloudItem.projectNo, viewedAt: cloudItem.viewedAt }
        : { projectNo: cloudItem.projectNo, viewedAt: cloudItem.viewedAt }

      const localItem = merged.get(ref.projectNo)
      if (!localItem || ref.viewedAt > localItem.viewedAt) {
        merged.set(ref.projectNo, ref)
      }
    }

    // 更新 store
    historyStore.history = [...merged.values()].toSorted((a, b) => b.viewedAt - a.viewedAt).slice(0, 100) // 限制最大数量

    // 保存到 localStorage
    localStorage.setItem('gzf-history', JSON.stringify(historyStore.history))
  }

  // 合并筛选偏好
  const mergePreferences = (prefs: Preferences) => {
    const filterStore = useFilterStore()

    if (prefs.filters) {
      filterStore.filters = { ...filterStore.filters, ...prefs.filters }
      localStorage.setItem('gzf-filters', JSON.stringify(filterStore.filters))
    }

    if (prefs.sort) {
      filterStore.sortField = prefs.sort.field
      filterStore.sortOrder = prefs.sort.order
      localStorage.setItem('gzf-sort', JSON.stringify(prefs.sort))
    }
  }

  return {
    token,
    user,
    loading,
    error,
    syncStatus,
    isAuthenticated,
    login,
    register,
    logout,
    pullCloudData,
  }
})
