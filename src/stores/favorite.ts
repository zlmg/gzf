import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Property } from '@/types/property'

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

const IMAGE_BASE_URL = 'https://www.bsgzf.com.cn'

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
      addedAt: Date.now()
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
    if (path.startsWith('http')) return path
    return `${IMAGE_BASE_URL}${path}`
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
    getThumbnailUrl
  }
})