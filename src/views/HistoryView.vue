<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElButton, ElEmpty, ElMessage } from 'element-plus'
import { useHistoryStore } from '@/stores/history'
import { useCompareStore } from '@/stores/compare'
import { formatPriceRange, formatRoomType, formatOpenQueue } from '@/utils/format'

const router = useRouter()
const historyStore = useHistoryStore()
const compareStore = useCompareStore()

const hasHistory = computed(() => historyStore.history.length > 0)

const IMAGE_BASE_URL = 'https://www.bsgzf.com.cn'

const getThumbnailUrl = (thumbnail: string): string => {
  if (!thumbnail) return ''
  const images = thumbnail.split(',')
  const path = images[0]
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${IMAGE_BASE_URL}${path}`
}

const goToDetail = (projectNo: string) => {
  router.push(`/property/${projectNo}`)
}

const handleRemove = (projectNo: string) => {
  historyStore.removeFromHistory(projectNo)
}

const handleClearAll = () => {
  if (confirm('确定要清空所有浏览记录吗？此操作不可撤销。')) {
    historyStore.clearHistory()
  }
}

const formatViewedAt = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 汇总所有房型的设备并去重
const getEquipmentList = (item: typeof historyStore.history[0]): string[] => {
  if (!item.roomTypeDetails) return []
  const equipmentSet = new Set<string>()
  item.roomTypeDetails.forEach(detail => {
    detail.houseTypeList?.forEach(houseType => {
      if (houseType.roomEquipment) {
        houseType.roomEquipment.split(',').forEach(eq => {
          const trimmed = eq.trim()
          if (trimmed) equipmentSet.add(trimmed)
        })
      }
    })
  })
  return Array.from(equipmentSet)
}

// 检查房源是否有"近地铁"标签
const hasSubwayLabel = (item: typeof historyStore.history[0]): boolean => {
  if (!item.roomTypeDetails) return false
  for (const detail of item.roomTypeDetails) {
    if (detail.houseTypeList) {
      for (const houseType of detail.houseTypeList) {
        if (houseType.roomLabel && houseType.roomLabel.includes('近地铁')) {
          return true
        }
      }
    }
  }
  return false
}

// 提取房型的面积范围
const getFormattedArea = (item: typeof historyStore.history[0]): string | null => {
  if (!item.roomTypeDetails) return null
  const areas = new Set<string>()
  item.roomTypeDetails.forEach(detail => {
    detail.houseTypeList?.forEach(houseType => {
      if (houseType.area) {
        areas.add(houseType.area.trim())
      }
    })
  })

  if (areas.size === 0) return null

  const numbers = Array.from(areas)
    .map(area => parseFloat(area.replace(/[^\d.]/g, '')))
    .filter(n => !isNaN(n))

  if (numbers.length === 0) return null

  const min = Math.min(...numbers)
  const max = Math.max(...numbers)

  if (min === max) {
    return `${min}m²`
  }
  return `${min}-${max}m²`
}

// 检查是否在对比列表中
const isInCompare = (projectNo: string): boolean => {
  return compareStore.isInCompare(projectNo)
}

// 切换对比状态
const handleToggleCompare = (e: Event, item: typeof historyStore.history[0]) => {
  e.stopPropagation()
  const property = {
    projectNo: item.projectNo,
    projectName: item.projectName,
    location: item.location,
    layout: item.layout,
    roomType: item.roomType,
    minRent: item.minRent,
    maxRent: item.maxRent,
    thumbnail: item.thumbnail,
    mediaUrl: '',
    latitude: '',
    longitude: '',
    kezuCount: item.kezuCount,
    openQueue: item.openQueue,
    district: item.district || '',
    openingDate: item.openingDate || '',
    houseType: item.houseType || '',
    houseSource: item.houseSource || '',
    supply: '',
    totalCount: item.totalCount || '',
    totalArea: item.totalArea || '',
    textContent: '',
    roomTypeCount: '',
    roomTypeDetails: item.roomTypeDetails || []
  }

  if (isInCompare(item.projectNo)) {
    compareStore.toggleCompare(property)
  } else {
    if (compareStore.isFull) {
      ElMessage.warning('对比列表已满，最多只能添加4个房源')
      return
    }
    compareStore.toggleCompare(property)
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container-app py-4 md:py-6">
      <!-- Page header -->
      <div class="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 class="text-xl md:text-2xl font-bold text-gray-800 mb-1 md:mb-2">浏览记录</h1>
          <p class="text-sm md:text-base text-gray-600">
            共 <span class="font-semibold text-red-600">{{ historyStore.count }}</span> 条浏览记录
          </p>
        </div>
        <div v-if="hasHistory" class="flex items-center gap-2 md:gap-3">
          <ElButton @click="handleClearAll" type="danger" plain size="small" class="!text-xs md:!text-sm">
            清空全部
          </ElButton>
        </div>
      </div>

      <!-- Empty state -->
      <ElEmpty
        v-if="!hasHistory"
        description="暂无浏览记录"
        class="py-16 md:py-20"
      >
        <ElButton type="primary" @click="router.push('/')">
          去浏览房源
        </ElButton>
      </ElEmpty>

      <!-- History list -->
      <div v-else class="space-y-3 md:space-y-4">
        <TransitionGroup name="list">
          <div
            v-for="item in historyStore.history"
            :key="item.projectNo"
            class="bg-white rounded-xl shadow-sm md:shadow-md overflow-hidden hover:shadow-lg transition-shadow active:scale-[0.99] md:active:scale-100"
          >
            <!-- Mobile Layout -->
            <div class="md:hidden">
              <!-- Image with status badge -->
              <div class="relative h-40 bg-gray-100">
                <img
                  v-if="item.thumbnail"
                  :src="getThumbnailUrl(item.thumbnail)"
                  :alt="item.projectName"
                  class="w-full h-full object-cover cursor-pointer"
                  @click="goToDetail(item.projectNo)"
                  loading="lazy"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
                  <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <!-- Status badge -->
                <div class="absolute top-2 left-2">
                  <span
                    :class="[
                      'px-2 py-1 text-xs font-medium rounded-full shadow-sm',
                      (item.openQueue === '1' || item.openQueue === '是')
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-500/80 text-white'
                    ]"
                  >
                    {{ (item.openQueue === '1' || item.openQueue === '是') ? '开放排队' : '暂未开放' }}
                  </span>
                </div>
              </div>

              <!-- Content -->
              <div class="p-3">
                <!-- Title row -->
                <div class="flex items-baseline justify-between gap-2 mb-2">
                  <h3
                    class="text-base font-semibold text-gray-800 line-clamp-1 cursor-pointer hover:text-blue-600 transition-colors flex-1"
                    @click="goToDetail(item.projectNo)"
                  >
                    {{ item.projectName }}
                  </h3>
                  <span class="text-lg font-bold text-red-600 whitespace-nowrap shrink-0">
                    {{ formatPriceRange(item.minRent, item.maxRent) }}/月
                  </span>
                </div>

                <!-- Location and Opening Date -->
                <div class="flex items-center justify-between gap-2 mb-2">
                  <p class="text-xs text-gray-500 line-clamp-1 flex-1">{{ item.location }}</p>
                  <span v-if="item.openingDate" class="text-xs text-gray-400 shrink-0">
                    {{ item.openingDate }}
                  </span>
                </div>

                <!-- 数量信息行：灰色不加粗 -->
                <div class="flex items-center gap-3 text-xs text-gray-500 mb-2">
                  <span>总套数: {{ item.totalCount || '-' }}</span>
                  <span>可租: {{ item.kezuCount }}</span>
                  <span>{{ getFormattedArea(item) || '-' }}</span>
                </div>

                <!-- Tags: 单行显示，高度一致 -->
                <div class="flex items-center gap-1.5 mb-2 overflow-x-auto">
                  <span class="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs whitespace-nowrap shrink-0">
                    {{ item.layout || '未知区域' }}
                  </span>
                  <span class="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs whitespace-nowrap shrink-0">
                    {{ formatRoomType(item.roomType) }}
                  </span>
                  <span v-if="hasSubwayLabel(item)" class="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs whitespace-nowrap shrink-0">
                    近地铁
                  </span>
                </div>

                <!-- Equipment -->
                <div v-if="getEquipmentList(item).length > 0" class="mb-2">
                  <div class="flex items-start gap-1 text-xs text-gray-500">
                    <svg class="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div class="flex flex-wrap gap-1">
                      <span
                        v-for="eq in getEquipmentList(item)"
                        :key="eq"
                        class="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded"
                      >
                        {{ eq }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <button
                    @click.stop="handleToggleCompare($event, item)"
                    :class="[
                      'flex-1 py-2 text-sm rounded-lg transition-all active:scale-95',
                      isInCompare(item.projectNo)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                    ]"
                  >
                    {{ isInCompare(item.projectNo) ? '已加入对比' : '加入对比' }}
                  </button>
                  <button
                    @click.stop="handleRemove(item.projectNo)"
                    class="px-4 py-2 text-sm text-red-600 bg-red-50 rounded-lg transition-all active:scale-95 active:bg-red-100"
                  >
                    删除
                  </button>
                </div>

                <!-- Timestamp -->
                <div class="mt-2 text-xs text-gray-400 text-center">
                  浏览于 {{ formatViewedAt(item.viewedAt) }}
                </div>
              </div>
            </div>

            <!-- Desktop Layout -->
            <div class="hidden md:flex flex-col md:flex-row">
              <!-- Image -->
              <div class="md:w-48 h-36 md:h-auto flex-shrink-0 bg-gray-100 relative">
                <img
                  v-if="item.thumbnail"
                  :src="getThumbnailUrl(item.thumbnail)"
                  :alt="item.projectName"
                  class="w-full h-full object-cover cursor-pointer"
                  @click="goToDetail(item.projectNo)"
                  loading="lazy"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
                  <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              <!-- Content -->
              <div class="flex-1 p-4">
                <div class="flex items-start justify-between">
                  <div class="flex-1 cursor-pointer" @click="goToDetail(item.projectNo)">
                    <div class="flex items-baseline justify-between gap-2 mb-2">
                      <h3 class="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors flex-1">
                        {{ item.projectName }}
                      </h3>
                      <span class="text-lg font-bold text-red-600 whitespace-nowrap shrink-0">
                        {{ formatPriceRange(item.minRent, item.maxRent) }}/月
                      </span>
                    </div>
                    <!-- Location and Opening Date -->
                    <div class="flex items-center justify-between gap-2 mb-3">
                      <p class="text-sm text-gray-500 line-clamp-1 flex-1">{{ item.location }}</p>
                      <span v-if="item.openingDate" class="text-xs text-gray-400 shrink-0">
                        {{ item.openingDate }}
                      </span>
                    </div>
                    <!-- 数量信息行：灰色不加粗 -->
                    <div class="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span>总套数: {{ item.totalCount || '-' }}</span>
                      <span>可租: {{ item.kezuCount }}</span>
                      <span>{{ getFormattedArea(item) || '-' }}</span>
                    </div>
                    <!-- 标签行：单行显示，高度一致 -->
                    <div class="flex items-center gap-2 mb-3 overflow-x-auto">
                      <span class="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm whitespace-nowrap shrink-0">
                        {{ item.layout || '未知区域' }}
                      </span>
                      <span v-if="item.district" class="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-sm whitespace-nowrap shrink-0">
                        {{ item.district }}
                      </span>
                      <span class="px-2 py-1 bg-purple-50 text-purple-700 rounded text-sm whitespace-nowrap shrink-0">
                        {{ formatRoomType(item.roomType) }}
                      </span>
                      <span v-if="item.houseType" class="px-2 py-1 bg-cyan-50 text-cyan-700 rounded text-sm whitespace-nowrap shrink-0">
                        {{ item.houseType }}
                      </span>
                      <span v-if="hasSubwayLabel(item)" class="px-2 py-1 bg-amber-50 text-amber-700 rounded text-sm whitespace-nowrap shrink-0">
                        近地铁
                      </span>
                    </div>
                    <!-- 设备 -->
                    <div v-if="getEquipmentList(item).length > 0" class="mt-2 flex items-start gap-2 text-xs">
                      <span class="text-gray-500 flex-shrink-0">设备:</span>
                      <div class="flex flex-wrap gap-1">
                        <span
                          v-for="eq in getEquipmentList(item)"
                          :key="eq"
                          class="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded"
                        >
                          {{ eq }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="ml-4 text-right flex flex-col items-end gap-2">
                    <div class="flex gap-2">
                      <ElButton
                        :type="isInCompare(item.projectNo) ? 'primary' : 'default'"
                        plain
                        size="small"
                        @click.stop="handleToggleCompare($event, item)"
                      >
                        {{ isInCompare(item.projectNo) ? '已加入对比' : '加入对比' }}
                      </ElButton>
                      <ElButton
                        type="danger"
                        plain
                        size="small"
                        @click.stop="handleRemove(item.projectNo)"
                      >
                        删除
                      </ElButton>
                    </div>
                  </div>
                </div>
                <div class="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                  <span class="text-xs text-gray-400">
                    浏览时间: {{ formatViewedAt(item.viewedAt) }}
                  </span>
                  <span
                    :class="[
                      'text-xs',
                      item.openQueue === '1' || item.openQueue === '是' ? 'text-green-600' : 'text-gray-400'
                    ]"
                  >
                    {{ formatOpenQueue(item.openQueue) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <!-- Tips -->
      <div v-if="hasHistory" class="mt-4 md:mt-6 p-3 md:p-4 bg-blue-50 rounded-lg">
        <div class="flex items-center gap-2 text-blue-700 text-sm">
          <svg class="w-4 h-4 md:w-5 md:h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>浏览记录保存在浏览器本地，最多保留100条，清除浏览器数据后将会丢失</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.list-move {
  transition: transform 0.3s ease;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>