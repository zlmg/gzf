<script setup lang="ts">
import { ref,computed, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { ElButton, ElSkeleton, ElTag, ElDescriptions, ElDescriptionsItem } from 'element-plus'
import { usePropertyStore } from '@/stores/property'
import { useCompareStore } from '@/stores/compare'
import { useFavoriteStore } from '@/stores/favorite'
import { useHistoryStore } from '@/stores/history'
import { useStorage } from '@/composables/useStorage'
import ImageGallery from '@/components/ImageGallery.vue'
import ImageViewer from '@/components/ImageViewer.vue'
import FavoriteButton from '@/components/FavoriteButton.vue'
import AmapNearby from '@/components/AmapNearby.vue'
import { formatPriceRange, formatRoomType, formatOpenQueue, formatRoomTypeCode, formatEquipmentList, formatLabelList, formatArea, formatHouseTypeName } from '@/utils/format'
import type { Property, HouseType } from '@/types/property'

const route = useRoute()
const router = useRouter()
const propertyStore = usePropertyStore()
const compareStore = useCompareStore()
const favoriteStore = useFavoriteStore()
const historyStore = useHistoryStore()

const property = ref<Property | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// 周边配套显示状态（持久化到本地）
const { data: showNearby } = useStorage('nearby-expanded', false)

// 房型图片查看器状态
const showHouseTypeViewer = ref(false)
const houseTypeImages = ref<string[]>([])
const houseTypeViewerTitle = ref('')
const houseTypeViewerIndex = ref(0)

const IMAGE_BASE_URL = 'https://www.bsgzf.com.cn'

const images = computed(() => {
  if (!property.value?.thumbnail) return []
  return property.value.thumbnail.split(',').map(path => {
    if (path.startsWith('http')) return path
    return `${IMAGE_BASE_URL}${path}`
  })
})

const isInCompare = computed(() => {
  if (!property.value) return false
  return compareStore.isInCompare(property.value.projectNo)
})

const isAvailable = computed(() => {
  return property.value?.kezuCount && property.value.kezuCount > 0
})

const handleToggleCompare = () => {
  if (!property.value) return
  compareStore.toggleCompare(property.value)
}

const goBack = () => {
  router.push('/')
}

// 获取房型第一张图片（用于卡片显示）
const getHouseTypeImage = (house: HouseType): string | undefined => {
  if (!house.roomPicUrl) return undefined
  const imgs = house.roomPicUrl.split(',')
  if (imgs.length === 0) return undefined
  const firstPath = imgs[0]
  if (!firstPath) return undefined
  if (firstPath.startsWith('http')) return firstPath
  return `${IMAGE_BASE_URL}${firstPath}`
}

// 获取房型所有图片
const getHouseTypeImages = (house: HouseType): string[] => {
  if (!house.roomPicUrl) return []
  return house.roomPicUrl.split(',')
    .map(path => path.trim())
    .filter(path => path)
    .map(path => {
      if (path.startsWith('http')) return path
      return `${IMAGE_BASE_URL}${path}`
    })
}

// 打开VR链接
const openVrUrl = (vrUrl: string) => {
  if (vrUrl) {
    (window as any).open(vrUrl, '_blank')
  }
}

// 打开房型图片查看器
const openHouseTypeViewer = (house: HouseType) => {
  const images = getHouseTypeImages(house)
  if (images.length === 0) return

  houseTypeImages.value = images
  houseTypeViewerTitle.value = house.houseTypeName || '房型图片'
  houseTypeViewerIndex.value = 0
  showHouseTypeViewer.value = true
}

// 关闭房型图片查看器
const closeHouseTypeViewer = () => {
  showHouseTypeViewer.value = false
}

// 打开地图
const openMap = () => {
  if (property.value) {
    const longitude = property.value.longitude || ''
    const latitude = property.value.latitude || ''
    const projectName = property.value.projectName || '房源位置'
    const mapUrl = `https://uri.amap.com/marker?position=${longitude},${latitude}&name=${encodeURIComponent(projectName)}&coordinate=gaode`;
    (window as any).open(mapUrl, '_blank');
  }
}

onMounted(async () => {
  const projectNo = route.params.projectNo as string

  // Try to find property in store first
  let found = propertyStore.getPropertyByNo(projectNo)

  // If not found, fetch properties first
  if (!found) {
    await propertyStore.fetchProperties()
    found = propertyStore.getPropertyByNo(projectNo)
  }

  if (found) {
    property.value = found
    // 记录浏览历史
    historyStore.addToHistory(found)
  } else {
    error.value = '未找到该房源信息'
  }

  loading.value = false
})

// 切换周边配套显示状态
const toggleNearby = () => {
  showNearby.value = !showNearby.value
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container-app py-4 md:py-6">
      <!-- Back button -->
      <div class="mb-4 md:mb-6">
        <button @click="goBack"
          class="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors text-sm md:text-base">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回房源列表
        </button>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="bg-white rounded-xl shadow-md p-4 md:p-6">
        <ElSkeleton :rows="10" animated />
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="bg-white rounded-xl shadow-md p-8 md:p-12 text-center">
        <svg class="w-12 h-12 md:w-16 md:h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor"
          viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-gray-600 mb-4 text-sm md:text-base">{{ error }}</p>
        <ElButton type="primary" @click="goBack">返回首页</ElButton>
      </div>

      <!-- Property detail -->
      <div v-else-if="property" class="space-y-4 md:space-y-6">
        <!-- Image gallery -->
        <div class="bg-white rounded-xl shadow-md p-3 md:p-4">
          <ImageGallery :images="images" :title="property.projectName" />
        </div>

        <!-- Basic info -->
        <div class="bg-white rounded-xl shadow-md p-4 md:p-6">
          <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4 mb-4 md:mb-6">
            <div class="flex-1 min-w-0">
              <h1 class="text-xl md:text-2xl font-bold text-gray-800 mb-1 md:mb-2 break-words">
                {{ property.projectName }}
              </h1>
              <p class="text-gray-600 text-sm md:text-base break-words">{{ property.location }}</p>
            </div>
            <div class="flex items-center gap-2 md:gap-3 shrink-0">
              <ElTag v-if="isAvailable" type="success" size="default">可租</ElTag>
              <ElTag v-else type="info" size="default">已满</ElTag>
              <ElTag v-if="property.district" type="primary" size="default">{{ property.district }}</ElTag>
            </div>
          </div>

          <!-- 移动端: 卡片式信息展示 -->
          <div class="md:hidden space-y-3 mb-4">
            <!-- 核心信息 -->
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500 mb-1">租金</p>
                <p class="text-sm font-semibold text-red-600">{{ formatPriceRange(property.minRent, property.maxRent)
                  }}/月</p>
              </div>
              <div class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500 mb-1">户型</p>
                <p class="text-sm font-medium text-gray-800">{{ formatRoomType(property.roomType) }}</p>
              </div>
              <div v-if="property.totalCount" class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500 mb-1">总套数</p>
                <p class="text-sm font-medium text-gray-800">{{ property.totalCount }} 套</p>
              </div>
              <div class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500 mb-1">可租数量</p>
                <p class="text-sm font-medium" :class="property.kezuCount > 0 ? 'text-green-600' : 'text-gray-500'">
                  {{ property.kezuCount }} 套
                </p>
              </div>
              <div class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500 mb-1">开放状态</p>
                <p class="text-sm font-medium text-gray-800">{{ formatOpenQueue(property.openQueue) }}</p>
              </div>
            </div>
            <!-- 位置信息 -->
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500 mb-1">所属区域</p>
                <p class="text-sm font-medium text-gray-800">{{ property.layout || '-' }}</p>
              </div>
              <div v-if="property.district" class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500 mb-1">行政区</p>
                <p class="text-sm font-medium text-gray-800">{{ property.district }}</p>
              </div>
            </div>
            <div v-if="property.latitude && property.longitude" class="bg-gray-50 rounded-lg p-3">
              <p class="text-xs text-gray-500 mb-1">坐标</p>
              <p class="text-sm font-medium text-gray-800 font-mono">{{ property.latitude }}, {{ property.longitude }}
              </p>
            </div>
            <div class="bg-gray-50 rounded-lg p-3">
              <p class="text-xs text-gray-500 mb-1">地址</p>
              <p class="text-sm font-medium text-gray-800 break-words">{{ property.location || '-' }}</p>
            </div>
            <!-- 房屋属性 -->
            <div class="grid grid-cols-2 gap-3">
              <div v-if="property.houseType" class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500 mb-1">房屋类型</p>
                <p class="text-sm font-medium text-gray-800">{{ property.houseType }}</p>
              </div>
              <div v-if="property.houseSource" class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500 mb-1">房屋来源</p>
                <p class="text-sm font-medium text-gray-800">{{ property.houseSource }}</p>
              </div>
              <div v-if="property.supply" class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500 mb-1">供应对象</p>
                <p class="text-sm font-medium text-gray-800">{{ property.supply }}</p>
              </div>
            </div>
            <!-- 规模信息 -->
            <div v-if="property.totalArea" class="bg-gray-50 rounded-lg p-3">
              <p class="text-xs text-gray-500 mb-1">总面积</p>
              <p class="text-sm font-medium text-gray-800">{{ property.totalArea }} m²</p>
            </div>
            <!-- 时间信息 -->
            <div v-if="property.openingDate" class="bg-gray-50 rounded-lg p-3">
              <p class="text-xs text-gray-500 mb-1">供应日期</p>
              <p class="text-sm font-medium text-gray-800">{{ property.openingDate }}</p>
            </div>
            <!-- 其他信息 -->
            <div class="bg-gray-50 rounded-lg p-3">
              <p class="text-xs text-gray-500 mb-1">项目编号</p>
              <p class="text-sm font-medium text-gray-800 break-all">{{ property.projectNo }}</p>
            </div>
          </div>

          <!-- 桌面端: Descriptions 组件 -->
          <ElDescriptions :column="2" border class="mb-6 hidden md:block">
            <!-- 核心信息 -->
            <ElDescriptionsItem label="租金">
              <span class="text-red-600 font-semibold">
                {{ formatPriceRange(property.minRent, property.maxRent) }}/月
              </span>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="户型">
              {{ formatRoomType(property.roomType) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem v-if="property.totalCount" label="总套数">
              {{ property.totalCount }} 套
            </ElDescriptionsItem>
            <ElDescriptionsItem label="可租数量">
              <span :class="property.kezuCount > 0 ? 'text-green-600' : 'text-gray-500'">
                {{ property.kezuCount }} 套
              </span>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="开放状态">
              {{ formatOpenQueue(property.openQueue) }}
            </ElDescriptionsItem>
            <!-- 位置信息 -->
            <ElDescriptionsItem label="所属区域">
              {{ property.layout || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem v-if="property.district" label="行政区">
              {{ property.district }}
            </ElDescriptionsItem>
            <ElDescriptionsItem v-if="property.latitude && property.longitude" label="坐标">
              {{ property.latitude }}, {{ property.longitude }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="地址">
              {{ property.location || '-' }}
            </ElDescriptionsItem>
            <!-- 房屋属性 -->
            <ElDescriptionsItem v-if="property.houseType" label="房屋类型">
              {{ property.houseType }}
            </ElDescriptionsItem>
            <ElDescriptionsItem v-if="property.houseSource" label="房屋来源">
              {{ property.houseSource }}
            </ElDescriptionsItem>
            <ElDescriptionsItem v-if="property.supply" label="供应对象">
              {{ property.supply }}
            </ElDescriptionsItem>
            <!-- 规模信息 -->
            <ElDescriptionsItem v-if="property.totalArea" label="总面积">
              {{ property.totalArea }} m²
            </ElDescriptionsItem>
            <!-- 时间信息 -->
            <ElDescriptionsItem v-if="property.openingDate" label="供应日期">
              {{ property.openingDate }}
            </ElDescriptionsItem>
            <!-- 其他信息 -->
            <ElDescriptionsItem label="项目编号">
              {{ property.projectNo }}
            </ElDescriptionsItem>
          </ElDescriptions>

          <!-- 项目介绍 -->
          <div v-if="property.textContent" class="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 class="text-sm font-semibold text-gray-700 mb-2">项目介绍</h3>
            <p class="text-sm text-gray-600 leading-relaxed">{{ property.textContent }}</p>
          </div>

          <!-- Action buttons -->
          <div class="flex flex-col sm:flex-row gap-3">
            <div class="flex flex-wrap gap-3">
              <FavoriteButton v-if="property" :property="property" />
              <RouterLink to="/favorites">
                <ElButton v-if="favoriteStore.count > 0" type="danger" plain size="default">
                  查看收藏 ({{ favoriteStore.count }})
                </ElButton>
              </RouterLink>
              <ElButton :type="isInCompare ? 'primary' : 'default'" size="default" @click="handleToggleCompare">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {{ isInCompare ? '已添加对比' : '加入对比' }}
              </ElButton>
            </div>
            <div class="flex flex-wrap gap-3">
              <RouterLink to="/compare">
                <ElButton v-if="compareStore.compareList.length > 0" type="primary" size="default">
                  查看对比 ({{ compareStore.compareList.length }})
                </ElButton>
              </RouterLink>
            </div>
          </div>
        </div>

        <!-- 房型详情区块 -->
        <div v-if="property.roomTypeDetails && property.roomTypeDetails.length > 0" class="space-y-4">
          <h2 class="text-lg md:text-xl font-bold text-gray-800">房型详情</h2>

          <div v-for="(detail, index) in property.roomTypeDetails" :key="index"
            class="bg-white rounded-xl shadow-md p-4 md:p-6">
            <!-- 房型分组信息 -->
            <div class="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b border-gray-200">
              <ElTag type="primary" size="large">{{ formatHouseTypeName(detail.houseTypeList?.[0]?.houseTypeName || '')
                || `房型 ${index + 1}` }}</ElTag>
              <span class="text-red-600 font-semibold">{{ formatPriceRange(detail.minRent, detail.maxRent) }}/月</span>
              <span class="text-gray-500 text-sm">总套数: {{ detail.totalCount }} 套</span>
              <span class="text-green-600 text-sm">可租: {{ detail.kezuCount }} 套</span>
              <span v-if="detail.queueCount > 0" class="text-orange-600 text-sm">排队人数: {{ detail.queueCount }} 人</span>
            </div>

            <!-- 房型卡片列表 -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div v-for="(house, hIndex) in detail.houseTypeList" :key="hIndex"
                class="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <!-- 房型图片 -->
                <div class="bg-gray-100 relative">
                  <img v-if="getHouseTypeImage(house)" :src="getHouseTypeImage(house)" :alt="house.houseTypeName"
                    class="w-full h-auto max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                    loading="lazy" @click="openHouseTypeViewer(house)" />
                  <div v-else class="w-full h-40 flex items-center justify-center text-gray-400">
                    <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <!-- 多图指示器 -->
                  <div v-if="getHouseTypeImages(house).length > 1"
                    class="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {{ getHouseTypeImages(house).length }} 张
                  </div>
                  <!-- VR 按钮 -->
                  <button v-if="house.vrUrl" @click.stop="openVrUrl(house.vrUrl)"
                    class="absolute bottom-3 right-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    VR看房
                  </button>
                </div>

                <!-- 房型信息 -->
                <div class="p-3">
                  <div class="flex items-center justify-between mb-2">
                    <h4 class="font-semibold text-gray-800">{{ house.houseTypeName }}</h4>
                    <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{{
                      formatRoomTypeCode(house.roomType) }}</span>
                  </div>

                  <div class="flex items-center gap-3 text-sm text-gray-600 mb-2">
                    <span v-if="house.area">{{ formatArea(house.area) }}</span>
                    <span v-if="house.towards">{{ house.towards }}</span>
                  </div>

                  <!-- 标签 -->
                  <div v-if="house.roomLabel && formatLabelList(house.roomLabel).length > 0"
                    class="flex flex-wrap gap-1 mb-2">
                    <span v-for="(label, lIndex) in formatLabelList(house.roomLabel)" :key="lIndex"
                      class="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                      {{ label }}
                    </span>
                  </div>

                  <!-- 设备 (全部显示) -->
                  <div v-if="house.roomEquipment && formatEquipmentList(house.roomEquipment).length > 0"
                    class="flex flex-wrap gap-1">
                    <span v-for="(eq, eIndex) in formatEquipmentList(house.roomEquipment)" :key="eIndex"
                      class="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                      {{ eq }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 周边配套 (高德地图) -->
        <div v-if="property.latitude && property.longitude" class="bg-white rounded-xl shadow-md p-4 md:p-6">
          <div class="flex items-center justify-between mb-3 md:mb-4">
            <div class="flex items-center gap-3">
              <h2 class="text-base md:text-lg font-semibold text-gray-800">周边配套</h2>
              <button @click="toggleNearby"
                class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-180': showNearby }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
                {{ showNearby ? '收起' : '展开' }}
              </button>
            </div>
            <button v-if="showNearby" @click="openMap"
              class="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              打开地图
            </button>
          </div>
          <AmapNearby v-if="showNearby" :latitude="property.latitude" :longitude="property.longitude"
            :property-name="property.projectName" />
        </div>
      </div>
    </div>

    <!-- 房型图片查看器 -->
    <ImageViewer
      v-if="showHouseTypeViewer"
      :images="houseTypeImages"
      :title="houseTypeViewerTitle"
      :initial-index="houseTypeViewerIndex"
      @close="closeHouseTypeViewer"
    />
  </div>
</template>

<style scoped>
</style>