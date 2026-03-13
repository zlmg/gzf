import type { CompareItem, Property } from '@/types/property'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getImageUrl } from '@/config'
import { usePropertyStore } from './property'

// 简化存储类型（只存储 projectNo）
interface CompareRef {
  projectNo: string
}

// 带完整房源信息的对比项
interface CompareWithProperty {
  ref: CompareRef
  property: Property | null
}

const STORAGE_KEY = 'gzf-compare'
const MAX_COMPARE = 4

function loadFromStorage(): CompareRef[] {
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
            .filter(item => item.projectNo)
            .map(item => ({ projectNo: item.projectNo }))
        }
        // 新格式
        return parsed.filter(item => item.projectNo)
      }
    }
  }
  catch (e) {
    console.error('Failed to load compare list from storage:', e)
  }
  return []
}

function saveToStorage(list: CompareRef[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  }
  catch (e) {
    console.error('Failed to save compare list to storage:', e)
  }
}

function parseImages(thumbnail: string): string[] {
  if (!thumbnail)
    return []
  return thumbnail.split(',').map((path) => {
    if (path.startsWith('http'))
      return path
    return getImageUrl(path)
  })
}

export const useCompareStore = defineStore('compare', () => {
  const compareList = ref<CompareRef[]>(loadFromStorage())
  const propertyStore = usePropertyStore()

  // 带完整房源信息的对比列表
  const compareListWithProperties = computed<CompareWithProperty[]>(() => {
    return compareList.value.map((ref) => {
      const property = propertyStore.getPropertyByNo(ref.projectNo) ?? null
      return { ref, property }
    })
  })

  // 有效的对比列表（转换为 CompareItem 格式以保持兼容性）
  const validCompareList = computed<CompareItem[]>(() => {
    return compareListWithProperties.value
      .filter(item => item.property !== null)
      .map((item) => {
        const property = item.property!
        return {
          ...property,
          images: parseImages(property.thumbnail),
        }
      })
  })

  // 失效的对比项数量
  const invalidCount = computed(() => {
    return compareListWithProperties.value.filter(item => item.property === null).length
  })

  const isFull = computed(() => compareList.value.length >= MAX_COMPARE)
  const count = computed(() => compareList.value.length)
  const validCount = computed(() => validCompareList.value.length)

  const isInCompare = (projectNo: string) => {
    return compareList.value.some(item => item.projectNo === projectNo)
  }

  const addToCompare = (property: Property) => {
    if (isFull.value) {
      return false
    }
    if (isInCompare(property.projectNo)) {
      return true
    }
    const ref: CompareRef = { projectNo: property.projectNo }
    compareList.value.push(ref)
    saveToStorage(compareList.value)
    return true
  }

  const removeFromCompare = (projectNo: string) => {
    const index = compareList.value.findIndex(item => item.projectNo === projectNo)
    if (index > -1) {
      compareList.value.splice(index, 1)
      saveToStorage(compareList.value)
    }
  }

  const clearCompare = () => {
    compareList.value = []
    saveToStorage(compareList.value)
  }

  const toggleCompare = (property: Property) => {
    if (isInCompare(property.projectNo)) {
      removeFromCompare(property.projectNo)
      return false
    }
    else {
      return addToCompare(property)
    }
  }

  /**
   * 移除失效的对比项
   */
  const removeInvalidItems = () => {
    const before = compareList.value.length
    compareList.value = compareList.value.filter((ref) => {
      return propertyStore.getPropertyByNo(ref.projectNo) !== null
    })
    const removed = before - compareList.value.length
    if (removed > 0) {
      saveToStorage(compareList.value)
    }
    return removed
  }

  return {
    compareList,
    compareListWithProperties,
    validCompareList,
    invalidCount,
    isFull,
    count,
    validCount,
    isInCompare,
    addToCompare,
    removeFromCompare,
    clearCompare,
    toggleCompare,
    removeInvalidItems,
  }
})
