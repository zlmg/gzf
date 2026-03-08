<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'

interface Props {
  latitude: string | number
  longitude: string | number
  propertyName?: string
}

const props = defineProps<Props>()

// 加载状态
const loading = ref(true)

// 距离筛选选项 (单位: 米)
const DISTANCE_OPTIONS = [
  { label: '0.5km', value: 500 },
  { label: '1km', value: 1000 },
  { label: '2km', value: 2000 },
  { label: '3km', value: 3000 },
  { label: '5km', value: 5000 },
]

// 当前选择的距离范围
const selectedRadius = ref(1500)

// POI 分类配置 (使用高德 POI 类型编码)
const POI_TYPES = [
  { key: 'subway', name: '地铁', types: '150500|150700', keywords: '地铁站', icon: '🚇' },
  { key: 'bus', name: '公交', types: '', keywords: '公交站', icon: '🚌' },
  { key: 'mall', name: '购物中心', types: '060101', keywords: '', icon: '🏬' },
  { key: 'education', name: '教育', types: '141200', keywords: '', icon: '🎓' },
  { key: 'medical', name: '医疗', types: '090100|090200|090300', keywords: '', icon: '🏥' },
  { key: 'cinema', name: '影院', types: '060600', keywords: '', icon: '🎬' },
  { key: 'gym', name: '健身', types: '080500', keywords: '', icon: '🏋️' },
  { key: 'entertainment', name: '娱乐', types: '080000|080100|080200|080300|080400', keywords: '', icon: '🎮' },
  { key: 'sports', name: '体育', types: '080600|080601|080602', keywords: '', icon: '⚽' },
]

// 当前选中的分类
const activeCategory = ref('subway')

// POI 数据
const poiData = ref<Record<string, any[]>>({
  subway: [],
  bus: [],
  education: [],
  medical: [],
  mall: [],
  cinema: [],
  gym: [],
  entertainment: [],
  sports: [],
})

// 根据距离筛选后的 POI 列表
const filteredPoiList = computed(() => {
  const list = poiData.value[activeCategory.value] || []
  return list.filter(poi => Number(poi.distance) <= selectedRadius.value)
})

// 搜索周边 POI
const searchPOI = async (category: string, radius?: number) => {
  activeCategory.value = category
  loading.value = true

  const poiConfig = POI_TYPES.find(p => p.key === category)
  if (!poiConfig) return

  try {
    const key = import.meta.env.VITE_AMAP_KEY
    const location = `${props.longitude},${props.latitude}`
    // 使用传入的半径或当前选择的半径，取最大值5km
    const searchRadius = Math.min(radius || selectedRadius.value, 5000)

    const response = await fetch(
      `https://restapi.amap.com/v3/place/around?key=${key}&location=${location}&keywords=${poiConfig.keywords}&types=${poiConfig.types}&radius=${searchRadius}&offset=25&page=1&extensions=all`
    )

    const result = await response.json()
    loading.value = false

    if (result.status === '1' && result.pois && result.pois.length > 0) {
      poiData.value[category] = result.pois.map((poi: any) => ({
        id: poi.id,
        name: poi.name,
        address: poi.address,
        distance: poi.distance,
        type: poi.type,
        location: poi.location,
        tel: poi.tel,
      }))
    } else {
      poiData.value[category] = []
    }
  } catch (e) {
    loading.value = false
    console.error('POI search error:', e)
    poiData.value[category] = []
  }
}

// 切换距离筛选
const changeRadius = (radius: number) => {
  selectedRadius.value = radius
  // 如果当前分类数据为空或需要更大范围的搜索，重新请求
  const currentData = poiData.value[activeCategory.value] || []
  const needRefetch = currentData.length === 0 ||
    currentData.some((poi: any) => radius > selectedRadius.value && Number(poi.distance) > 1500)

  if (needRefetch || radius > 1500) {
    searchPOI(activeCategory.value, radius)
  }
}

// 打开高德地图查看位置
const openInAmap = (poi?: any) => {
  const lat = poi ? poi.location.split(',')[1] : props.latitude
  const lng = poi ? poi.location.split(',')[0] : props.longitude
  const name = poi ? poi.name : props.propertyName || '房源位置'

  // 高德地图 Web 版链接
  const url = `https://uri.amap.com/marker?position=${lng},${lat}&name=${encodeURIComponent(name)}&coordinate=gaode`
  window.open(url, '_blank')
}

// 初始化
onMounted(() => {
  searchPOI('subway', selectedRadius.value)
})

// 监听分类切换
watch(activeCategory, (newCategory) => {
  searchPOI(newCategory, selectedRadius.value)
})
</script>

<template>
  <div class="nearby-facilities">
    <!-- 分类选择 -->
    <div class="flex flex-wrap gap-2 mb-3">
      <button
        v-for="cat in POI_TYPES"
        :key="cat.key"
        @click="searchPOI(cat.key)"
        :class="[
          'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
          activeCategory === cat.key
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        ]"
      >
        <span class="mr-1">{{ cat.icon }}</span>
        {{ cat.name }}
      </button>
    </div>

    <!-- 距离筛选 -->
    <div class="flex items-center gap-2 mb-4 flex-wrap">
      <span class="text-xs text-gray-500">范围:</span>
      <div class="flex flex-wrap gap-1">
        <button
          v-for="opt in DISTANCE_OPTIONS"
          :key="opt.value"
          @click="changeRadius(opt.value)"
          :class="[
            'px-2 py-1 rounded text-xs font-medium transition-colors',
            selectedRadius === opt.value
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
          ]"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- 地图链接卡片 -->
    <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 mb-4 border border-blue-100">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p class="font-medium text-gray-800 text-sm">查看地图位置</p>
            <p class="text-xs text-gray-500">{{ latitude }}, {{ longitude }}</p>
          </div>
        </div>
        <button
          @click="openInAmap()"
          class="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          打开地图
        </button>
      </div>
    </div>

    <!-- POI 列表 -->
    <div class="bg-gray-50 rounded-lg p-3 max-h-80 overflow-y-auto">
      <div v-if="loading" class="flex items-center justify-center h-32">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>

      <div v-else-if="filteredPoiList.length === 0" class="flex items-center justify-center h-32 text-gray-500 text-sm">
        暂无周边设施数据
      </div>

      <ul v-else class="space-y-1.5">
        <li
          v-for="(poi, index) in filteredPoiList"
          :key="poi.id || index"
          @click="openInAmap(poi)"
          class="px-3 py-2 bg-white rounded-lg hover:bg-blue-50 cursor-pointer transition-colors border border-gray-100 hover:border-blue-200"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="flex-1 min-w-0">
              <h4 class="font-medium text-gray-800 text-sm truncate">{{ poi.name }}</h4>
              <p v-if="poi.address" class="text-xs text-gray-500 truncate">{{ poi.address }}</p>
            </div>
            <span class="text-xs text-blue-600 font-medium whitespace-nowrap bg-blue-50 px-2 py-0.5 rounded">
              {{ poi.distance }}m
            </span>
          </div>
        </li>
      </ul>
    </div>

    <!-- 提示 -->
    <p class="text-xs text-gray-400 mt-3 text-center">
      点击设施可在高德地图中查看详情
    </p>
  </div>
</template>