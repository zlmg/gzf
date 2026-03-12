import { computed } from 'vue'
import { useFilterStore } from '@/stores/filter'
import { usePropertyStore } from '@/stores/property'

export function useProperty() {
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
    uniqueRoomTypes: computed(() => propertyStore.getUniqueRoomTypes),
  }
}
