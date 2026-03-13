<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import CompareBar from '@/components/CompareBar.vue'
import PropertyCard from '@/components/PropertyCard.vue'
import PropertyFilter from '@/components/PropertyFilter.vue'
import { useProperty } from '@/composables/useProperty'
import { useFilterStore } from '@/stores/filter'

const { filteredProperties, loading, error, fetchProperties } = useProperty()
const filterStore = useFilterStore()

const pageSize = 12
const displayedCount = ref(pageSize)
const isLoadingMore = ref(false)
const loadMoreTrigger = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

// 使用 store 中的排序状态
const sortField = computed({
  get: () => filterStore.sortField,
  set: value => filterStore.setSort(value, filterStore.sortOrder),
})
const sortOrder = computed({
  get: () => filterStore.sortOrder,
  set: value => filterStore.setSort(filterStore.sortField, value),
})

const displayedProperties = computed(() => {
  return filteredProperties.value.slice(0, displayedCount.value)
})

const total = computed(() => filteredProperties.value.length)

const hasMore = computed(() => displayedCount.value < total.value)

function loadMore() {
  if (isLoadingMore.value || !hasMore.value)
    return
  isLoadingMore.value = true
  // 模拟加载延迟，提升用户体验
  setTimeout(() => {
    displayedCount.value += pageSize
    isLoadingMore.value = false
  }, 300)
}

function setupObserver() {
  if (observer) {
    observer.disconnect()
  }

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0] && entries[0].isIntersecting && hasMore.value && !isLoadingMore.value) {
        loadMore()
      }
    },
    { threshold: 0.1 },
  )

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value)
  }
}

// Reset when filters change
watch(
  () => filteredProperties.value.length,
  () => {
    displayedCount.value = pageSize
  },
)

onMounted(() => {
  fetchProperties()
  setupObserver()
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})

// Re-observe when trigger element changes
watch(loadMoreTrigger, (el) => {
  if (el && observer) {
    observer.observe(el)
  }
})

const sortFieldOptions = [
  { label: '最低价格', value: 'minPrice' },
  { label: '最高价格', value: 'maxPrice' },
  { label: '可租数量', value: 'kezuCount' },
  { label: '供应日期', value: 'openingDate' },
  { label: '最小面积', value: 'minArea' },
  { label: '最大面积', value: 'maxArea' },
]

const sortOrderOptions = [
  { label: '升序 ↑', value: 'asc' },
  { label: '降序 ↓', value: 'desc' },
]
</script>

<template>
  <div class="min-h-screen bg-gray-50 overflow-x-hidden">
    <div class="container-app py-6">
      <!-- Page header -->
      <div class="mb-6">
        <h1 class="text-xl md:text-2xl font-bold text-gray-800 mb-2">
          公租房房源列表
        </h1>
        <p class="text-gray-600 text-sm md:text-base">
          共找到 <span class="font-semibold text-blue-600">{{ total }}</span> 套房源
        </p>
      </div>

      <!-- Filters -->
      <PropertyFilter />

      <!-- Sort and view controls -->
      <div class="flex flex-wrap items-center gap-2 md:gap-3 mb-4">
        <span class="text-sm text-gray-700 font-medium shrink-0">排序:</span>
        <USelect
          v-model="sortField"
          placeholder="排序字段"
          :items="sortFieldOptions"
          class="flex-1 min-w-0 max-w-[120px]"
        />
        <USelect
          v-model="sortOrder"
          placeholder="方向"
          :disabled="!sortField"
          :items="sortOrderOptions"
          class="flex-1 min-w-0 max-w-[120px]"
        />
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div v-for="i in 8" :key="i" class="bg-white rounded-xl shadow-md overflow-hidden p-4">
          <div class="animate-pulse space-y-4">
            <div class="h-40 bg-gray-200 rounded" />
            <div class="h-4 bg-gray-200 rounded w-3/4" />
            <div class="h-4 bg-gray-200 rounded w-1/2" />
            <div class="h-4 bg-gray-200 rounded w-full" />
            <div class="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      </div>

      <!-- Error state -->
      <div
        v-else-if="error"
        class="flex flex-col items-center justify-center py-20"
      >
        <UIcon name="i-lucide-alert-circle" class="size-16 text-gray-300 mb-4" />
        <p class="text-gray-500">
          {{ error }}
        </p>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="total === 0"
        class="flex flex-col items-center justify-center py-20"
      >
        <UIcon name="i-lucide-search-x" class="size-16 text-gray-300 mb-4" />
        <p class="text-gray-500">
          没有找到符合条件的房源
        </p>
      </div>

      <!-- Property grid -->
      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <TransitionGroup name="list">
          <PropertyCard
            v-for="property in displayedProperties"
            :key="property.projectNo"
            :property="property"
          />
        </TransitionGroup>
      </div>

      <!-- Load more trigger -->
      <div
        v-if="hasMore && !loading"
        ref="loadMoreTrigger"
        class="flex justify-center items-center py-8"
      >
        <div v-if="isLoadingMore" class="flex items-center gap-2 text-gray-500">
          <UIcon name="i-lucide-loader-2" class="size-5 animate-spin" />
          <span>加载中...</span>
        </div>
        <div v-else class="text-gray-400 text-sm">
          下拉加载更多
        </div>
      </div>

      <!-- End of list -->
      <div v-if="!hasMore && total > 0 && !loading" class="text-center py-8 text-gray-400 text-sm">
        已加载全部房源
      </div>
    </div>

    <!-- Compare bar -->
    <CompareBar />
  </div>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.list-move {
  transition: transform 0.3s ease;
}
</style>
