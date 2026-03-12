import type { Property, RoomTypeDetail } from '@/types/property'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export interface HistoryItem {
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
  viewedAt: number // 浏览时间戳（毫秒）
  // 可选字段
  district?: string
  houseType?: string
  totalCount?: string
  openingDate?: string
  totalArea?: string
  houseSource?: string
  roomTypeDetails?: RoomTypeDetail[]
}

const STORAGE_KEY = 'gzf-history'
const MAX_HISTORY = 100

// 从 localStorage 加载
function loadFromStorage(): HistoryItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Validate data structure
      if (Array.isArray(parsed)) {
        return parsed.filter(item =>
          item.projectNo && item.projectName && item.viewedAt,
        )
      }
    }
  }
  catch (e) {
    console.error('Failed to load history from storage:', e)
  }
  return []
}

// 保存到 localStorage
function saveToStorage(list: HistoryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  }
  catch (e) {
    console.error('Failed to save history to storage:', e)
  }
}

export const useHistoryStore = defineStore('history', () => {
  const history = ref<HistoryItem[]>(loadFromStorage())

  const count = computed(() => history.value.length)

  // 获取指定房源的浏览时间
  const getViewedAt = (projectNo: string): number | null => {
    const item = history.value.find(item => item.projectNo === projectNo)
    return item ? item.viewedAt : null
  }

  // 获取指定房源的浏览记录
  const getHistoryItem = (projectNo: string): HistoryItem | undefined => {
    return history.value.find(item => item.projectNo === projectNo)
  }

  // 添加/更新浏览记录
  const addToHistory = (property: Property) => {
    // 先移除已存在的记录
    const index = history.value.findIndex(item => item.projectNo === property.projectNo)
    if (index > -1) {
      history.value.splice(index, 1)
    }

    // 添加到开头（最新的在前）
    const item: HistoryItem = {
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
      viewedAt: Date.now(),
      // 可选字段
      district: property.district,
      houseType: property.houseType,
      totalCount: property.totalCount,
      openingDate: property.openingDate,
      totalArea: property.totalArea,
      houseSource: property.houseSource,
      roomTypeDetails: property.roomTypeDetails,
    }

    history.value.unshift(item)

    // 超出上限时移除最旧的
    if (history.value.length > MAX_HISTORY) {
      history.value.pop()
    }

    saveToStorage(history.value)
  }

  // 删除单条记录
  const removeFromHistory = (projectNo: string): boolean => {
    const index = history.value.findIndex(item => item.projectNo === projectNo)
    if (index > -1) {
      history.value.splice(index, 1)
      saveToStorage(history.value)
      return true
    }
    return false
  }

  // 清空记录
  const clearHistory = () => {
    history.value = []
    saveToStorage(history.value)
  }

  return {
    history,
    count,
    getViewedAt,
    getHistoryItem,
    addToHistory,
    removeFromHistory,
    clearHistory,
  }
})
