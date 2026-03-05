import { computed } from 'vue'
import { usePropertyStore } from '@/stores/property'
import { useFilterStore } from '@/stores/filter'

export const useProperty = () => {
  const propertyStore = usePropertyStore()
  const filterStore = useFilterStore()

  const loading = computed(() => propertyStore.loading)
  const error = computed(() => propertyStore.error)

  const filteredProperties = computed(() => {
    return filterStore.filterProperties(propertyStore.properties)
  })

  const fetchProperties = () => {
    return propertyStore.fetchProperties()
  }

  const getPropertyByNo = (projectNo: string) => {
    return propertyStore.getPropertyByNo(projectNo)
  }

  return {
    properties: computed(() => propertyStore.properties),
    filteredProperties,
    loading,
    error,
    fetchProperties,
    getPropertyByNo,
    uniqueLayouts: computed(() => propertyStore.getUniqueLayouts),
    uniqueRoomTypes: computed(() => propertyStore.getUniqueRoomTypes)
  }
}