import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Property } from '@/types/property'

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
      } else if (data.data && Array.isArray(data.data)) {
        properties.value = data.data
      } else if (data.list && Array.isArray(data.list)) {
        properties.value = data.list
      } else {
        properties.value = data
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      console.error('Failed to fetch properties:', e)
    } finally {
      loading.value = false
    }
  }

  const getUniqueLayouts = computed(() => {
    const layouts = new Set<string>()
    properties.value.forEach(p => {
      if (p.layout) layouts.add(p.layout)
    })
    return Array.from(layouts).sort()
  })

  const getUniqueRoomTypes = computed(() => {
    const types = new Set<string>()
    properties.value.forEach(p => {
      if (p.roomType) types.add(p.roomType)
    })
    return Array.from(types).sort()
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
    getPropertyByNo
  }
})