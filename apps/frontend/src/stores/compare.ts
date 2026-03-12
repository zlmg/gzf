import type { CompareItem, Property } from '@/types/property'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getImageUrl } from '@/config'

const STORAGE_KEY = 'gzf-compare'
const MAX_COMPARE = 4

function loadFromStorage(): CompareItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  }
  catch (e) {
    console.error('Failed to load compare list from storage:', e)
  }
  return []
}

function saveToStorage(list: CompareItem[]) {
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
  const compareList = ref<CompareItem[]>(loadFromStorage())

  const isFull = computed(() => compareList.value.length >= MAX_COMPARE)

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
    const item: CompareItem = {
      ...property,
      images: parseImages(property.thumbnail),
    }
    compareList.value.push(item)
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

  return {
    compareList,
    isFull,
    isInCompare,
    addToCompare,
    removeFromCompare,
    clearCompare,
    toggleCompare,
  }
})
