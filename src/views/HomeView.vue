<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useProperty } from '@/composables/useProperty'
import { useFilterStore } from '@/stores/filter'
import { ElPagination, ElSelect, ElOption, ElEmpty, ElSkeleton } from 'element-plus'
import PropertyCard from '@/components/PropertyCard.vue'
import PropertyFilter from '@/components/PropertyFilter.vue'
import CompareBar from '@/components/CompareBar.vue'
import type { SortField, SortOrder } from '@/types/property'

const { filteredProperties, loading, error, fetchProperties } = useProperty()
const filterStore = useFilterStore()

const currentPage = ref(1)
const pageSize = ref(12)

const sortField = ref<SortField>('')
const sortOrder = ref<SortOrder>('asc')

const paginatedProperties = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredProperties.value.slice(start, end)
})

const total = computed(() => filteredProperties.value.length)

const handlePageChange = (page: number) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleSortChange = () => {
  filterStore.setSort(sortField.value, sortOrder.value)
}

// Reset to first page when filters change
watch(
  () => filteredProperties.value.length,
  () => {
    currentPage.value = 1
  }
)

onMounted(() => {
  fetchProperties()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-6">
      <!-- Page header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-800 mb-2">公租房房源列表</h1>
        <p class="text-gray-600">
          共找到 <span class="font-semibold text-blue-600">{{ total }}</span> 套房源
        </p>
      </div>

      <!-- Filters -->
      <PropertyFilter />

      <!-- Sort and view controls -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-600">排序:</span>
          <ElSelect
            v-model="sortField"
            placeholder="选择排序字段"
            clearable
            size="default"
            class="w-36"
            @change="handleSortChange"
          >
            <ElOption label="价格" value="price" />
            <ElOption label="可租数量" value="kezuCount" />
          </ElSelect>
          <ElSelect
            v-model="sortOrder"
            placeholder="排序方向"
            :disabled="!sortField"
            size="default"
            class="w-28"
            @change="handleSortChange"
          >
            <ElOption label="升序" value="asc" />
            <ElOption label="降序" value="desc" />
          </ElSelect>
        </div>
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
            v-for="property in paginatedProperties"
            :key="property.projectNo"
            :property="property"
          />
        </TransitionGroup>
      </div>

      <!-- Pagination -->
      <div v-if="total > pageSize" class="flex justify-center mt-8">
        <ElPagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[12, 24, 36, 48]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
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