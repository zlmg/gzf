<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElButton, ElEmpty, ElTag } from 'element-plus'
import { useCompareStore } from '@/stores/compare'
import { formatPriceRange, formatRoomType, formatOpenQueue } from '@/utils/format'

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
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container-app py-6">
      <!-- Page header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 mb-2">房源对比</h1>
          <p class="text-gray-600">
            已选择 <span class="font-semibold text-blue-600">{{ compareList.length }}</span> / 4 个房源进行对比
          </p>
        </div>
        <div class="flex items-center gap-3">
          <ElButton v-if="hasItems" @click="handleClear">
            清空全部
          </ElButton>
          <ElButton type="primary" @click="goToList">
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

      <!-- Comparison table -->
      <div v-else class="bg-white rounded-xl shadow-md overflow-hidden">
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

        <!-- Location row -->
        <div class="grid" :style="{ gridTemplateColumns: `200px repeat(${compareList.length}, 1fr)` }">
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
      </div>

      <!-- Tips -->
      <div v-if="hasItems && compareList.length < 4" class="mt-6 p-4 bg-blue-50 rounded-lg">
        <div class="flex items-center gap-2 text-blue-700">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>最多可以对比 4 个房源，还可以添加 {{ 4 - compareList.length }} 个</span>
        </div>
      </div>
    </div>
  </div>
</template>