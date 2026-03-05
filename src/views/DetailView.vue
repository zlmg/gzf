<template>
  <div class="w-full min-h-screen p-4">
    <el-button @click="$router.back()" class="mb-4">
      <el-icon><ArrowLeft /></el-icon>
      返回列表
    </el-button>
    
    <div v-if="house" class="bg-white rounded-lg shadow-sm p-6">
      <!-- 基本信息 -->
      <h1 class="text-2xl font-bold mb-4">{{ house.projectName }}</h1>
      
      <!-- 图片轮播 -->
      <el-carousel :interval="5000" type="card" height="400px" class="mb-6">
        <el-carousel-item v-for="(img, index) in house.thumbnail.split(',')" :key="index">
          <img :src="getImageUrl(img)" :alt="house.projectName" class="w-full h-full object-cover" />
        </el-carousel-item>
      </el-carousel>
      
      <!-- 核心信息 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <p class="text-gray-600"><strong>地址：</strong>{{ house.location }}</p>
          <p class="text-gray-600"><strong>区域：</strong>{{ house.layout }}</p>
          <p class="text-gray-600"><strong>户型：</strong>{{ house.roomType }}室</p>
        </div>
        <div>
          <p class="text-gray-600"><strong>租金：</strong>{{ house.minRent }}-{{ house.maxRent }}元/月</p>
          <p class="text-gray-600"><strong>经度：</strong>{{ house.longitude }}</p>
          <p class="text-gray-600"><strong>纬度：</strong>{{ house.latitude }}</p>
        </div>
      </div>
      
      <!-- 设施配置 -->
      <div class="mb-6">
        <h2 class="text-xl font-semibold mb-3">设施配置</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div class="flex items-center">
            <el-icon class="mr-2"><House /></el-icon>
            <span>家具齐全</span>
          </div>
          <div class="flex items-center">
            <el-icon class="mr-2"><Sunny /></el-icon>
            <span>阳光充足</span>
          </div>
          <div class="flex items-center">
            <el-icon class="mr-2"><Star /></el-icon>
            <span>独立卫浴</span>
          </div>
          <div class="flex items-center">
            <el-icon class="mr-2"><Star /></el-icon>
            <span>厨房可用</span>
          </div>
        </div>
      </div>
      
      <!-- 周边环境 -->
      <div class="mb-6">
        <h2 class="text-xl font-semibold mb-3">周边环境</h2>
        <p class="text-gray-600">
          该房源位于{{ house.layout }}，交通便利，周边配套设施齐全，包括超市、学校、医院等。
        </p>
      </div>
      
      <!-- 操作按钮 -->
      <div class="flex justify-center mt-8 gap-4">
        <el-button type="primary" size="large" @click="addToCompare(house)" :disabled="isInCompare(house.projectNo)">
          {{ isInCompare(house.projectNo) ? '已加入对比' : '加入对比' }}
        </el-button>
        <el-button type="warning" size="large" @click="addToFavorite(house)">
          <el-icon v-if="isFavorite(house.projectNo)"><Star /></el-icon>
          {{ isFavorite(house.projectNo) ? '已收藏' : '收藏' }}
        </el-button>
        <el-button size="large" @click="goToFavorite">
          我的收藏
        </el-button>
      </div>
    </div>
    
    <div v-else class="text-center py-12">
      <el-icon class="text-4xl text-gray-400 mb-4"><InfoFilled /></el-icon>
      <p class="text-gray-500">房源信息加载中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHouseStore } from '../stores/house'
import { useFavoriteStore } from '../stores/favorite'
import { ArrowLeft, House, Sunny, Star, InfoFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const houseStore = useHouseStore()
const favoriteStore = useFavoriteStore()

const houseId = computed(() => route.params.id as string)

const house = computed(() => {
  return houseStore.houses.find(h => h.projectNo === houseId.value)
})

const addToCompare = (house: any) => {
  houseStore.addToCompare(house)
}

const isInCompare = (id: string) => {
  return houseStore.isInCompare(id)
}

const addToFavorite = (house: any) => {
  const success = favoriteStore.addFavorite(
    house.projectNo,
    house.projectName,
    house.location,
    getImageUrl(house.thumbnail.split(',')[0])
  )
  if (success) {
    ElMessage.success('收藏成功')
  } else {
    ElMessage.warning('已收藏')
  }
}

const isFavorite = (id: string) => {
  return favoriteStore.isFavorite(id)
}

const goToFavorite = () => {
  router.push('/favorite')
}

const getImageUrl = (path: string) => {
  return `https://www.bsgzf.com.cn${path}`
}

onMounted(() => {
  if (houseStore.houses.length === 0) {
    houseStore.loadHouses()
  }
  favoriteStore.loadFavorites()
})
</script>

<style scoped>
</style>
