import type { FilterState, Property, SortField, SortOrder } from '@/types/property'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useFavoriteStore } from './favorite'

const STORAGE_KEY = 'gzf-filters'
const SORT_STORAGE_KEY = 'gzf-sort'

function loadFromStorage(): FilterState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  }
  catch (e) {
    console.error('Failed to load filters from storage:', e)
  }
  return null
}

function loadSortFromStorage(): { field: SortField, order: SortOrder } {
  try {
    const stored = localStorage.getItem(SORT_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  }
  catch (e) {
    console.error('Failed to load sort from storage:', e)
  }
  return { field: '', order: 'asc' }
}

const defaultFilters: FilterState = {
  layout: [],
  roomType: [],
  priceRange: [0, 10000],
  keyword: '',
  availableStatus: '',
  openStatus: '',
  favoriteStatus: '',
  // 新增筛选字段
  equipment: [],
  label: [],
  areaRange: [0, 200],
  towards: [],
  // 反向筛选标记
  excludeLayout: false,
  excludeRoomType: false,
  excludeEquipment: false,
  excludeLabel: false,
  excludeTowards: false,
}

export const useFilterStore = defineStore('filter', () => {
  const stored = loadFromStorage()
  const storedSort = loadSortFromStorage()

  // 合并存储的筛选条件和默认值，确保新字段有默认值
  const filters = ref<FilterState>({ ...defaultFilters, ...stored })
  const sortField = ref<SortField>(storedSort.field)
  const sortOrder = ref<SortOrder>(storedSort.order)

  const saveToStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters.value))
    }
    catch (e) {
      console.error('Failed to save filters to storage:', e)
    }
  }

  const saveSortToStorage = () => {
    try {
      localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify({
        field: sortField.value,
        order: sortOrder.value,
      }))
    }
    catch (e) {
      console.error('Failed to save sort to storage:', e)
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
    saveSortToStorage()
  }

  const setSort = (field: SortField, order: SortOrder) => {
    sortField.value = field
    sortOrder.value = order
    saveSortToStorage()
  }

  // 辅助函数：检查房源是否包含指定设备
  const hasEquipment = (property: Property, equipments: string[]): boolean => {
    if (!property.roomTypeDetails)
      return false
    return property.roomTypeDetails.some((detail) => {
      if (!detail.houseTypeList)
        return false
      return detail.houseTypeList.some((house) => {
        if (!house.roomEquipment)
          return false
        const houseEquipments = house.roomEquipment.split(',').map(e => e.trim())
        return equipments.some(eq => houseEquipments.includes(eq))
      })
    })
  }

  // 辅助函数：检查房源是否包含指定标签
  const hasLabel = (property: Property, labels: string[]): boolean => {
    if (!property.roomTypeDetails)
      return false
    return property.roomTypeDetails.some((detail) => {
      if (!detail.houseTypeList)
        return false
      return detail.houseTypeList.some((house) => {
        if (!house.roomLabel)
          return false
        const houseLabels = house.roomLabel.split(',').map(l => l.trim())
        return labels.some(label => houseLabels.includes(label))
      })
    })
  }

  // 辅助函数：检查房源是否有指定面积范围的房型
  const hasAreaInRange = (property: Property, areaRange: [number, number]): boolean => {
    if (!property.roomTypeDetails)
      return false
    return property.roomTypeDetails.some((detail) => {
      if (!detail.houseTypeList)
        return false
      return detail.houseTypeList.some((house) => {
        if (!house.area)
          return false
        const area = Number.parseFloat(house.area)
        if (Number.isNaN(area))
          return false
        return area >= areaRange[0] && area <= areaRange[1]
      })
    })
  }

  // 辅助函数：检查房源是否有指定朝向
  const hasTowards = (property: Property, towardsList: string[]): boolean => {
    if (!property.roomTypeDetails)
      return false
    return property.roomTypeDetails.some((detail) => {
      if (!detail.houseTypeList)
        return false
      return detail.houseTypeList.some((house) => {
        if (!house.towards)
          return false
        // 拆分房源朝向为单个方向，如 "朝南" -> "南", "朝南,朝北" -> ["南", "北"]
        const directions = house.towards.split(',').map(t => t.replace('朝', '').trim())
        return towardsList.some(t => directions.includes(t))
      })
    })
  }

  const filterProperties = (properties: Property[]) => {
    let result = [...properties]

    // Filter by layout (区域)
    if (filters.value.layout.length > 0) {
      if (filters.value.excludeLayout) {
        // 反向筛选：排除包含该区域的房源
        result = result.filter(p => !filters.value.layout.includes(p.layout))
      }
      else {
        result = result.filter(p => filters.value.layout.includes(p.layout))
      }
    }

    // Filter by room type (户型) - 支持逗号分隔的多个户型
    if (filters.value.roomType.length > 0) {
      if (filters.value.excludeRoomType) {
        // 反向筛选：排除包含该户型的房源
        result = result.filter((p) => {
          const types = p.roomType.split(',')
          return !filters.value.roomType.some(t => types.includes(t))
        })
      }
      else {
        result = result.filter((p) => {
          const types = p.roomType.split(',')
          return filters.value.roomType.some(t => types.includes(t))
        })
      }
    }

    // Filter by price range
    result = result.filter((p) => {
      const minPrice = p.minRent || 0
      const maxPrice = p.maxRent || p.minRent || 0
      return minPrice >= filters.value.priceRange[0]
        && maxPrice <= filters.value.priceRange[1]
    })

    // Filter by keyword
    if (filters.value.keyword.trim()) {
      const keyword = filters.value.keyword.toLowerCase()
      result = result.filter(p =>
        p.projectName?.toLowerCase().includes(keyword)
        || p.location?.toLowerCase().includes(keyword)
        || p.district?.toLowerCase().includes(keyword),
      )
    }

    // Filter by availability
    if (filters.value.availableStatus === 'available') {
      result = result.filter(p => p.kezuCount > 0)
    }
    else if (filters.value.availableStatus === 'unavailable') {
      result = result.filter(p => p.kezuCount === 0)
    }

    // Filter by open status
    if (filters.value.openStatus === 'open') {
      result = result.filter(p => p.openQueue === '1')
    }
    else if (filters.value.openStatus === 'closed') {
      result = result.filter(p => p.openQueue === '0')
    }

    // Filter by favorite status (收藏状态)
    if (filters.value.favoriteStatus) {
      const favoriteStore = useFavoriteStore()
      if (filters.value.favoriteStatus === 'favorited') {
        result = result.filter(p => favoriteStore.isFavorite(p.projectNo))
      }
      else if (filters.value.favoriteStatus === 'unfavorited') {
        result = result.filter(p => !favoriteStore.isFavorite(p.projectNo))
      }
    }

    // Filter by equipment (设备)
    if (filters.value.equipment?.length > 0) {
      if (filters.value.excludeEquipment) {
        // 反向筛选：排除包含该设备的房源
        result = result.filter(p => !hasEquipment(p, filters.value.equipment))
      }
      else {
        result = result.filter(p => hasEquipment(p, filters.value.equipment))
      }
    }

    // Filter by label (标签)
    if (filters.value.label?.length > 0) {
      if (filters.value.excludeLabel) {
        // 反向筛选：排除包含该标签的房源
        result = result.filter(p => !hasLabel(p, filters.value.label))
      }
      else {
        result = result.filter(p => hasLabel(p, filters.value.label))
      }
    }

    // Filter by area range (面积)
    const areaRange = filters.value.areaRange || [0, 200]
    if (areaRange[0] > 0 || areaRange[1] < 200) {
      result = result.filter(p => hasAreaInRange(p, areaRange))
    }

    // Filter by towards (朝向)
    if (filters.value.towards?.length > 0) {
      if (filters.value.excludeTowards) {
        // 反向筛选：排除包含该朝向的房源
        result = result.filter(p => !hasTowards(p, filters.value.towards))
      }
      else {
        result = result.filter(p => hasTowards(p, filters.value.towards))
      }
    }

    // Sort
    if (sortField.value) {
      result.sort((a, b) => {
        let valueA: number
        let valueB: number

        if (sortField.value === 'minPrice') {
          valueA = a.minRent || 0
          valueB = b.minRent || 0
        }
        else if (sortField.value === 'maxPrice') {
          valueA = a.maxRent || a.minRent || 0
          valueB = b.maxRent || b.minRent || 0
        }
        else if (sortField.value === 'kezuCount') {
          valueA = a.kezuCount || 0
          valueB = b.kezuCount || 0
        }
        else if (sortField.value === 'openingDate') {
          // 解析日期字符串为时间戳
          const parseDate = (dateStr: string): number => {
            if (!dateStr)
              return 0
            // 支持 "2024-01-15" 和 "2024年1月15日" 格式
            const normalized = dateStr.replace(/[年月]/g, '-').replace(/日/g, '')
            const date = new Date(normalized)
            return Number.isNaN(date.getTime()) ? 0 : date.getTime()
          }
          valueA = parseDate(a.openingDate || '')
          valueB = parseDate(b.openingDate || '')
        }
        else if (sortField.value === 'minArea') {
          // 获取房源最小户型面积
          const getMinArea = (property: Property): number => {
            if (!property.roomTypeDetails)
              return 0
            let minArea = Infinity
            for (const detail of property.roomTypeDetails) {
              if (!detail.houseTypeList)
                continue
              for (const house of detail.houseTypeList) {
                if (!house.area)
                  continue
                const area = Number.parseFloat(house.area)
                if (!Number.isNaN(area) && area < minArea) {
                  minArea = area
                }
              }
            }
            return minArea === Infinity ? 0 : minArea
          }
          valueA = getMinArea(a)
          valueB = getMinArea(b)
        }
        else if (sortField.value === 'maxArea') {
          // 获取房源最大户型面积
          const getMaxArea = (property: Property): number => {
            if (!property.roomTypeDetails)
              return 0
            let maxArea = 0
            for (const detail of property.roomTypeDetails) {
              if (!detail.houseTypeList)
                continue
              for (const house of detail.houseTypeList) {
                if (!house.area)
                  continue
                const area = Number.parseFloat(house.area)
                if (!Number.isNaN(area) && area > maxArea) {
                  maxArea = area
                }
              }
            }
            return maxArea
          }
          valueA = getMaxArea(a)
          valueB = getMaxArea(b)
        }
        else {
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
    filterProperties,
  }
})
