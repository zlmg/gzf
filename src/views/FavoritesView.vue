<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElButton, ElEmpty } from 'element-plus'
import { useFavoriteStore } from '@/stores/favorite'
import { formatPriceRange, formatRoomType, formatOpenQueue } from '@/utils/format'

const router = useRouter()
const favoriteStore = useFavoriteStore()

const hasFavorites = computed(() => favoriteStore.favorites.length > 0)

const goToDetail = (projectNo: string) => {
  router.push(`/property/${projectNo}`)
}

const handleRemove = (projectNo: string) => {
  favoriteStore.removeFromFavorites(projectNo)
}

const handleClearAll = () => {
  if (confirm('确定要清空所有收藏吗？此操作不可撤销。')) {
    favoriteStore.clearAllFavorites()
  }
}

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-6">
      <!-- Page header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 mb-2">我的收藏</h1>
          <p class="text-gray-600">
            共 <span class="font-semibold text-red-600">{{ favoriteStore.count }}</span> 个收藏房源
          </p>
        </div>
        <div v-if="hasFavorites" class="flex items-center gap-3">
          <ElButton @click="handleClearAll" type="danger" plain>
            清空全部
          </ElButton>
        </div>
      </div>

      <!-- Empty state -->
      <ElEmpty
        v-if="!hasFavorites"
        description="暂无收藏房源"
        class="py-20"
      >
        <ElButton type="primary" @click="router.push('/')">
          去浏览房源
        </ElButton>
      </ElEmpty>

      <!-- Favorites list -->
      <div v-else class="space-y-4">
        <TransitionGroup name="list">
          <div
            v-for="item in favoriteStore.favorites"
            :key="item.projectNo"
            class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div class="flex flex-col md:flex-row">
              <!-- Image -->
              <div class="md:w-48 h-36 md:h-auto flex-shrink-0 bg-gray-100 relative">
                <img
                  v-if="item.thumbnail"
                  :src="favoriteStore.getThumbnailUrl(item.thumbnail)"
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
                    <h3 class="text-lg font-semibold text-gray-800 mb-2 hover:text-blue-600 transition-colors">
                      {{ item.projectName }}
                    </h3>
                    <p class="text-sm text-gray-500 mb-3">{{ item.location }}</p>
                    <div class="flex flex-wrap items-center gap-2 mb-3">
                      <span class="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
                        {{ item.layout || '未知区域' }}
                      </span>
                      <span class="px-2 py-1 bg-purple-50 text-purple-700 rounded text-sm">
                        {{ formatRoomType(item.roomType) }}
                      </span>
                      <span class="px-2 py-1 bg-orange-50 text-orange-700 rounded text-sm">
                        可租: {{ item.kezuCount }}
                      </span>
                    </div>
                  </div>
                  <div class="ml-4 text-right">
                    <div class="text-xl font-bold text-red-600 mb-2">
                      {{ formatPriceRange(item.minRent, item.maxRent) }}/月
                    </div>
                    <ElButton
                      type="danger"
                      plain
                      size="small"
                      @click.stop="handleRemove(item.projectNo)"
                    >
                      移除
                    </ElButton>
                  </div>
                </div>
                <div class="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                  <span class="text-xs text-gray-400">
                    收藏时间: {{ formatDate(item.addedAt) }}
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
      <div v-if="hasFavorites" class="mt-6 p-4 bg-blue-50 rounded-lg">
        <div class="flex items-center gap-2 text-blue-700">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>收藏数据保存在浏览器本地，清除浏览器数据后将会丢失</span>
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
</style>