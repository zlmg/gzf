import { ref, watch } from 'vue'
import { storage } from '@/utils/storage'

export function useStorage<T>(key: string, defaultValue: T) {
  const storedValue = storage.get<T>(key, defaultValue)
  const data = ref<T>(storedValue ?? defaultValue) as { value: T }

  watch(
    () => data.value,
    (newValue) => {
      storage.set(key, newValue)
    },
    { deep: true },
  )

  const setData = (value: T) => {
    data.value = value
  }

  const resetData = () => {
    data.value = defaultValue
  }

  return {
    data,
    setData,
    resetData,
  }
}
