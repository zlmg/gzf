import { watch, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useFavoriteStore } from '@/stores/favorite'
import { useHistoryStore } from '@/stores/history'
import { useFilterStore } from '@/stores/filter'
import { userApi } from '@/api'
import { useDebounceFn } from '@vueuse/core'
import type { Preferences } from '@/types/user'

export function useSync() {
  const authStore = useAuthStore()
  const favoriteStore = useFavoriteStore()
  const historyStore = useHistoryStore()
  const filterStore = useFilterStore()

  const isSyncing = ref(false)
  const syncError = ref<string | null>(null)

  // 同步收藏
  const syncFavorites = async () => {
    if (!authStore.isAuthenticated || isSyncing.value) return

    try {
      isSyncing.value = true
      await userApi.syncFavorites(favoriteStore.favorites)
    } catch (e) {
      console.error('Failed to sync favorites:', e)
      syncError.value = '收藏同步失败'
    } finally {
      isSyncing.value = false
    }
  }

  // 同步浏览记录
  const syncHistory = async () => {
    if (!authStore.isAuthenticated || isSyncing.value) return

    try {
      isSyncing.value = true
      await userApi.syncHistory(historyStore.history)
    } catch (e) {
      console.error('Failed to sync history:', e)
      syncError.value = '浏览记录同步失败'
    } finally {
      isSyncing.value = false
    }
  }

  // 同步筛选偏好
  const syncPreferences = async () => {
    if (!authStore.isAuthenticated || isSyncing.value) return

    try {
      isSyncing.value = true
      const preferences: Preferences = {
        filters: filterStore.filters,
        sort: {
          field: filterStore.sortField,
          order: filterStore.sortOrder
        }
      }
      await userApi.syncPreferences(preferences)
    } catch (e) {
      console.error('Failed to sync preferences:', e)
      syncError.value = '偏好同步失败'
    } finally {
      isSyncing.value = false
    }
  }

  // 同步所有数据
  const syncAll = async () => {
    if (!authStore.isAuthenticated) return

    isSyncing.value = true
    syncError.value = null

    try {
      await Promise.all([
        syncFavorites(),
        syncHistory(),
        syncPreferences()
      ])
    } finally {
      isSyncing.value = false
    }
  }

  // 防抖同步（2秒后执行）
  const debouncedSyncFavorites = useDebounceFn(syncFavorites, 2000)
  const debouncedSyncHistory = useDebounceFn(syncHistory, 2000)
  const debouncedSyncPreferences = useDebounceFn(syncPreferences, 2000)

  // 监听数据变化，自动同步
  const startAutoSync = () => {
    // 监听收藏变化
    watch(
      () => favoriteStore.favorites,
      () => {
        if (authStore.isAuthenticated) {
          debouncedSyncFavorites()
        }
      },
      { deep: true }
    )

    // 监听浏览记录变化
    watch(
      () => historyStore.history,
      () => {
        if (authStore.isAuthenticated) {
          debouncedSyncHistory()
        }
      },
      { deep: true }
    )

    // 监听筛选偏好变化
    watch(
      () => [filterStore.filters, filterStore.sortField, filterStore.sortOrder],
      () => {
        if (authStore.isAuthenticated) {
          debouncedSyncPreferences()
        }
      },
      { deep: true }
    )
  }

  return {
    isSyncing,
    syncError,
    syncFavorites,
    syncHistory,
    syncPreferences,
    syncAll,
    startAutoSync
  }
}