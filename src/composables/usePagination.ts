import { ref, computed } from 'vue'

export const usePagination = <T>(
  items: Ref<T[]>,
  pageSize: number = 12
) => {
  const currentPage = ref(1)

  const totalPages = computed(() => Math.ceil(items.value.length / pageSize))

  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * pageSize
    const end = start + pageSize
    return items.value.slice(start, end)
  })

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  const nextPage = () => {
    if (currentPage.value < totalPages.value) {
      currentPage.value++
    }
  }

  const prevPage = () => {
    if (currentPage.value > 1) {
      currentPage.value--
    }
  }

  const resetPage = () => {
    currentPage.value = 1
  }

  return {
    currentPage,
    totalPages,
    pageSize,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    resetPage
  }
}

import type { Ref } from 'vue'