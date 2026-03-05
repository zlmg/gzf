<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePropertyStore } from '@/stores/property'
import { useFilterStore } from '@/stores/filter'
import { ElSlider, ElInput, ElCheckbox, ElButton, ElSelect, ElOption } from 'element-plus'

const propertyStore = usePropertyStore()
const filterStore = useFilterStore()

const localFilters = ref({
  layout: [...filterStore.filters.layout],
  roomType: [...filterStore.filters.roomType],
  priceRange: [...filterStore.filters.priceRange] as [number, number],
  keyword: filterStore.filters.keyword,
  onlyAvailable: filterStore.filters.onlyAvailable
})

const isExpanded = ref(false)

const layouts = computed(() => propertyStore.getUniqueLayouts)
const roomTypes = computed(() => propertyStore.getUniqueRoomTypes)

const maxPrice = computed(() => {
  const prices = propertyStore.properties.map(p => p.maxRent || p.minRent || 0)
  return Math.max(...prices, 10000)
})

const applyFilters = () => {
  filterStore.updateFilters({
    layout: localFilters.value.layout,
    roomType: localFilters.value.roomType,
    priceRange: localFilters.value.priceRange,
    keyword: localFilters.value.keyword,
    onlyAvailable: localFilters.value.onlyAvailable
  })
}

const resetFilters = () => {
  localFilters.value = {
    layout: [],
    roomType: [],
    priceRange: [0, maxPrice.value],
    keyword: '',
    onlyAvailable: false
  }
  filterStore.resetFilters()
}

// Debounced keyword search
let keywordTimeout: ReturnType<typeof setTimeout>
watch(() => localFilters.value.keyword, (newVal) => {
  clearTimeout(keywordTimeout)
  keywordTimeout = setTimeout(() => {
    filterStore.updateFilters({ keyword: newVal })
  }, 300)
})
</script>

<template>
  <div class="bg-white rounded-xl shadow-md p-4 mb-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-800">筛选条件</h2>
      <div class="flex items-center gap-2">
        <ElButton size="small" @click="resetFilters">重置</ElButton>
        <ElButton type="primary" size="small" @click="applyFilters">应用筛选</ElButton>
        <button
          @click="isExpanded = !isExpanded"
          class="text-gray-500 hover:text-gray-700 transition-colors ml-2"
        >
          <svg
            class="w-5 h-5 transition-transform"
            :class="{ 'rotate-180': isExpanded }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Always visible filters -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Keyword search -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">关键词搜索</label>
        <ElInput
          v-model="localFilters.keyword"
          placeholder="项目名称或地址"
          clearable
        />
      </div>

      <!-- Price range -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          价格范围: ¥{{ localFilters.priceRange[0] }} - ¥{{ localFilters.priceRange[1] }}
        </label>
        <ElSlider
          v-model="localFilters.priceRange"
          range
          :max="maxPrice"
          :step="100"
          @change="() => filterStore.updateFilters({ priceRange: localFilters.priceRange })"
        />
      </div>

      <!-- Available only -->
      <div class="flex items-center">
        <ElCheckbox
          v-model="localFilters.onlyAvailable"
          @change="() => filterStore.updateFilters({ onlyAvailable: localFilters.onlyAvailable })"
        >
          仅显示可租房源
        </ElCheckbox>
      </div>
    </div>

    <!-- Expandable filters -->
    <div v-show="isExpanded" class="mt-4 pt-4 border-t border-gray-200">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Layout filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">区域</label>
          <ElSelect
            v-model="localFilters.layout"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="选择区域"
            class="w-full"
            @change="() => filterStore.updateFilters({ layout: localFilters.layout })"
          >
            <ElOption
              v-for="layout in layouts"
              :key="layout"
              :label="layout"
              :value="layout"
            />
          </ElSelect>
        </div>

        <!-- Room type filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">户型</label>
          <ElSelect
            v-model="localFilters.roomType"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="选择户型"
            class="w-full"
            @change="() => filterStore.updateFilters({ roomType: localFilters.roomType })"
          >
            <ElOption
              v-for="type in roomTypes"
              :key="type"
              :label="type + '房'"
              :value="type"
            />
          </ElSelect>
        </div>
      </div>
    </div>
  </div>
</template>