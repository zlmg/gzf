<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { ElButton, ElSkeleton, ElTag, ElDescriptions, ElDescriptionsItem } from 'element-plus'
import { usePropertyStore } from '@/stores/property'
import { useCompareStore } from '@/stores/compare'
import { useFavoriteStore } from '@/stores/favorite'
import ImageGallery from '@/components/ImageGallery.vue'
import FavoriteButton from '@/components/FavoriteButton.vue'
import { formatPriceRange, formatRoomType, formatOpenQueue, formatRoomTypeCode, formatEquipmentList, formatLabelList, formatArea, formatHouseTypeName } from '@/utils/format'
import type { Property, HouseType } from '@/types/property'

const route = useRoute()
const router = useRouter()
const propertyStore = usePropertyStore()
const compareStore = useCompareStore()
const favoriteStore = useFavoriteStore()

const property = ref<Property | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// 图片查看器状态
const showImageViewer = ref(false)
const viewerImage = ref('')
const viewerTitle = ref('')

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

// 获取房型图片
const getHouseTypeImage = (house: HouseType): string | undefined => {
  if (!house.roomPicUrl) return undefined
  const imgs = house.roomPicUrl.split(',')
  if (imgs.length === 0) return undefined
  const firstPath = imgs[0]
  if (!firstPath) return undefined
  if (firstPath.startsWith('http')) return firstPath
  return `${IMAGE_BASE_URL}${firstPath}`
}

// 打开VR链接
const openVrUrl = (vrUrl: string) => {
  if (vrUrl) {
    window.open(vrUrl, '_blank')
  }
}

// 打开图片查看器
const openImageViewer = (imageUrl: string, title: string) => {
  viewerImage.value = imageUrl
  viewerTitle.value = title
  showImageViewer.value = true
}

// 关闭图片查看器
const closeImageViewer = () => {
  showImageViewer.value = false
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
  } else {
    error.value = '未找到该房源信息'
  }

  loading.value = false
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container-app py-4 md:py-6">
      <!-- Back button -->
      <div class="mb-4 md:mb-6">
        <button
          @click="goBack"
          class="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors text-sm md:text-base"
        >
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
        <svg class="w-12 h-12 md:w-16 md:h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <ImageGallery
            :images="images"
            :title="property.projectName"
          />
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
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500 mb-1">项目编号</p>
                <p class="text-sm font-medium text-gray-800 break-all">{{ property.projectNo }}</p>
              </div>
              <div class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500 mb-1">所属区域</p>
                <p class="text-sm font-medium text-gray-800">{{ property.layout || '-' }}</p>
              </div>
              <div class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500 mb-1">户型</p>
                <p class="text-sm font-medium text-gray-800">{{ formatRoomType(property.roomType) }}</p>
              </div>
              <div class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500 mb-1">租金</p>
                <p class="text-sm font-semibold text-red-600">{{ formatPriceRange(property.minRent, property.maxRent) }}/月</p>
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
              <!-- 新增字段 -->
              <div v-if="property.houseType" class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500 mb-1">房屋类型</p>
                <p class="text-sm font-medium text-gray-800">{{ property.houseType }}</p>
              </div>
              <div v-if="property.houseSource" class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500 mb-1">房屋来源</p>
                <p class="text-sm font-medium text-gray-800">{{ property.houseSource }}</p>
              </div>
              <div v-if="property.totalCount" class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500 mb-1">总套数</p>
                <p class="text-sm font-medium text-gray-800">{{ property.totalCount }} 套</p>
              </div>
              <div v-if="property.totalArea" class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500 mb-1">总面积</p>
                <p class="text-sm font-medium text-gray-800">{{ property.totalArea }} m²</p>
              </div>
              <div v-if="property.openingDate" class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500 mb-1">开放日期</p>
                <p class="text-sm font-medium text-gray-800">{{ property.openingDate }}</p>
              </div>
              <div v-if="property.supply" class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500 mb-1">供应对象</p>
                <p class="text-sm font-medium text-gray-800">{{ property.supply }}</p>
              </div>
            </div>
            <div class="bg-gray-50 rounded-lg p-3">
              <p class="text-xs text-gray-500 mb-1">地址</p>
              <p class="text-sm font-medium text-gray-800 break-words">{{ property.location || '-' }}</p>
            </div>
            <div v-if="property.latitude && property.longitude" class="bg-gray-50 rounded-lg p-3">
              <p class="text-xs text-gray-500 mb-1">坐标</p>
              <p class="text-sm font-medium text-gray-800 font-mono">{{ property.latitude }}, {{ property.longitude }}</p>
            </div>
          </div>

          <!-- 桌面端: Descriptions 组件 -->
          <ElDescriptions :column="2" border class="mb-6 hidden md:block">
            <ElDescriptionsItem label="项目编号">
              {{ property.projectNo }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="所属区域">
              {{ property.layout || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="户型">
              {{ formatRoomType(property.roomType) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="租金">
              <span class="text-red-600 font-semibold">
                {{ formatPriceRange(property.minRent, property.maxRent) }}/月
              </span>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="可租数量">
              <span :class="property.kezuCount > 0 ? 'text-green-600' : 'text-gray-500'">
                {{ property.kezuCount }} 套
              </span>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="开放状态">
              {{ formatOpenQueue(property.openQueue) }}
            </ElDescriptionsItem>
            <!-- 新增字段 -->
            <ElDescriptionsItem v-if="property.district" label="行政区">
              {{ property.district }}
            </ElDescriptionsItem>
            <ElDescriptionsItem v-if="property.houseType" label="房屋类型">
              {{ property.houseType }}
            </ElDescriptionsItem>
            <ElDescriptionsItem v-if="property.houseSource" label="房屋来源">
              {{ property.houseSource }}
            </ElDescriptionsItem>
            <ElDescriptionsItem v-if="property.supply" label="供应对象">
              {{ property.supply }}
            </ElDescriptionsItem>
            <ElDescriptionsItem v-if="property.totalCount" label="总套数">
              {{ property.totalCount }} 套
            </ElDescriptionsItem>
            <ElDescriptionsItem v-if="property.totalArea" label="总面积">
              {{ property.totalArea }} m²
            </ElDescriptionsItem>
            <ElDescriptionsItem v-if="property.openingDate" label="开放日期">
              {{ property.openingDate }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="地址" :span="2">
              {{ property.location || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem v-if="property.latitude && property.longitude" label="坐标" :span="2">
              {{ property.latitude }}, {{ property.longitude }}
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
              <FavoriteButton
                v-if="property"
                :property="property"
                size="default"
                :show-text="true"
              />
              <ElButton
                :type="isInCompare ? 'primary' : 'default'"
                size="default"
                @click="handleToggleCompare"
              >
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
              <RouterLink to="/favorites">
                <ElButton v-if="favoriteStore.count > 0" type="danger" plain size="default">
                  查看收藏 ({{ favoriteStore.count }})
                </ElButton>
              </RouterLink>
            </div>
          </div>
        </div>

        <!-- 房型详情区块 -->
        <div v-if="property.roomTypeDetails && property.roomTypeDetails.length > 0" class="space-y-4">
          <h2 class="text-lg md:text-xl font-bold text-gray-800">房型详情</h2>

          <div
            v-for="(detail, index) in property.roomTypeDetails"
            :key="index"
            class="bg-white rounded-xl shadow-md p-4 md:p-6"
          >
            <!-- 房型分组信息 -->
            <div class="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b border-gray-200">
              <ElTag type="primary" size="large">{{ formatHouseTypeName(detail.houseTypeList?.[0]?.houseTypeName || '') || `房型 ${index + 1}` }}</ElTag>
              <span class="text-red-600 font-semibold">{{ formatPriceRange(detail.minRent, detail.maxRent) }}/月</span>
              <span class="text-gray-500 text-sm">总套数: {{ detail.totalCount }} 套</span>
              <span class="text-green-600 text-sm">可租: {{ detail.kezuCount }} 套</span>
              <span v-if="detail.queueCount > 0" class="text-orange-600 text-sm">排队人数: {{ detail.queueCount }} 人</span>
            </div>

            <!-- 房型卡片列表 -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="(house, hIndex) in detail.houseTypeList"
                :key="hIndex"
                class="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <!-- 房型图片 -->
                <div class="bg-gray-100 relative">
                  <img
                    v-if="getHouseTypeImage(house)"
                    :src="getHouseTypeImage(house)"
                    :alt="house.houseTypeName"
                    class="w-full h-auto max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                    loading="lazy"
                    @click="openImageViewer(getHouseTypeImage(house)!, house.houseTypeName)"
                  />
                  <div v-else class="w-full h-40 flex items-center justify-center text-gray-400">
                    <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <!-- VR 按钮 -->
                  <button
                    v-if="house.vrUrl"
                    @click.stop="openVrUrl(house.vrUrl)"
                    class="absolute bottom-3 right-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    VR看房
                  </button>
                </div>

                <!-- 房型信息 -->
                <div class="p-3">
                  <div class="flex items-center justify-between mb-2">
                    <h4 class="font-semibold text-gray-800">{{ house.houseTypeName }}</h4>
                    <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{{ formatRoomTypeCode(house.roomType) }}</span>
                  </div>

                  <div class="flex items-center gap-3 text-sm text-gray-600 mb-2">
                    <span v-if="house.area">{{ formatArea(house.area) }}</span>
                    <span v-if="house.towards">{{ house.towards }}</span>
                  </div>

                  <!-- 标签 -->
                  <div v-if="house.roomLabel && formatLabelList(house.roomLabel).length > 0" class="flex flex-wrap gap-1 mb-2">
                    <span
                      v-for="(label, lIndex) in formatLabelList(house.roomLabel)"
                      :key="lIndex"
                      class="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded"
                    >
                      {{ label }}
                    </span>
                  </div>

                  <!-- 设备 (全部显示) -->
                  <div v-if="house.roomEquipment && formatEquipmentList(house.roomEquipment).length > 0" class="flex flex-wrap gap-1">
                    <span
                      v-for="(eq, eIndex) in formatEquipmentList(house.roomEquipment)"
                      :key="eIndex"
                      class="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
                    >
                      {{ eq }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Map placeholder (shows coordinates if available) -->
        <div v-if="property.latitude && property.longitude" class="bg-white rounded-xl shadow-md p-4 md:p-6">
          <h2 class="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">位置信息</h2>
          <div class="bg-gray-100 rounded-lg p-4 text-center">
            <p class="text-gray-600 text-sm mb-2">经纬度坐标</p>
            <p class="font-mono text-gray-800 text-sm md:text-base">
              {{ property.latitude }}, {{ property.longitude }}
            </p>
            <a
              :href="`https://www.google.com/maps?q=${property.latitude},${property.longitude}`"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 mt-3 md:mt-4 text-blue-600 hover:text-blue-800 text-sm md:text-base"
            >
              <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              在地图中查看
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片查看器 -->
    <Teleport to="body">
      <Transition name="viewer-fade">
        <div
          v-if="showImageViewer"
          class="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center"
          @click="closeImageViewer"
        >
          <!-- 关闭按钮 -->
          <button
            @click="closeImageViewer"
            class="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
            aria-label="关闭"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- 标题 -->
          <div v-if="viewerTitle" class="absolute top-4 left-4 text-white text-sm bg-black/50 px-3 py-1 rounded">
            {{ viewerTitle }}
          </div>

          <!-- 图片 -->
          <img
            :src="viewerImage"
            :alt="viewerTitle"
            class="max-h-[90vh] max-w-[95vw] object-contain"
            @click.stop
          />

          <!-- 提示 -->
          <p class="absolute bottom-4 text-white/60 text-sm">点击空白处关闭</p>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* 图片查看器过渡动画 */
.viewer-fade-enter-active,
.viewer-fade-leave-active {
  transition: opacity 0.3s ease;
}

.viewer-fade-enter-from,
.viewer-fade-leave-to {
  opacity: 0;
}
</style>