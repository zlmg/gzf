import type { HistoryRef } from '@/types/user'
import type { Property } from '@/types/property'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { usePropertyStore } from './property'

// 带完整房源信息的浏览记录项
export interface HistoryWithProperty {
  ref: HistoryRef
  property: Property | null // null 表示房源已失效
}

const STORAGE_KEY = 'gzf-history'
const MAX_HISTORY = 100

// 从 localStorage 加载
function loadFromStorage(): HistoryRef[] {
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
            .filter(item => item.projectNo && item.viewedAt)
            .map(item => ({
              projectNo: item.projectNo,
              viewedAt: item.viewedAt,
            }))
        }
        // 新格式
        return parsed.filter(item =>
          item.projectNo && typeof item.viewedAt === 'number',
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
function saveToStorage(list: HistoryRef[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  }
  catch (e) {
    console.error('Failed to save history to storage:', e)
  }
}

export const useHistoryStore = defineStore('history', () => {
  const history = ref<HistoryRef[]>(loadFromStorage())
  const propertyStore = usePropertyStore()

  // 带完整房源信息的浏览记录列表
  const historyWithProperties = computed<HistoryWithProperty[]>(() => {
    return history.value.map((ref) => {
      const property = propertyStore.getPropertyByNo(ref.projectNo) ?? null
      return { ref, property }
    })
  })

  // 有效的浏览记录列表（排除已失效的房源）
  const validHistory = computed<HistoryWithProperty[]>(() => {
    return historyWithProperties.value.filter(item => item.property !== null)
  })

  // 失效的记录数量
  const invalidCount = computed(() => {
    return historyWithProperties.value.filter(item => item.property === null).length
  })

  const count = computed(() => history.value.length)
  const validCount = computed(() => validHistory.value.length)

  // 获取指定房源的浏览时间
  const getViewedAt = (projectNo: string): number | null => {
    const item = history.value.find(item => item.projectNo === projectNo)
    return item ? item.viewedAt : null
  }

  // 获取指定房源的浏览记录
  const getHistoryItem = (projectNo: string): HistoryRef | undefined => {
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
    const ref: HistoryRef = {
      projectNo: property.projectNo,
      viewedAt: Date.now(),
    }

    history.value.unshift(ref)

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

  /**
   * 移除失效的浏览记录
   */
  const removeInvalidHistory = () => {
    const before = history.value.length
    history.value = history.value.filter((ref) => {
      return propertyStore.getPropertyByNo(ref.projectNo) !== null
    })
    const removed = before - history.value.length
    if (removed > 0) {
      saveToStorage(history.value)
    }
    return removed
  }

  /**
   * 获取用于云端同步的数据（简化格式）
   */
  const getSyncData = (): HistoryRef[] => {
    return [...history.value]
  }

  return {
    history,
    historyWithProperties,
    validHistory,
    invalidCount,
    count,
    validCount,
    getViewedAt,
    getHistoryItem,
    addToHistory,
    removeFromHistory,
    clearHistory,
    removeInvalidHistory,
    getSyncData,
  }
})
