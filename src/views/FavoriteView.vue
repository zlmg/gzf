<template>
  <div class="w-full min-h-screen p-4">
    <el-button @click="$router.back()" class="mb-4">
      <el-icon><ArrowLeft /></el-icon>
      返回列表
    </el-button>
    
    <h1 class="text-2xl font-bold mb-6 text-center">我的收藏</h1>
    
    <div v-if="favorites.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[1200px] mx-auto">
      <div
        v-for="item in favorites"
        :key="item.id"
        class="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="relative">
          <img :src="item.image" :alt="item.title" class="w-full h-48 object-cover" />
          <div class="absolute top-2 right-2">
            <el-button
              type="primary"
              circle
              @click="removeFavorite(item.id)"
            >
              <el-icon><Star /></el-icon>
            </el-button>
          </div>
        </div>
        <div class="p-4">
          <h3 class="text-lg font-semibold mb-2">{{ item.title }}</h3>
          <p class="text-gray-600 text-sm mb-3">{{ item.content }}</p>
          <div class="flex justify-between text-xs text-gray-500">
            <span>{{ formatDate(item.timestamp) }}</span>
            <el-button type="primary" size="small" @click="viewDetail(item.id)">
              查看详情
            </el-button>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="text-center py-12">
      <el-icon class="text-4xl text-gray-400 mb-4"><Star /></el-icon>
      <p class="text-gray-500 mb-4">暂无收藏房源</p>
      <el-button type="primary" @click="$router.push('/')">
        去浏览房源
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFavoriteStore } from '../stores/favorite'
import { ArrowLeft, Star } from '@element-plus/icons-vue'

const router = useRouter()
const favoriteStore = useFavoriteStore()

const favorites = computed(() => favoriteStore.favorites)

const removeFavorite = (id: string) => {
  favoriteStore.removeFavorite(id)
}

const viewDetail = (id: string) => {
  router.push(`/detail/${id}`)
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString()
}

onMounted(() => {
  favoriteStore.loadFavorites()
})
</script>

<style scoped>
</style>
