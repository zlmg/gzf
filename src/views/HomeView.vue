<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useProperty } from '@/composables/useProperty'
import { useFilterStore } from '@/stores/filter'
import { ElSelect, ElOption, ElEmpty, ElSkeleton } from 'element-plus'
import PropertyCard from '@/components/PropertyCard.vue'
import PropertyFilter from '@/components/PropertyFilter.vue'
import CompareBar from '@/components/CompareBar.vue'
import type { SortField, SortOrder } from '@/types/property'

const { filteredProperties, loading, error, fetchProperties } = useProperty()
const filterStore = useFilterStore()

const pageSize = 12
const displayedCount = ref(pageSize)
const isLoadingMore = ref(false)
const loadMoreTrigger = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const sortField = ref<SortField>('')
const sortOrder = ref<SortOrder>('asc')

const displayedProperties = computed(() => {
  return filteredProperties.value.slice(0, displayedCount.value)
})

const total = computed(() => filteredProperties.value.length)

const hasMore = computed(() => displayedCount.value < total.value)

const loadMore = () => {
  if (isLoadingMore.value || !hasMore.value) return
  isLoadingMore.value = true
  // 模拟加载延迟，提升用户体验
  setTimeout(() => {
    displayedCount.value += pageSize
    isLoadingMore.value = false
  }, 300)
}

const setupObserver = () => {
  if (observer) {
    observer.disconnect()
  }

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore.value && !isLoadingMore.value) {
        loadMore()
      }
    },
    { threshold: 0.1 }
  )

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value)
  }
}

const handleSortChange = () => {
  filterStore.setSort(sortField.value, sortOrder.value)
}

// Reset when filters change
watch(
  () => filteredProperties.value.length,
  () => {
    displayedCount.value = pageSize
  }
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
</script>

<template>
  <div class="min-h-screen bg-gray-50 overflow-x-hidden">
    <div class="container mx-auto px-4 py-6 max-w-full">
      <!-- Page header -->
      <div class="mb-6">
        <h1 class="text-xl md:text-2xl font-bold text-gray-800 mb-2">公租房房源列表</h1>
        <p class="text-gray-600 text-sm md:text-base">
          共找到 <span class="font-semibold text-blue-600">{{ total }}</span> 套房源
        </p>
      </div>

      <!-- Filters -->
      <PropertyFilter />

      <!-- Sort and view controls -->
      <div class="flex flex-wrap items-center gap-2 md:gap-3 mb-4">
        <span class="text-sm text-gray-700 font-medium shrink-0">排序:</span>
        <ElSelect
          v-model="sortField"
          placeholder="排序字段"
          clearable
          size="small"
          class="flex-1 min-w-0 max-w-[140px]"
          @change="handleSortChange"
        >
          <ElOption label="价格" value="price" />
          <ElOption label="可租数量" value="kezuCount" />
        </ElSelect>
        <ElSelect
          v-model="sortOrder"
          placeholder="方向"
          :disabled="!sortField"
          size="small"
          class="flex-1 min-w-0 max-w-[120px]"
          @change="handleSortChange"
        >
          <ElOption label="升序 ↑" value="asc" />
          <ElOption label="降序 ↓" value="desc" />
        </ElSelect>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div v-for="i in 8" :key="i" class="bg-white rounded-xl shadow-md overflow-hidden">
          <ElSkeleton :rows="5" animated />
        </div>
      </div>

      <!-- Error state -->
      <ElEmpty
        v-else-if="error"
        :description="error"
        class="py-20"
      />

      <!-- Empty state -->
      <ElEmpty
        v-else-if="total === 0"
        description="没有找到符合条件的房源"
        class="py-20"
      />

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
          <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
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