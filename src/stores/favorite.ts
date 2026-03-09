import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Property, RoomTypeDetail } from '@/types/property'
import { getImageUrl } from '@/config'

export interface FavoriteItem {
  projectNo: string
  projectName: string
  location: string
  layout: string
  roomType: string
  minRent: number
  maxRent: number
  thumbnail: string
  kezuCount: number
  openQueue: string
  addedAt: number // timestamp
  // 新增字段
  district?: string
  houseType?: string
  totalCount?: string
  openingDate?: string
  totalArea?: string
  houseSource?: string
  roomTypeDetails?: RoomTypeDetail[]
}

// 导出数据结构
export interface FavoriteExportData {
  version: string        // "1.0"
  exportTime: number     // 导出时间戳
  totalCount: number     // 收藏总数
  entries: FavoriteItem[] // 收藏数据
}

// 导入结果
export interface FavoriteImportResult {
  imported: number       // 成功导入数量
  skipped: number        // 跳过数量（已存在）
  errors: number         // 错误数量
  total: number          // 文件中总数
}

// 导入预览结果
export interface FavoriteImportPreview {
  newCount: number       // 新增数量
  existingCount: number  // 已存在数量
  invalidCount: number   // 无效数量
  canImport: number      // 实际可导入数量
  total: number          // 文件中总数
}

const STORAGE_KEY = 'gzf-favorites'
const MAX_FAVORITES = 50

const loadFromStorage = (): FavoriteItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Validate data structure
      if (Array.isArray(parsed)) {
        return parsed.filter(item =>
          item.projectNo && item.projectName && item.addedAt
        )
      }
    }
  } catch (e) {
    console.error('Failed to load favorites from storage:', e)
  }
  return []
}

const saveToStorage = (list: FavoriteItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch (e) {
    console.error('Failed to save favorites to storage:', e)
  }
}

export const useFavoriteStore = defineStore('favorite', () => {
  const favorites = ref<FavoriteItem[]>(loadFromStorage())
  const notification = ref<{ show: boolean; message: string; type: 'success' | 'error' | 'warning' }>({
    show: false,
    message: '',
    type: 'success'
  })

  const count = computed(() => favorites.value.length)

  const isFavorite = (projectNo: string): boolean => {
    return favorites.value.some(item => item.projectNo === projectNo)
  }

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    notification.value = { show: true, message, type }
    setTimeout(() => {
      notification.value.show = false
    }, 2000)
  }

  const addToFavorites = (property: Property): { success: boolean; message: string } => {
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

    const item: FavoriteItem = {
      projectNo: property.projectNo,
      projectName: property.projectName,
      location: property.location,
      layout: property.layout,
      roomType: property.roomType,
      minRent: property.minRent,
      maxRent: property.maxRent,
      thumbnail: property.thumbnail,
      kezuCount: property.kezuCount,
      openQueue: property.openQueue,
      addedAt: Date.now(),
      // 新增字段
      district: property.district,
      houseType: property.houseType,
      totalCount: property.totalCount,
      openingDate: property.openingDate,
      totalArea: property.totalArea,
      houseSource: property.houseSource,
      roomTypeDetails: property.roomTypeDetails
    }

    favorites.value.unshift(item) // Add to beginning
    saveToStorage(favorites.value)
    showNotification('收藏成功')
    return { success: true, message: '收藏成功' }
  }

  const removeFromFavorites = (projectNo: string): { success: boolean; message: string } => {
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
    } else {
      addToFavorites(property)
      return true
    }
  }

  const clearAllFavorites = () => {
    favorites.value = []
    saveToStorage(favorites.value)
    showNotification('已清空所有收藏')
  }

  const getFavorite = (projectNo: string): FavoriteItem | undefined => {
    return favorites.value.find(item => item.projectNo === projectNo)
  }

  const getThumbnailUrl = (thumbnail: string): string => {
    if (!thumbnail) return ''
    const images = thumbnail.split(',')
    const path = images[0]
    if (!path) return ''
    if (path.startsWith('http')) return path
    return getImageUrl(path)
  }

  /**
   * 导出收藏数据
   */
  const exportFavorites = (): FavoriteExportData | null => {
    if (favorites.value.length === 0) {
      return null
    }
    return {
      version: '1.0',
      exportTime: Date.now(),
      totalCount: favorites.value.length,
      entries: [...favorites.value]
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
      total: data.entries?.length || 0
    }

    if (!data.entries || !Array.isArray(data.entries)) {
      preview.invalidCount = preview.total
      return preview
    }

    for (const entry of data.entries) {
      // 验证必填字段
      if (!entry.projectNo || !entry.projectName) {
        preview.invalidCount++
        continue
      }

      if (isFavorite(entry.projectNo)) {
        preview.existingCount++
      } else {
        preview.newCount++
      }
    }

    // 计算实际可导入数量（考虑上限）
    const availableSlots = MAX_FAVORITES - favorites.value.length
    preview.canImport = Math.min(preview.newCount, availableSlots)

    return preview
  }

  /**
   * 导入收藏数据
   */
  const importFavorites = (data: FavoriteExportData): FavoriteImportResult => {
    const result: FavoriteImportResult = {
      imported: 0,
      skipped: 0,
      errors: 0,
      total: data.entries?.length || 0
    }

    // 验证版本
    if (data.version !== '1.0') {
      console.error('Unsupported favorites version:', data.version)
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
        // 验证必填字段
        if (!entry.projectNo || !entry.projectName) {
          result.errors++
          continue
        }

        // 检查是否已存在
        if (isFavorite(entry.projectNo)) {
          result.skipped++
          continue
        }

        // 检查数量上限
        if (imported >= availableSlots) {
          result.skipped++
          continue
        }

        // 添加收藏（设置新的 addedAt 时间）
        const item: FavoriteItem = {
          ...entry,
          addedAt: entry.addedAt || Date.now()
        }
        favorites.value.unshift(item)
        imported++
        result.imported++
      } catch (e) {
        console.error('Failed to import favorite entry:', e)
        result.errors++
      }
    }

    if (result.imported > 0) {
      saveToStorage(favorites.value)
    }

    return result
  }

  return {
    favorites,
    count,
    notification,
    isFavorite,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    clearAllFavorites,
    getFavorite,
    getThumbnailUrl,
    exportFavorites,
    previewImport,
    importFavorites
  }
})