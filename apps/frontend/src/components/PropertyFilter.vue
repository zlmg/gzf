<script setup lang="ts">
import type { AvailableStatus, OpenStatus } from '@/types/property'
import { computed, ref, watch } from 'vue'
import { useFilterStore } from '@/stores/filter'
import { usePropertyStore } from '@/stores/property'

const openStatusOptions: { label: string, value: OpenStatus }[] = [
  { label: '全部', value: '' },
  { label: '开放', value: 'open' },
  { label: '未开放', value: 'closed' },
]

const availableStatusOptions: { label: string, value: AvailableStatus }[] = [
  { label: '全部', value: '' },
  { label: '有房', value: 'available' },
  { label: '无房', value: 'unavailable' },
]

// 固定的户型选项
const roomTypeOptions = ['一', '二', '三', '四', '五']

const propertyStore = usePropertyStore()
const filterStore = useFilterStore()

const localFilters = ref({
  layout: [...(filterStore.filters.layout || [])],
  roomType: [...(filterStore.filters.roomType || [])],
  priceRange: [...(filterStore.filters.priceRange || [0, 10000])] as [number, number],
  keyword: filterStore.filters.keyword || '',
  availableStatus: (filterStore.filters.availableStatus || '') as AvailableStatus,
  openStatus: (filterStore.filters.openStatus || '') as OpenStatus,
  // 新增筛选字段
  equipment: [...(filterStore.filters.equipment || [])],
  label: [...(filterStore.filters.label || [])],
  areaRange: [...(filterStore.filters.areaRange || [0, 200])] as [number, number],
  towards: [...(filterStore.filters.towards || [])],
  // 反向筛选标记
  excludeLayout: filterStore.filters.excludeLayout || false,
  excludeRoomType: filterStore.filters.excludeRoomType || false,
  excludeEquipment: filterStore.filters.excludeEquipment || false,
  excludeLabel: filterStore.filters.excludeLabel || false,
  excludeTowards: filterStore.filters.excludeTowards || false,
})

const isExpanded = ref(false)

const layouts = computed(() => propertyStore.getUniqueLayouts)
const equipments = computed(() => propertyStore.getUniqueEquipments)
const labels = computed(() => propertyStore.getUniqueLabels)
const towards = computed(() => propertyStore.getUniqueTowards)
const areaRange = computed(() => propertyStore.getAreaRange)

function toggleRoomType(type: string) {
  const index = localFilters.value.roomType.indexOf(type)
  if (index > -1) {
    localFilters.value.roomType.splice(index, 1)
  }
  else {
    localFilters.value.roomType.push(type)
  }
  filterStore.updateFilters({ roomType: [...localFilters.value.roomType] })
}

function toggleTowards(t: string) {
  const index = localFilters.value.towards.indexOf(t)
  if (index > -1) {
    localFilters.value.towards.splice(index, 1)
  }
  else {
    localFilters.value.towards.push(t)
  }
  filterStore.updateFilters({ towards: [...localFilters.value.towards] })
}

const maxPrice = computed(() => {
  const prices = propertyStore.properties.map(p => p.maxRent || p.minRent || 0)
  return Math.max(...prices, 10000)
})

function applyFilters() {
  filterStore.updateFilters({
    layout: localFilters.value.layout,
    roomType: localFilters.value.roomType,
    priceRange: localFilters.value.priceRange,
    keyword: localFilters.value.keyword,
    availableStatus: localFilters.value.availableStatus,
    openStatus: localFilters.value.openStatus,
    equipment: localFilters.value.equipment,
    label: localFilters.value.label,
    areaRange: localFilters.value.areaRange,
    towards: localFilters.value.towards,
    // 反向筛选标记
    excludeLayout: localFilters.value.excludeLayout,
    excludeRoomType: localFilters.value.excludeRoomType,
    excludeEquipment: localFilters.value.excludeEquipment,
    excludeLabel: localFilters.value.excludeLabel,
    excludeTowards: localFilters.value.excludeTowards,
  })
}

function resetFilters() {
  localFilters.value = {
    layout: [],
    roomType: [],
    priceRange: [0, maxPrice.value],
    keyword: '',
    availableStatus: '',
    openStatus: '',
    equipment: [],
    label: [],
    areaRange: [areaRange.value[0], areaRange.value[1]],
    towards: [],
    // 反向筛选标记
    excludeLayout: false,
    excludeRoomType: false,
    excludeEquipment: false,
    excludeLabel: false,
    excludeTowards: false,
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
  <div class="bg-white rounded-xl shadow-md p-3 md:p-4 mb-6 overflow-x-hidden">
    <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
      <h2 class="text-base md:text-lg font-semibold text-gray-700">
        筛选条件
      </h2>
      <div class="flex items-center gap-2">
        <UButton size="sm" variant="outline" @click="resetFilters">
          重置
        </UButton>
        <UButton color="primary" size="sm" @click="applyFilters">
          应用
        </UButton>
        <button
          class="text-gray-500 hover:text-gray-700 transition-colors p-1"
          @click="isExpanded = !isExpanded"
        >
          <UIcon
            name="i-lucide-chevron-down"
            class="size-5 transition-transform"
            :class="{ 'rotate-180': isExpanded }"
          />
        </button>
      </div>
    </div>

    <!-- First row: 关键词、区域、户型 -->
    <div class="space-y-3 md:space-y-0 md:grid md:grid-cols-3 md:gap-6">
      <!-- Keyword search -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">关键词</label>
        <UInput
          v-model="localFilters.keyword"
          placeholder="项目名称或地址"
        />
      </div>

      <!-- Area filter -->
      <div>
        <label class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
          区域
          <input
            v-model="localFilters.excludeLayout"
            type="checkbox"
            class="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
            title="勾选表示排除所选区域"
          >
          <span v-if="localFilters.excludeLayout" class="text-xs text-red-500">(排除)</span>
        </label>
        <USelect
          v-model="localFilters.layout"
          multiple
          placeholder="选择区域"
          :items="layouts.map(l => ({ label: l, value: l }))"
          @update:model-value="() => filterStore.updateFilters({ layout: localFilters.layout })"
        />
      </div>

      <!-- Room type filter -->
      <div>
        <label class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
          户型
          <input
            v-model="localFilters.excludeRoomType"
            type="checkbox"
            class="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
            title="勾选表示排除所选户型"
          >
          <span v-if="localFilters.excludeRoomType" class="text-xs text-red-500">(排除)</span>
        </label>
        <div class="flex items-center gap-1">
          <span
            class="text-sm cursor-pointer px-2 py-0.5 rounded transition-colors"
            :class="localFilters.roomType.length === 0 ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'"
            @click="() => { localFilters.roomType = []; filterStore.updateFilters({ roomType: [] }) }"
          >
            全部
          </span>
          <span
            v-for="type in roomTypeOptions"
            :key="type"
            class="text-sm cursor-pointer px-3 py-0.5 rounded transition-colors"
            :class="localFilters.roomType.includes(type) ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'"
            @click="toggleRoomType(type)"
          >
            {{ type }}
          </span>
        </div>
      </div>
    </div>

    <!-- Second row: 可租状态、开放状态、朝向 -->
    <div class="space-y-3 md:space-y-0 md:grid md:grid-cols-3 md:gap-6 mt-4">
      <!-- Available status filter -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">可租状态</label>
        <div class="flex items-center gap-1">
          <span
            v-for="option in availableStatusOptions"
            :key="option.value"
            class="text-sm cursor-pointer px-2 py-0.5 rounded transition-colors"
            :class="localFilters.availableStatus === option.value ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'"
            @click="() => { localFilters.availableStatus = option.value; filterStore.updateFilters({ availableStatus: option.value }) }"
          >
            {{ option.label }}
          </span>
        </div>
      </div>

      <!-- Open status filter -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">开放状态</label>
        <div class="flex items-center gap-1">
          <span
            v-for="option in openStatusOptions"
            :key="option.value"
            class="text-sm cursor-pointer px-2 py-0.5 rounded transition-colors"
            :class="localFilters.openStatus === option.value ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'"
            @click="() => { localFilters.openStatus = option.value; filterStore.updateFilters({ openStatus: option.value }) }"
          >
            {{ option.label }}
          </span>
        </div>
      </div>

      <!-- 朝向筛选 -->
      <div>
        <label class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
          朝向
          <input
            v-model="localFilters.excludeTowards"
            type="checkbox"
            class="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
            title="勾选表示排除所选朝向"
          >
          <span v-if="localFilters.excludeTowards" class="text-xs text-red-500">(排除)</span>
        </label>
        <div class="flex items-center gap-1 flex-wrap">
          <span
            class="text-sm cursor-pointer px-2 py-0.5 rounded transition-colors"
            :class="localFilters.towards.length === 0 ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'"
            @click="() => { localFilters.towards = []; filterStore.updateFilters({ towards: [] }) }"
          >
            全部
          </span>
          <span
            v-for="t in towards"
            :key="t"
            class="text-sm cursor-pointer px-2 py-0.5 rounded transition-colors"
            :class="localFilters.towards.includes(t) ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'"
            @click="toggleTowards(t)"
          >
            {{ t }}
          </span>
        </div>
      </div>
    </div>

    <!-- Expandable section: 新增筛选条件 -->
    <div v-show="isExpanded" class="mt-4 pt-4 border-t border-gray-200">
      <div class="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-6">
        <!-- 设备筛选 -->
        <div>
          <label class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
            设备
            <input
              v-model="localFilters.excludeEquipment"
              type="checkbox"
              class="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
              title="勾选表示排除所选设备"
            >
            <span v-if="localFilters.excludeEquipment" class="text-xs text-red-500">(排除)</span>
          </label>
          <USelect
            v-model="localFilters.equipment"
            multiple
            placeholder="选择设备"
            :items="equipments.map(e => ({ label: e, value: e }))"
            @update:model-value="() => filterStore.updateFilters({ equipment: localFilters.equipment })"
          />
        </div>

        <!-- 标签筛选 -->
        <div>
          <label class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
            标签
            <input
              v-model="localFilters.excludeLabel"
              type="checkbox"
              class="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
              title="勾选表示排除所选标签"
            >
            <span v-if="localFilters.excludeLabel" class="text-xs text-red-500">(排除)</span>
          </label>
          <USelect
            v-model="localFilters.label"
            multiple
            placeholder="选择标签"
            :items="labels.map(l => ({ label: l, value: l }))"
            @update:model-value="() => filterStore.updateFilters({ label: localFilters.label })"
          />
        </div>

        <!-- 面积筛选 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            面积: {{ localFilters.areaRange[0] }}m² - {{ localFilters.areaRange[1] }}m²
          </label>
          <div class="flex items-center gap-3">
            <input
              v-model.number="localFilters.areaRange[0]"
              type="range"
              :min="areaRange[0]"
              :max="areaRange[1]"
              :step="5"
              class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            >
            <input
              v-model.number="localFilters.areaRange[1]"
              type="range"
              :min="areaRange[0]"
              :max="areaRange[1]"
              :step="5"
              class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              @update:model-value="() => filterStore.updateFilters({ areaRange: localFilters.areaRange })"
            >
          </div>
        </div>

        <!-- 价格范围 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            价格: ¥{{ localFilters.priceRange[0] }} - ¥{{ localFilters.priceRange[1] }}
          </label>
          <div class="flex items-center gap-3">
            <input
              v-model.number="localFilters.priceRange[0]"
              type="range"
              :min="0"
              :max="maxPrice"
              :step="100"
              class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            >
            <input
              v-model.number="localFilters.priceRange[1]"
              type="range"
              :min="0"
              :max="maxPrice"
              :step="100"
              class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              @update:model-value="() => filterStore.updateFilters({ priceRange: localFilters.priceRange })"
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
