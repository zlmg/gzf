<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { Property } from '@/types/property'
import { formatPriceRange, formatRoomType, formatOpenQueue, truncateText } from '@/utils/format'
import { useCompareStore } from '@/stores/compare'
import { useFilterStore } from '@/stores/filter'
import { useHistoryStore } from '@/stores/history'
import { getImageUrl } from '@/config'
import FavoriteButton from './FavoriteButton.vue'

const props = defineProps<{
  property: Property
}>()

const compareStore = useCompareStore()
const filterStore = useFilterStore()
const historyStore = useHistoryStore()

const mainImage = computed(() => {
  if (!props.property.thumbnail) return ''
  const images = props.property.thumbnail.split(',')
  const path = images[0]
  if (!path || !path.trim()) return ''
  if (path.startsWith('http')) return path
  return getImageUrl(path)
})

const isInCompare = computed(() => {
  return compareStore.isInCompare(props.property.projectNo)
})

const isAvailable = computed(() => {
  return props.property.kezuCount > 0
})

const handleToggleCompare = (e: Event) => {
  e.preventDefault()
  e.stopPropagation()
  compareStore.toggleCompare(props.property)
}

// 提取房源的所有设备
const propertyEquipments = computed(() => {
  const equipments = new Set<string>()
  if (props.property.roomTypeDetails) {
    props.property.roomTypeDetails.forEach(detail => {
      if (detail.houseTypeList) {
        detail.houseTypeList.forEach(house => {
          if (house.roomEquipment) {
            house.roomEquipment.split(',').forEach(e => equipments.add(e.trim()))
          }
        })
      }
    })
  }
  return Array.from(equipments).filter(Boolean)
})

// 提取房源的所有标签
const propertyLabels = computed(() => {
  const labels = new Set<string>()
  if (props.property.roomTypeDetails) {
    props.property.roomTypeDetails.forEach(detail => {
      if (detail.houseTypeList) {
        detail.houseTypeList.forEach(house => {
          if (house.roomLabel) {
            house.roomLabel.split(',').forEach(l => labels.add(l.trim()))
          }
        })
      }
    })
  }
  return Array.from(labels).filter(Boolean)
})

// 提取房源的所有面积
const propertyAreas = computed(() => {
  const areas = new Set<string>()
  if (props.property.roomTypeDetails) {
    props.property.roomTypeDetails.forEach(detail => {
      if (detail.houseTypeList) {
        detail.houseTypeList.forEach(house => {
          if (house.area) {
            areas.add(house.area.trim())
          }
        })
      }
    })
  }
  return Array.from(areas).filter(Boolean)
})

// 格式化面积显示（提取数值，显示范围）
const formattedArea = computed(() => {
  if (propertyAreas.value.length === 0) return null

  // 提取数值（去掉m²等单位）
  const numbers = propertyAreas.value
    .map(area => parseFloat(area.replace(/[^\d.]/g, '')))
    .filter(n => !isNaN(n))

  if (numbers.length === 0) return null

  const min = Math.min(...numbers)
  const max = Math.max(...numbers)

  if (min === max) {
    return `${min}m²`
  }
  return `${min}-${max}m²`
})

// 显示在卡片上的设备：用户筛选了的 AND 房源有的
const displayEquipments = computed(() => {
  const selected = filterStore.filters.equipment
  if (!selected || selected.length === 0) return []
  return propertyEquipments.value.filter(eq => selected.includes(eq))
})

// 显示在卡片上的标签：用户筛选了的 AND 房源有的
const displayLabels = computed(() => {
  const selected = filterStore.filters.label
  if (!selected || selected.length === 0) return []
  return propertyLabels.value.filter(label => selected.includes(label))
})

// 获取浏览时间
const viewedAt = computed(() => {
  return historyStore.getViewedAt(props.property.projectNo)
})

// 格式化浏览时间（精确到秒）
const formattedViewedAt = computed(() => {
  if (!viewedAt.value) return null
  const date = new Date(viewedAt.value)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
})
</script>

<template>
  <RouterLink
    :to="`/property/${property.projectNo}`"
    class="block bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden group"
  >
    <div class="relative aspect-video bg-gray-100">
      <img
        v-if="mainImage"
        :src="mainImage"
        :alt="property.projectName"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
      />
      <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
        <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <div class="absolute top-2 right-2 flex gap-2">
        <button
          @click.stop.prevent
          class="p-1.5 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-sm"
        >
          <FavoriteButton :property="property" size="small" />
        </button>
      </div>
      <div class="absolute top-2 left-2 flex gap-2">
        <span
          v-if="isAvailable"
          class="px-2 py-1 text-xs font-medium bg-green-500 text-white rounded"
        >
          可租
        </span>
        <span
          v-else
          class="px-2 py-1 text-xs font-medium bg-gray-500 text-white rounded"
        >
          已满
        </span>
      </div>
    </div>
    <div class="p-4">
      <div class="flex items-baseline justify-between gap-2 mb-2">
        <h3 class="text-lg font-semibold text-gray-800 line-clamp-1">
          {{ property.projectName }}
        </h3>
        <span class="text-lg font-bold text-red-600 shrink-0">
          {{ formatPriceRange(property.minRent, property.maxRent) }}/月
        </span>
      </div>
      <div class="flex items-center justify-between gap-2 mb-3">
        <p class="text-sm text-gray-500 line-clamp-1">
          {{ truncateText(property.location, 50) }}
        </p>
        <span v-if="property.openingDate" class="text-xs text-gray-400 shrink-0">
          {{ property.openingDate }}
        </span>
      </div>
      <!-- 数量信息行：灰色不加粗 -->
      <div class="flex items-center gap-4 text-sm text-gray-500 mb-3">
        <span>总套数: {{ property.totalCount || '-' }}</span>
        <span>可租: {{ property.kezuCount }}</span>
        <span>{{ formattedArea || '-' }}</span>
      </div>
      <!-- 标签行：单行显示，高度一致 -->
      <div class="flex items-center gap-2 text-sm text-gray-600 mb-3 overflow-x-auto">
        <span class="px-2 py-1 bg-blue-50 text-blue-700 rounded whitespace-nowrap shrink-0">
          {{ property.layout || '未知区域' }}
        </span>
        <span class="px-2 py-1 bg-purple-50 text-purple-700 rounded whitespace-nowrap shrink-0">
          {{ formatRoomType(property.roomType) }}
        </span>
        <span
          v-for="eq in displayEquipments"
          :key="eq"
          class="px-2 py-1 bg-teal-50 text-teal-700 rounded whitespace-nowrap shrink-0"
        >
          {{ eq }}
        </span>
        <span
          v-for="label in displayLabels"
          :key="label"
          class="px-2 py-1 bg-pink-50 text-pink-700 rounded whitespace-nowrap shrink-0"
        >
          {{ label }}
        </span>
      </div>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span
            :class="[
              'text-xs',
              property.openQueue === '是' ? 'text-green-600' : 'text-gray-500'
            ]"
          >
            {{ formatOpenQueue(property.openQueue) }}
          </span>
          <span v-if="formattedViewedAt" class="text-xs text-gray-400">
            浏览: {{ formattedViewedAt }}
          </span>
        </div>
        <button
          @click="handleToggleCompare"
          :class="[
            'px-3 py-1.5 text-sm rounded-lg transition-colors',
            isInCompare
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          ]"
        >
          {{ isInCompare ? '已添加对比' : '+ 加入对比' }}
        </button>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>