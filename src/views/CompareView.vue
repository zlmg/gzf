<template>
  <div class="w-full min-h-screen p-4">
    <el-button @click="$router.back()" class="mb-4">
      <el-icon><ArrowLeft /></el-icon>
      返回列表
    </el-button>
    
    <h1 class="text-2xl font-bold mb-6 text-center">房源对比</h1>
    
    <div v-if="compareList.length > 0" class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-gray-100">
            <th class="border p-3 text-left">对比项</th>
            <th v-for="house in compareList" :key="house.projectNo" class="border p-3 text-center">
              <div class="relative">
                <h3 class="font-semibold">{{ house.projectName }}</h3>
                <el-button type="text" size="small" @click="removeFromCompare(house.projectNo)" class="absolute top-0 right-0">
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <!-- 图片 -->
          <tr>
            <td class="border p-3 font-medium">图片</td>
            <td v-for="house in compareList" :key="house.projectNo" class="border p-3 text-center">
              <img :src="getImageUrl(house.thumbnail.split(',')[0])" :alt="house.projectName" class="w-40 h-30 object-cover mx-auto" />
            </td>
          </tr>
          <!-- 地址 -->
          <tr>
            <td class="border p-3 font-medium">地址</td>
            <td v-for="house in compareList" :key="house.projectNo" class="border p-3">{{ house.location }}</td>
          </tr>
          <!-- 区域 -->
          <tr>
            <td class="border p-3 font-medium">区域</td>
            <td v-for="house in compareList" :key="house.projectNo" class="border p-3">{{ house.layout }}</td>
          </tr>
          <!-- 户型 -->
          <tr>
            <td class="border p-3 font-medium">户型</td>
            <td v-for="house in compareList" :key="house.projectNo" class="border p-3">{{ house.roomType }}室</td>
          </tr>
          <!-- 租金 -->
          <tr>
            <td class="border p-3 font-medium">租金</td>
            <td v-for="house in compareList" :key="house.projectNo" class="border p-3">{{ house.minRent }}-{{ house.maxRent }}元/月</td>
          </tr>
          <!-- 操作 -->
          <tr>
            <td class="border p-3 font-medium">操作</td>
            <td v-for="house in compareList" :key="house.projectNo" class="border p-3 text-center">
              <el-button type="primary" size="small" @click="viewDetail(house.projectNo)">
                查看详情
              </el-button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div v-else class="text-center py-12">
      <el-icon class="text-4xl text-gray-400 mb-4"><InfoFilled /></el-icon>
      <p class="text-gray-500 mb-4">暂无对比房源</p>
      <el-button type="primary" @click="$router.push('/')">
        去选择房源
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useHouseStore } from '../stores/house'
import { ArrowLeft, Close, InfoFilled } from '@element-plus/icons-vue'

const router = useRouter()
const houseStore = useHouseStore()

const compareList = computed(() => houseStore.compareList)

const removeFromCompare = (id: string) => {
  houseStore.removeFromCompare(id)
}

const viewDetail = (id: string) => {
  router.push(`/detail/${id}`)
}

const getImageUrl = (path: string) => {
  return `https://www.bsgzf.com.cn${path}`
}
</script>

<style scoped>
</style>
