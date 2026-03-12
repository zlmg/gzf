import type { Property } from '@/types/property'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const usePropertyStore = defineStore('property', () => {
  const properties = ref<Property[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchProperties = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await fetch('/data/bsgz.json')
      if (!response.ok) {
        throw new Error('Failed to fetch property data')
      }
      const data = await response.json()
      // Handle different data structures
      if (Array.isArray(data)) {
        properties.value = data
      }
      else if (data.pageContent && Array.isArray(data.pageContent)) {
        properties.value = data.pageContent
      }
      else if (data.data && Array.isArray(data.data)) {
        properties.value = data.data
      }
      else if (data.list && Array.isArray(data.list)) {
        properties.value = data.list
      }
      else {
        properties.value = data
      }
    }
    catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      console.error('Failed to fetch properties:', e)
    }
    finally {
      loading.value = false
    }
  }

  const getUniqueLayouts = computed(() => {
    const layouts = new Set<string>()
    properties.value.forEach((p) => {
      if (p.layout)
        layouts.add(p.layout)
    })
    return layouts.toSorted()
  })

  const getUniqueRoomTypes = computed(() => {
    const types = new Set<string>()
    properties.value.forEach((p) => {
      if (p.roomType) {
        // 支持逗号分隔的多个户型
        p.roomType.split(',').forEach(t => types.add(t.trim()))
      }
    })
    return types.toSorted()
  })

  // 提取所有设备选项
  const getUniqueEquipments = computed(() => {
    const equipments = new Set<string>()
    properties.value.forEach((p) => {
      if (p.roomTypeDetails) {
        p.roomTypeDetails.forEach((detail) => {
          if (detail.houseTypeList) {
            detail.houseTypeList.forEach((house) => {
              if (house.roomEquipment) {
                house.roomEquipment.split(',').forEach(e => equipments.add(e.trim()))
              }
            })
          }
        })
      }
    })
    return [...equipments].filter(Boolean).sort()
  })

  // 提取所有标签选项
  const getUniqueLabels = computed(() => {
    const labels = new Set<string>()
    properties.value.forEach((p) => {
      if (p.roomTypeDetails) {
        p.roomTypeDetails.forEach((detail) => {
          if (detail.houseTypeList) {
            detail.houseTypeList.forEach((house) => {
              if (house.roomLabel) {
                house.roomLabel.split(',').forEach(l => labels.add(l.trim()))
              }
            })
          }
        })
      }
    })
    return [...labels].filter(Boolean).sort()
  })

  // 提取面积范围
  const getAreaRange = computed((): [number, number] => {
    let minArea = Infinity
    let maxArea = -Infinity
    properties.value.forEach((p) => {
      if (p.roomTypeDetails) {
        p.roomTypeDetails.forEach((detail) => {
          if (detail.houseTypeList) {
            detail.houseTypeList.forEach((house) => {
              if (house.area) {
                const area = Number.parseFloat(house.area)
                if (!Number.isNaN(area)) {
                  minArea = Math.min(minArea, area)
                  maxArea = Math.max(maxArea, area)
                }
              }
            })
          }
        })
      }
    })
    // 如果没有找到有效面积，返回默认值
    if (minArea === Infinity || maxArea === -Infinity) {
      return [0, 200]
    }
    return [Math.floor(minArea), Math.ceil(maxArea)]
  })

  // 提取朝向选项 - 拆分为单个方向
  const getUniqueTowards = computed(() => {
    const towards = new Set<string>()
    properties.value.forEach((p) => {
      if (p.roomTypeDetails) {
        p.roomTypeDetails.forEach((detail) => {
          if (detail.houseTypeList) {
            detail.houseTypeList.forEach((house) => {
              if (house.towards) {
                // 拆分朝向，如 "朝南" -> "南", "朝南,朝北" -> ["南", "北"]
                house.towards.split(',').forEach((t) => {
                  const direction = t.replace('朝', '').trim()
                  if (direction)
                    towards.add(direction)
                })
              }
            })
          }
        })
      }
    })
    return [...towards].filter(Boolean).sort()
  })

  // 提取行政区选项
  const getUniqueDistricts = computed(() => {
    const districts = new Set<string>()
    properties.value.forEach((p) => {
      if (p.district)
        districts.add(p.district)
    })
    return [...districts].filter(Boolean).sort()
  })

  const getPropertyByNo = (projectNo: string) => {
    return properties.value.find(p => p.projectNo === projectNo)
  }

  return {
    properties,
    loading,
    error,
    fetchProperties,
    getUniqueLayouts,
    getUniqueRoomTypes,
    getUniqueEquipments,
    getUniqueLabels,
    getAreaRange,
    getUniqueTowards,
    getUniqueDistricts,
    getPropertyByNo,
  }
})
