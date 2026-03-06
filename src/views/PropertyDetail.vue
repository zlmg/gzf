<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { ElButton, ElSkeleton, ElTag, ElDescriptions, ElDescriptionsItem } from 'element-plus'
import { usePropertyStore } from '@/stores/property'
import { useCompareStore } from '@/stores/compare'
import { useFavoriteStore } from '@/stores/favorite'
import ImageGallery from '@/components/ImageGallery.vue'
import FavoriteButton from '@/components/FavoriteButton.vue'
import { formatPriceRange, formatRoomType, formatOpenQueue } from '@/utils/format'
import type { Property } from '@/types/property'

const route = useRoute()
const router = useRouter()
const propertyStore = usePropertyStore()
const compareStore = useCompareStore()
const favoriteStore = useFavoriteStore()

const property = ref<Property | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

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
    <div class="container-app py-6">
      <!-- Back button -->
      <div class="mb-6">
        <button
          @click="goBack"
          class="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回房源列表
        </button>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="bg-white rounded-xl shadow-md p-6">
        <ElSkeleton :rows="10" animated />
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="bg-white rounded-xl shadow-md p-12 text-center">
        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-gray-600 mb-4">{{ error }}</p>
        <ElButton type="primary" @click="goBack">返回首页</ElButton>
      </div>

      <!-- Property detail -->
      <div v-else-if="property" class="space-y-6">
        <!-- Image gallery -->
        <div class="bg-white rounded-xl shadow-md p-4">
          <ImageGallery
            :images="images"
            :title="property.projectName"
          />
        </div>

        <!-- Basic info -->
        <div class="bg-white rounded-xl shadow-md p-6">
          <div class="flex items-start justify-between mb-6">
            <div>
              <h1 class="text-2xl font-bold text-gray-800 mb-2">
                {{ property.projectName }}
              </h1>
              <p class="text-gray-600">{{ property.location }}</p>
            </div>
            <div class="flex items-center gap-3">
              <ElTag v-if="isAvailable" type="success" size="large">可租</ElTag>
              <ElTag v-else type="info" size="large">已满</ElTag>
            </div>
          </div>

          <ElDescriptions :column="2" border class="mb-6">
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
            <ElDescriptionsItem label="地址" :span="2">
              {{ property.location || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem v-if="property.latitude && property.longitude" label="坐标" :span="2">
              {{ property.latitude }}, {{ property.longitude }}
            </ElDescriptionsItem>
          </ElDescriptions>

          <!-- Action buttons -->
          <div class="flex flex-wrap items-center gap-4">
            <FavoriteButton
              v-if="property"
              :property="property"
              size="large"
              :show-text="true"
            />
            <ElButton
              :type="isInCompare ? 'primary' : 'default'"
              size="large"
              @click="handleToggleCompare"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {{ isInCompare ? '已添加对比' : '加入对比' }}
            </ElButton>
            <RouterLink to="/compare">
              <ElButton v-if="compareStore.compareList.length > 0" type="primary" size="large">
                查看对比 ({{ compareStore.compareList.length }})
              </ElButton>
            </RouterLink>
            <RouterLink to="/favorites">
              <ElButton v-if="favoriteStore.count > 0" type="danger" plain size="large">
                查看收藏 ({{ favoriteStore.count }})
              </ElButton>
            </RouterLink>
          </div>
        </div>

        <!-- Map placeholder (shows coordinates if available) -->
        <div v-if="property.latitude && property.longitude" class="bg-white rounded-xl shadow-md p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">位置信息</h2>
          <div class="bg-gray-100 rounded-lg p-4 text-center">
            <p class="text-gray-600 mb-2">经纬度坐标</p>
            <p class="font-mono text-gray-800">
              {{ property.latitude }}, {{ property.longitude }}
            </p>
            <a
              :href="`https://www.google.com/maps?q=${property.latitude},${property.longitude}`"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-800"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  </div>
</template>