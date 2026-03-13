import type { FavoriteRef, FavoriteItem } from '@/types/user'
import type { Property } from '@/types/property'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getImageUrl } from '@/config'
import { usePropertyStore } from './property'

// 导出数据结构 v1.0（完整数据，向后兼容）
export interface FavoriteExportDataV1 {
  version: '1.0'
  exportTime: number
  totalCount: number
  entries: FavoriteItem[]
}

// 导出数据结构 v2.0（简化格式）
export interface FavoriteExportDataV2 {
  version: '2.0'
  exportTime: number
  totalCount: number
  entries: FavoriteRef[]
}

// 统一导出数据类型
export type FavoriteExportData = FavoriteExportDataV1 | FavoriteExportDataV2

// 导入结果
export interface FavoriteImportResult {
  imported: number // 成功导入数量
  skipped: number // 跳过数量（已存在）
  errors: number // 错误数量
  total: number // 文件中总数
}

// 导入预览结果
export interface FavoriteImportPreview {
  newCount: number // 新增数量
  existingCount: number // 已存在数量
  invalidCount: number // 无效数量
  canImport: number // 实际可导入数量
  total: number // 文件中总数
}

// 带完整房源信息的收藏项
export interface FavoriteWithProperty {
  ref: FavoriteRef
  property: Property | null // null 表示房源已失效
}

const STORAGE_KEY = 'gzf-favorites'
const MAX_FAVORITES = 50

function loadFromStorage(): FavoriteRef[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // 支持新旧两种格式
      if (Array.isArray(parsed)) {
        // 检测是旧格式（完整数据）还是新格式（简化数据）
        const firstItem = parsed[0]
        if (firstItem && 'projectName' in firstItem) {
          // 旧格式，转换为简化格式
          return parsed
            .filter(item => item.projectNo && item.addedAt)
            .map(item => ({
              projectNo: item.projectNo,
              addedAt: item.addedAt,
            }))
        }
        // 新格式
        return parsed.filter(item =>
          item.projectNo && typeof item.addedAt === 'number',
        )
      }
    }
  }
  catch (e) {
    console.error('Failed to load favorites from storage:', e)
  }
  return []
}

function saveToStorage(list: FavoriteRef[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  }
  catch (e) {
    console.error('Failed to save favorites to storage:', e)
  }
}

export const useFavoriteStore = defineStore('favorite', () => {
  const favorites = ref<FavoriteRef[]>(loadFromStorage())
  const notification = ref<{ show: boolean, message: string, type: 'success' | 'error' | 'warning' }>({
    show: false,
    message: '',
    type: 'success',
  })

  const propertyStore = usePropertyStore()

  // 带完整房源信息的收藏列表
  const favoritesWithProperties = computed<FavoriteWithProperty[]>(() => {
    return favorites.value.map((ref) => {
      const property = propertyStore.getPropertyByNo(ref.projectNo) ?? null
      return { ref, property }
    })
  })

  // 有效的收藏列表（排除已失效的房源）
  const validFavorites = computed<FavoriteWithProperty[]>(() => {
    return favoritesWithProperties.value.filter(item => item.property !== null)
  })

  // 失效的收藏数量
  const invalidCount = computed(() => {
    return favoritesWithProperties.value.filter(item => item.property === null).length
  })

  const count = computed(() => favorites.value.length)
  const validCount = computed(() => validFavorites.value.length)

  const isFavorite = (projectNo: string): boolean => {
    return favorites.value.some(item => item.projectNo === projectNo)
  }

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    notification.value = { show: true, message, type }
    setTimeout(() => {
      notification.value.show = false
    }, 2000)
  }

  const addToFavorites = (property: Property): { success: boolean, message: string } => {
    // Check if already exists
    if (isFavorite(property.projectNo)) {
      showNotification('该房源已在收藏列表中', 'warning')
      return { success: false, message: '该房源已在收藏列表中' }
    }

    // Check max limit
    if (favorites.value.length >= MAX_FAVORITES) {
      showNotification(`收藏数量已达上限 (${MAX_FAVORITES} 个)`, 'error')
      return { success: false, message: `收藏数量已达上限 (${MAX_FAVORITES} 个)` }
    }

    const ref: FavoriteRef = {
      projectNo: property.projectNo,
      addedAt: Date.now(),
    }

    favorites.value.unshift(ref) // Add to beginning
    saveToStorage(favorites.value)
    showNotification('收藏成功')
    return { success: true, message: '收藏成功' }
  }

  const removeFromFavorites = (projectNo: string): { success: boolean, message: string } => {
    const index = favorites.value.findIndex(item => item.projectNo === projectNo)
    if (index === -1) {
      showNotification('未找到该收藏', 'error')
      return { success: false, message: '未找到该收藏' }
    }

    favorites.value.splice(index, 1)
    saveToStorage(favorites.value)
    showNotification('已取消收藏')
    return { success: true, message: '已取消收藏' }
  }

  const toggleFavorite = (property: Property): boolean => {
    if (isFavorite(property.projectNo)) {
      removeFromFavorites(property.projectNo)
      return false
    }
    else {
      addToFavorites(property)
      return true
    }
  }

  const clearAllFavorites = () => {
    favorites.value = []
    saveToStorage(favorites.value)
    showNotification('已清空所有收藏')
  }

  const getFavorite = (projectNo: string): FavoriteRef | undefined => {
    return favorites.value.find(item => item.projectNo === projectNo)
  }

  const getThumbnailUrl = (thumbnail: string): string => {
    if (!thumbnail)
      return ''
    const images = thumbnail.split(',')
    const path = images[0]
    if (!path)
      return ''
    if (path.startsWith('http'))
      return path
    return getImageUrl(path)
  }

  /**
   * 移除失效的收藏
   */
  const removeInvalidFavorites = () => {
    const before = favorites.value.length
    favorites.value = favorites.value.filter((ref) => {
      return propertyStore.getPropertyByNo(ref.projectNo) !== null
    })
    const removed = before - favorites.value.length
    if (removed > 0) {
      saveToStorage(favorites.value)
      showNotification(`已移除 ${removed} 个失效收藏`)
    }
    return removed
  }

  /**
   * 导出收藏数据（v2.0 格式）
   */
  const exportFavorites = (): FavoriteExportDataV2 | null => {
    if (favorites.value.length === 0) {
      return null
    }
    return {
      version: '2.0',
      exportTime: Date.now(),
      totalCount: favorites.value.length,
      entries: [...favorites.value],
    }
  }

  /**
   * 预览导入数据
   */
  const previewImport = (data: FavoriteExportData): FavoriteImportPreview => {
    const preview: FavoriteImportPreview = {
      newCount: 0,
      existingCount: 0,
      invalidCount: 0,
      canImport: 0,
      total: data.entries?.length || 0,
    }

    if (!data.entries || !Array.isArray(data.entries)) {
      preview.invalidCount = preview.total
      return preview
    }

    // 提取 projectNo 列表（兼容 v1.0 和 v2.0）
    const projectNos = data.entries.map((entry) => {
      return entry.projectNo
    }).filter(Boolean)

    for (const projectNo of projectNos) {
      if (isFavorite(projectNo)) {
        preview.existingCount++
      }
      else {
        preview.newCount++
      }
    }

    // 计算实际可导入数量（考虑上限）
    const availableSlots = MAX_FAVORITES - favorites.value.length
    preview.canImport = Math.min(preview.newCount, availableSlots)

    return preview
  }

  /**
   * 导入收藏数据（支持 v1.0 和 v2.0）
   */
  const importFavorites = (data: FavoriteExportData): FavoriteImportResult => {
    const result: FavoriteImportResult = {
      imported: 0,
      skipped: 0,
      errors: 0,
      total: data.entries?.length || 0,
    }

    // 验证版本
    const version = data.version
    if (version !== '1.0' && version !== '2.0') {
      console.error('Unsupported favorites version:', version)
      result.errors = result.total
      return result
    }

    if (!data.entries || !Array.isArray(data.entries)) {
      result.errors = result.total
      return result
    }

    const availableSlots = MAX_FAVORITES - favorites.value.length
    let imported = 0

    for (const entry of data.entries) {
      try {
        // 提取 projectNo 和 addedAt（兼容 v1.0 和 v2.0）
        const projectNo = entry.projectNo
        const addedAt = entry.addedAt || Date.now()

        if (!projectNo) {
          result.errors++
          continue
        }

        // 检查是否已存在
        if (isFavorite(projectNo)) {
          result.skipped++
          continue
        }

        // 检查数量上限
        if (imported >= availableSlots) {
          result.skipped++
          continue
        }

        // 添加收藏
        const ref: FavoriteRef = { projectNo, addedAt }
        favorites.value.unshift(ref)
        imported++
        result.imported++
      }
      catch (e) {
        console.error('Failed to import favorite entry:', e)
        result.errors++
      }
    }

    if (result.imported > 0) {
      // 按时间排序
      favorites.value.sort((a, b) => b.addedAt - a.addedAt)
      saveToStorage(favorites.value)
    }

    return result
  }

  /**
   * 获取用于云端同步的数据（简化格式）
   */
  const getSyncData = (): FavoriteRef[] => {
    return [...favorites.value]
  }

  return {
    favorites,
    favoritesWithProperties,
    validFavorites,
    invalidCount,
    count,
    validCount,
    notification,
    isFavorite,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    clearAllFavorites,
    getFavorite,
    getThumbnailUrl,
    removeInvalidFavorites,
    exportFavorites,
    previewImport,
    importFavorites,
    getSyncData,
  }
})
