import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Property, FilterState, SortField, SortOrder } from '@/types/property'

const STORAGE_KEY = 'gzf-filters'

const loadFromStorage = (): FilterState | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load filters from storage:', e)
  }
  return null
}

const defaultFilters: FilterState = {
  layout: [],
  roomType: [],
  priceRange: [0, 10000],
  keyword: '',
  availableStatus: '',
  openStatus: ''
}

export const useFilterStore = defineStore('filter', () => {
  const stored = loadFromStorage()

  const filters = ref<FilterState>(stored || { ...defaultFilters })
  const sortField = ref<SortField>('')
  const sortOrder = ref<SortOrder>('asc')

  const saveToStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters.value))
    } catch (e) {
      console.error('Failed to save filters to storage:', e)
    }
  }

  const updateFilters = (newFilters: Partial<FilterState>) => {
    filters.value = { ...filters.value, ...newFilters }
    saveToStorage()
  }

  const resetFilters = () => {
    filters.value = { ...defaultFilters }
    sortField.value = ''
    sortOrder.value = 'asc'
    saveToStorage()
  }

  const setSort = (field: SortField, order: SortOrder) => {
    sortField.value = field
    sortOrder.value = order
  }

  const filterProperties = (properties: Property[]) => {
    let result = [...properties]

    // Filter by layout (区域)
    if (filters.value.layout.length > 0) {
      result = result.filter(p => filters.value.layout.includes(p.layout))
    }

    // Filter by room type (户型) - 支持逗号分隔的多个户型
    if (filters.value.roomType.length > 0) {
      result = result.filter(p => {
        const types = p.roomType.split(',')
        return filters.value.roomType.some(t => types.includes(t))
      })
    }

    // Filter by price range
    result = result.filter(p => {
      const minPrice = p.minRent || 0
      const maxPrice = p.maxRent || p.minRent || 0
      return minPrice >= filters.value.priceRange[0] &&
             maxPrice <= filters.value.priceRange[1]
    })

    // Filter by keyword
    if (filters.value.keyword.trim()) {
      const keyword = filters.value.keyword.toLowerCase()
      result = result.filter(p =>
        p.projectName?.toLowerCase().includes(keyword) ||
        p.location?.toLowerCase().includes(keyword)
      )
    }

    // Filter by availability
    if (filters.value.availableStatus === 'available') {
      result = result.filter(p => p.kezuCount > 0)
    } else if (filters.value.availableStatus === 'unavailable') {
      result = result.filter(p => p.kezuCount === 0)
    }

    // Filter by open status
    if (filters.value.openStatus === 'open') {
      result = result.filter(p => p.openQueue === '1')
    } else if (filters.value.openStatus === 'closed') {
      result = result.filter(p => p.openQueue === '0')
    }

    // Sort
    if (sortField.value) {
      result.sort((a, b) => {
        let valueA: number
        let valueB: number

        if (sortField.value === 'price') {
          valueA = a.minRent || 0
          valueB = b.minRent || 0
        } else if (sortField.value === 'kezuCount') {
          valueA = a.kezuCount || 0
          valueB = b.kezuCount || 0
        } else {
          return 0
        }

        return sortOrder.value === 'asc' ? valueA - valueB : valueB - valueA
      })
    }

    return result
  }

  return {
    filters,
    sortField,
    sortOrder,
    updateFilters,
    resetFilters,
    setSort,
    filterProperties
  }
})