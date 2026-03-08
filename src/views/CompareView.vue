<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElButton, ElEmpty, ElTag } from 'element-plus'
import { useCompareStore } from '@/stores/compare'
import { formatPriceRange, formatRoomType, formatOpenQueue, truncateText, formatArea, formatEquipmentList, formatLabelList, formatRoomTypeCode } from '@/utils/format'
import type { HouseType } from '@/types/property'

const router = useRouter()
const compareStore = useCompareStore()

const compareList = computed(() => compareStore.compareList)
const hasItems = computed(() => compareList.value.length > 0)

const handleRemove = (projectNo: string) => {
  compareStore.removeFromCompare(projectNo)
}

const handleClear = () => {
  compareStore.clearCompare()
}

const goToList = () => {
  router.push('/')
}

const goToDetail = (projectNo: string) => {
  router.push(`/property/${projectNo}`)
}

// 获取房源的所有房型（扁平化）
const getAllHouseTypes = (item: typeof compareList.value[0]): HouseType[] => {
  if (!item.roomTypeDetails || item.roomTypeDetails.length === 0) return []
  return item.roomTypeDetails.flatMap(detail => detail.houseTypeList || [])
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container-app py-4 md:py-6">
      <!-- Page header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-6">
        <div>
          <h1 class="text-xl md:text-2xl font-bold text-gray-800 mb-1 md:mb-2">房源对比</h1>
          <p class="text-sm md:text-base text-gray-600">
            已选择 <span class="font-semibold text-blue-600">{{ compareList.length }}</span> / 4 个房源进行对比
          </p>
        </div>
        <div class="flex items-center gap-2 md:gap-3">
          <ElButton v-if="hasItems" size="small" class="md:!size-default" @click="handleClear">
            清空全部
          </ElButton>
          <ElButton type="primary" size="small" class="md:!size-default" @click="goToList">
            添加更多房源
          </ElButton>
        </div>
      </div>

      <!-- Empty state -->
      <ElEmpty
        v-if="!hasItems"
        description="还没有选择要对比的房源"
        class="py-20"
      >
        <ElButton type="primary" @click="goToList">
          去选择房源
        </ElButton>
      </ElEmpty>

      <!-- Mobile: Card layout -->
      <div v-if="hasItems" class="md:hidden space-y-4">
        <div
          v-for="item in compareList"
          :key="item.projectNo"
          class="bg-white rounded-xl shadow-md overflow-hidden"
        >
          <!-- Card header with image -->
          <div class="aspect-video bg-gray-100 relative">
            <img
              v-if="item.images[0]"
              :src="item.images[0]"
              :alt="item.projectName"
              class="w-full h-full object-cover"
              @click="goToDetail(item.projectNo)"
            />
            <button
              @click="handleRemove(item.projectNo)"
              class="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-red-50 transition-colors"
            >
              <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Property info -->
          <div class="p-4">
            <h3
              class="font-semibold text-gray-800 mb-3 cursor-pointer hover:text-blue-600 transition-colors"
              @click="goToDetail(item.projectNo)"
            >
              {{ item.projectName }}
            </h3>

            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-500">月租金</span>
                <span class="text-red-600 font-semibold">{{ formatPriceRange(item.minRent, item.maxRent) }}</span>
              </div>

              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-500">区域</span>
                <ElTag size="small" type="info">{{ item.layout || '-' }}</ElTag>
              </div>

              <div class="pt-2 border-t border-gray-100">
                <span class="text-sm text-gray-500">地址</span>
                <p class="text-sm text-gray-700 mt-1">{{ item.location || '-' }}</p>
              </div>

              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-500">户型</span>
                <ElTag size="small" type="warning">{{ formatRoomType(item.roomType) }}</ElTag>
              </div>

              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-500">房屋类型</span>
                <span class="text-sm">{{ item.houseType || '-' }}</span>
              </div>

              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-500">房屋来源</span>
                <span class="text-sm">{{ item.houseSource || '-' }}</span>
              </div>

              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-500">总套数</span>
                <span class="text-sm">{{ item.totalCount || '-' }} 套</span>
              </div>

              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-500">总面积</span>
                <span class="text-sm">{{ item.totalArea || '-' }} m²</span>
              </div>

              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-500">可租数量</span>
                <ElTag size="small" :type="item.kezuCount > 0 ? 'success' : 'info'">
                  {{ item.kezuCount }} 套
                </ElTag>
              </div>

              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-500">开放状态</span>
                <span class="text-sm">{{ formatOpenQueue(item.openQueue) }}</span>
              </div>

              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-500">开放日期</span>
                <span class="text-sm">{{ item.openingDate || '-' }}</span>
              </div>

              <div v-if="item.textContent" class="pt-2 border-t border-gray-100">
                <span class="text-sm text-gray-500">项目介绍</span>
                <p class="text-sm text-gray-700 mt-1">{{ truncateText(item.textContent, 100) }}</p>
              </div>

              <!-- 房型详情 -->
              <div v-if="getAllHouseTypes(item).length > 0" class="pt-2 border-t border-gray-100">
                <span class="text-sm text-gray-500 block mb-2">房型详情</span>
                <div class="space-y-2">
                  <div
                    v-for="(house, hIdx) in getAllHouseTypes(item)"
                    :key="hIdx"
                    class="bg-gray-50 rounded-lg p-2"
                  >
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-sm font-medium text-gray-800">{{ house.houseTypeName || '-' }}</span>
                      <span class="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">{{ formatRoomTypeCode(house.roomType) }}</span>
                    </div>
                    <div class="flex items-center gap-2 text-xs text-gray-600 mb-1">
                      <span v-if="house.area">{{ formatArea(house.area) }}</span>
                      <span v-if="house.towards">{{ house.towards }}</span>
                    </div>
                    <div v-if="house.roomLabel && formatLabelList(house.roomLabel).length > 0" class="flex flex-wrap gap-1 mb-1">
                      <span
                        v-for="(label, lIdx) in formatLabelList(house.roomLabel)"
                        :key="lIdx"
                        class="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded"
                      >{{ label }}</span>
                    </div>
                    <div v-if="house.roomEquipment && formatEquipmentList(house.roomEquipment).length > 0" class="flex flex-wrap gap-1">
                      <span
                        v-for="(eq, eIdx) in formatEquipmentList(house.roomEquipment)"
                        :key="eIdx"
                        class="text-xs bg-gray-200 text-gray-600 px-1 py-0.5 rounded"
                      >{{ eq }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop: Comparison table -->
      <div v-if="hasItems" class="hidden md:block bg-white rounded-xl shadow-md overflow-hidden">
        <!-- Image row -->
        <div class="grid border-b border-gray-200" :style="{ gridTemplateColumns: `200px repeat(${compareList.length}, 1fr)` }">
          <div class="p-4 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
            图片
          </div>
          <div
            v-for="item in compareList"
            :key="item.projectNo"
            class="p-4 border-r border-gray-200 last:border-r-0"
          >
            <div class="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-3">
              <img
                v-if="item.images[0]"
                :src="item.images[0]"
                :alt="item.projectName"
                class="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                @click="goToDetail(item.projectNo)"
              />
            </div>
            <button
              @click="handleRemove(item.projectNo)"
              class="w-full text-sm text-red-600 hover:text-red-700 py-1"
            >
              移除
            </button>
          </div>
        </div>

        <!-- Project name row -->
        <div class="grid border-b border-gray-200" :style="{ gridTemplateColumns: `200px repeat(${compareList.length}, 1fr)` }">
          <div class="p-4 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
            项目名称
          </div>
          <div
            v-for="item in compareList"
            :key="item.projectNo"
            class="p-4 border-r border-gray-200 last:border-r-0"
          >
            <span
              class="font-medium text-gray-800 cursor-pointer hover:text-blue-600 transition-colors"
              @click="goToDetail(item.projectNo)"
            >
              {{ item.projectName }}
            </span>
          </div>
        </div>

        <!-- Rent row -->
        <div class="grid border-b border-gray-200" :style="{ gridTemplateColumns: `200px repeat(${compareList.length}, 1fr)` }">
          <div class="p-4 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
            月租金
          </div>
          <div
            v-for="item in compareList"
            :key="item.projectNo"
            class="p-4 border-r border-gray-200 last:border-r-0"
          >
            <span class="text-red-600 font-semibold">
              {{ formatPriceRange(item.minRent, item.maxRent) }}
            </span>
          </div>
        </div>

        <!-- Layout row -->
        <div class="grid border-b border-gray-200" :style="{ gridTemplateColumns: `200px repeat(${compareList.length}, 1fr)` }">
          <div class="p-4 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
            区域
          </div>
          <div
            v-for="item in compareList"
            :key="item.projectNo"
            class="p-4 border-r border-gray-200 last:border-r-0"
          >
            <ElTag type="info">{{ item.layout || '-' }}</ElTag>
          </div>
        </div>

        <!-- Location row -->
        <div class="grid border-b border-gray-200" :style="{ gridTemplateColumns: `200px repeat(${compareList.length}, 1fr)` }">
          <div class="p-4 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
            地址
          </div>
          <div
            v-for="item in compareList"
            :key="item.projectNo"
            class="p-4 border-r border-gray-200 last:border-r-0 text-gray-600"
          >
            {{ item.location || '-' }}
          </div>
        </div>

        <!-- Room type row -->
        <div class="grid border-b border-gray-200" :style="{ gridTemplateColumns: `200px repeat(${compareList.length}, 1fr)` }">
          <div class="p-4 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
            户型
          </div>
          <div
            v-for="item in compareList"
            :key="item.projectNo"
            class="p-4 border-r border-gray-200 last:border-r-0"
          >
            <ElTag type="warning">{{ formatRoomType(item.roomType) }}</ElTag>
          </div>
        </div>

        <!-- House type row -->
        <div class="grid border-b border-gray-200" :style="{ gridTemplateColumns: `200px repeat(${compareList.length}, 1fr)` }">
          <div class="p-4 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
            房屋类型
          </div>
          <div
            v-for="item in compareList"
            :key="item.projectNo"
            class="p-4 border-r border-gray-200 last:border-r-0"
          >
            {{ item.houseType || '-' }}
          </div>
        </div>

        <!-- House source row -->
        <div class="grid border-b border-gray-200" :style="{ gridTemplateColumns: `200px repeat(${compareList.length}, 1fr)` }">
          <div class="p-4 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
            房屋来源
          </div>
          <div
            v-for="item in compareList"
            :key="item.projectNo"
            class="p-4 border-r border-gray-200 last:border-r-0"
          >
            {{ item.houseSource || '-' }}
          </div>
        </div>

        <!-- Total count row -->
        <div class="grid border-b border-gray-200" :style="{ gridTemplateColumns: `200px repeat(${compareList.length}, 1fr)` }">
          <div class="p-4 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
            总套数
          </div>
          <div
            v-for="item in compareList"
            :key="item.projectNo"
            class="p-4 border-r border-gray-200 last:border-r-0"
          >
            {{ item.totalCount || '-' }} 套
          </div>
        </div>

        <!-- Total area row -->
        <div class="grid border-b border-gray-200" :style="{ gridTemplateColumns: `200px repeat(${compareList.length}, 1fr)` }">
          <div class="p-4 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
            总面积
          </div>
          <div
            v-for="item in compareList"
            :key="item.projectNo"
            class="p-4 border-r border-gray-200 last:border-r-0"
          >
            {{ item.totalArea || '-' }} m²
          </div>
        </div>

        <!-- Available count row -->
        <div class="grid border-b border-gray-200" :style="{ gridTemplateColumns: `200px repeat(${compareList.length}, 1fr)` }">
          <div class="p-4 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
            可租数量
          </div>
          <div
            v-for="item in compareList"
            :key="item.projectNo"
            class="p-4 border-r border-gray-200 last:border-r-0"
          >
            <ElTag :type="item.kezuCount > 0 ? 'success' : 'info'">
              {{ item.kezuCount }} 套
            </ElTag>
          </div>
        </div>

        <!-- Open status row -->
        <div class="grid border-b border-gray-200" :style="{ gridTemplateColumns: `200px repeat(${compareList.length}, 1fr)` }">
          <div class="p-4 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
            开放状态
          </div>
          <div
            v-for="item in compareList"
            :key="item.projectNo"
            class="p-4 border-r border-gray-200 last:border-r-0"
          >
            {{ formatOpenQueue(item.openQueue) }}
          </div>
        </div>

        <!-- Opening date row -->
        <div class="grid border-b border-gray-200" :style="{ gridTemplateColumns: `200px repeat(${compareList.length}, 1fr)` }">
          <div class="p-4 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
            开放日期
          </div>
          <div
            v-for="item in compareList"
            :key="item.projectNo"
            class="p-4 border-r border-gray-200 last:border-r-0"
          >
            {{ item.openingDate || '-' }}
          </div>
        </div>

        <!-- Location row -->
        <div class="grid border-b border-gray-200" :style="{ gridTemplateColumns: `200px repeat(${compareList.length}, 1fr)` }">
          <div class="p-4 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
            地址
          </div>
          <div
            v-for="item in compareList"
            :key="item.projectNo"
            class="p-4 border-r border-gray-200 last:border-r-0 text-gray-600"
          >
            {{ item.location || '-' }}
          </div>
        </div>

        <!-- Text content row -->
        <div class="grid border-b border-gray-200" :style="{ gridTemplateColumns: `200px repeat(${compareList.length}, 1fr)` }">
          <div class="p-4 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
            项目介绍
          </div>
          <div
            v-for="item in compareList"
            :key="item.projectNo"
            class="p-4 border-r border-gray-200 last:border-r-0 text-gray-600 text-sm"
          >
            {{ truncateText(item.textContent || '', 80) }}
          </div>
        </div>

        <!-- Room type details row -->
        <div class="grid" :style="{ gridTemplateColumns: `200px repeat(${compareList.length}, 1fr)` }">
          <div class="p-4 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
            房型详情
          </div>
          <div
            v-for="item in compareList"
            :key="item.projectNo"
            class="p-3 border-r border-gray-200 last:border-r-0"
          >
            <div v-if="getAllHouseTypes(item).length > 0" class="space-y-2">
              <div
                v-for="(house, hIdx) in getAllHouseTypes(item)"
                :key="hIdx"
                class="bg-gray-50 rounded-lg p-2"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-medium text-gray-800">{{ house.houseTypeName || '-' }}</span>
                  <span class="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">{{ formatRoomTypeCode(house.roomType) }}</span>
                </div>
                <div class="flex items-center gap-2 text-xs text-gray-600 mb-1">
                  <span v-if="house.area">{{ formatArea(house.area) }}</span>
                  <span v-if="house.towards">{{ house.towards }}</span>
                </div>
                <div v-if="house.roomLabel && formatLabelList(house.roomLabel).length > 0" class="flex flex-wrap gap-1 mb-1">
                  <span
                    v-for="(label, lIdx) in formatLabelList(house.roomLabel)"
                    :key="lIdx"
                    class="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded"
                  >{{ label }}</span>
                </div>
                <div v-if="house.roomEquipment && formatEquipmentList(house.roomEquipment).length > 0" class="flex flex-wrap gap-1">
                  <span
                    v-for="(eq, eIdx) in formatEquipmentList(house.roomEquipment)"
                    :key="eIdx"
                    class="text-xs bg-gray-200 text-gray-600 px-1 py-0.5 rounded"
                  >{{ eq }}</span>
                </div>
              </div>
            </div>
            <span v-else class="text-gray-400 text-sm">暂无房型信息</span>
          </div>
        </div>
      </div>

      <!-- Tips -->
      <div v-if="hasItems && compareList.length < 4" class="mt-4 md:mt-6 p-3 md:p-4 bg-blue-50 rounded-lg">
        <div class="flex items-center gap-2 text-blue-700">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-sm">最多可以对比 4 个房源，还可以添加 {{ 4 - compareList.length }} 个</span>
        </div>
      </div>
    </div>
  </div>
</template>