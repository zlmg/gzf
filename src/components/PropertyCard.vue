<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { Property } from '@/types/property'
import { formatPriceRange, formatRoomType, formatOpenQueue, truncateText } from '@/utils/format'
import { useCompareStore } from '@/stores/compare'
import FavoriteButton from './FavoriteButton.vue'

const props = defineProps<{
  property: Property
}>()

const compareStore = useCompareStore()

const IMAGE_BASE_URL = 'https://www.bsgzf.com.cn'

const mainImage = computed(() => {
  if (!props.property.thumbnail) return ''
  const images = props.property.thumbnail.split(',')
  const path = images[0]
  if (path.startsWith('http')) return path
  return `${IMAGE_BASE_URL}${path}`
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
      <h3 class="text-lg font-semibold text-gray-800 mb-2 line-clamp-1">
        {{ property.projectName }}
      </h3>
      <p class="text-sm text-gray-500 mb-3 line-clamp-2">
        {{ truncateText(property.location, 50) }}
      </p>
      <div class="flex items-center justify-between mb-3">
        <span class="text-lg font-bold text-red-600">
          {{ formatPriceRange(property.minRent, property.maxRent) }}/月
        </span>
      </div>
      <div class="flex items-center gap-2 text-sm text-gray-600 mb-3">
        <span class="px-2 py-1 bg-blue-50 text-blue-700 rounded">
          {{ property.layout || '未知区域' }}
        </span>
        <span class="px-2 py-1 bg-purple-50 text-purple-700 rounded">
          {{ formatRoomType(property.roomType) }}
        </span>
        <span class="px-2 py-1 bg-orange-50 text-orange-700 rounded">
          可租: {{ property.kezuCount }}
        </span>
      </div>
      <div class="flex items-center justify-between">
        <span
          :class="[
            'text-xs',
            property.openQueue === '是' ? 'text-green-600' : 'text-gray-500'
          ]"
        >
          {{ formatOpenQueue(property.openQueue) }}
        </span>
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