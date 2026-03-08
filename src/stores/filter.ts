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
  openStatus: '',
  // 新增筛选字段
  equipment: [],
  label: [],
  areaRange: [0, 200],
  towards: []
}

export const useFilterStore = defineStore('filter', () => {
  const stored = loadFromStorage()

  // 合并存储的筛选条件和默认值，确保新字段有默认值
  const filters = ref<FilterState>({ ...defaultFilters, ...stored })
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

  // 辅助函数：检查房源是否包含指定设备
  const hasEquipment = (property: Property, equipments: string[]): boolean => {
    if (!property.roomTypeDetails) return false
    return property.roomTypeDetails.some(detail => {
      if (!detail.houseTypeList) return false
      return detail.houseTypeList.some(house => {
        if (!house.roomEquipment) return false
        const houseEquipments = house.roomEquipment.split(',').map(e => e.trim())
        return equipments.some(eq => houseEquipments.includes(eq))
      })
    })
  }

  // 辅助函数：检查房源是否包含指定标签
  const hasLabel = (property: Property, labels: string[]): boolean => {
    if (!property.roomTypeDetails) return false
    return property.roomTypeDetails.some(detail => {
      if (!detail.houseTypeList) return false
      return detail.houseTypeList.some(house => {
        if (!house.roomLabel) return false
        const houseLabels = house.roomLabel.split(',').map(l => l.trim())
        return labels.some(label => houseLabels.includes(label))
      })
    })
  }

  // 辅助函数：检查房源是否有指定面积范围的房型
  const hasAreaInRange = (property: Property, areaRange: [number, number]): boolean => {
    if (!property.roomTypeDetails) return false
    return property.roomTypeDetails.some(detail => {
      if (!detail.houseTypeList) return false
      return detail.houseTypeList.some(house => {
        if (!house.area) return false
        const area = parseFloat(house.area)
        if (isNaN(area)) return false
        return area >= areaRange[0] && area <= areaRange[1]
      })
    })
  }

  // 辅助函数：检查房源是否有指定朝向
  const hasTowards = (property: Property, towardsList: string[]): boolean => {
    if (!property.roomTypeDetails) return false
    return property.roomTypeDetails.some(detail => {
      if (!detail.houseTypeList) return false
      return detail.houseTypeList.some(house => {
        if (!house.towards) return false
        return towardsList.includes(house.towards)
      })
    })
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
        p.location?.toLowerCase().includes(keyword) ||
        p.district?.toLowerCase().includes(keyword)
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

    // Filter by equipment (设备)
    if (filters.value.equipment?.length > 0) {
      result = result.filter(p => hasEquipment(p, filters.value.equipment))
    }

    // Filter by label (标签)
    if (filters.value.label?.length > 0) {
      result = result.filter(p => hasLabel(p, filters.value.label))
    }

    // Filter by area range (面积)
    const areaRange = filters.value.areaRange || [0, 200]
    if (areaRange[0] > 0 || areaRange[1] < 200) {
      result = result.filter(p => hasAreaInRange(p, areaRange))
    }

    // Filter by towards (朝向)
    if (filters.value.towards?.length > 0) {
      result = result.filter(p => hasTowards(p, filters.value.towards))
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