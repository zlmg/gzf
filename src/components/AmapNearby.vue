<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { usePoiCache, type PoiItem } from '@/composables/usePoiCache'

interface Props {
  latitude: string | number
  longitude: string | number
  propertyName?: string
}

const props = defineProps<Props>()

// 缓存工具
const { getCached, setCached } = usePoiCache()

// 加载状态
const loading = ref(true)
// 刷新状态（用于区分首次加载和刷新）
const isRefreshing = ref(false)

// 距离筛选选项 (单位: 米)
const DISTANCE_OPTIONS = [
  { label: '0.5km', value: 500 },
  { label: '1km', value: 1000 },
  { label: '1.5km', value: 1500 },
  { label: '2km', value: 2000 },
  { label: '3km', value: 3000 },
  { label: '5km', value: 5000 },
  { label: '10km', value: 10000 },
  { label: '20km', value: 20000 },
]

// 当前选择的距离范围
const selectedRadius = ref(3000)

// POI 分类配置 (使用高德 POI 类型编码)
const POI_TYPES = [
  { key: 'subway', name: '地铁', types: '150500', keywords: '地铁站', icon: '🚇' },
  { key: 'bus', name: '公交', types: '150700', keywords: '公交站', icon: '🚌' },
  { key: 'mall', name: '购物中心', types: '060101', keywords: '', icon: '🏬' },
  { key: 'shopping', name: '商场', types: '060100', keywords: '', icon: '🛍️' },
  { key: 'supermarket', name: '超市', types: '060400', keywords: '', icon: '🛒' },
  { key: 'convenience', name: '便利店', types: '060200', keywords: '', icon: '🏪' },
  { key: 'market', name: '综合市场', types: '060700', keywords: '', icon: '🏬' },
  { key: 'food', name: '餐饮', types: '050000', keywords: '', icon: '🍽️' },
  { key: 'park', name: '公园广场', types: '110100', keywords: '', icon: '🌳' },
  { key: 'government', name: '政府机构', types: '130000', keywords: '', icon: '🏛️' },
  { key: 'gym', name: '健身', types: '080111', keywords: '', icon: '🏋️' },
  { key: 'sports', name: '体育', types: '080000', keywords: '', icon: '⚽' },
  { key: 'education', name: '教育', types: '141200', keywords: '', icon: '🎓' },
  { key: 'medical', name: '医疗', types: '090100|090200|090300', keywords: '', icon: '🏥' },
  { key: 'cinema', name: '影院', types: '080600|080601|080602', keywords: '', icon: '🎬' },
  { key: 'entertainment', name: '娱乐', types: '080000|080100|080200|080300|080400', keywords: '', icon: '🎮' },
  { key: 'charging', name: '充电站', types: '011100', keywords: '', icon: '🔋' },
  { key: 'transport', name: '火车站', types: '150200', keywords: '火车站', icon: '🚅' },
  { key: 'bank', name: '银行', types: '160100', keywords: '', icon: '🏦' },
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
  charging: [],
  food: [],
  shopping: [],
  supermarket: [],
  convenience: [],
  market: [],
  park: [],
  government: [],
  transport: [],
  bank: [],
})

// 根据距离筛选后的 POI 列表
const filteredPoiList = computed(() => {
  const list = poiData.value[activeCategory.value] || []
  return list.filter(poi => Number(poi.distance) <= selectedRadius.value)
})

// 搜索周边 POI
const searchPOI = async (category: string, radius?: number, forceRefresh = false) => {
  activeCategory.value = category
  loading.value = true

  const poiConfig = POI_TYPES.find(p => p.key === category)
  if (!poiConfig) return

  // 使用传入的半径或当前选择的半径，取最大值5km
  const searchRadius = radius || selectedRadius.value || 3000
  const location = `${props.longitude},${props.latitude}`

  // 非强制刷新时，先检查缓存
  if (!forceRefresh) {
    const cached = getCached(props.latitude, props.longitude, category, searchRadius)
    if (cached) {
      poiData.value[category] = cached.pois
      loading.value = false
      return
    }
  }

  try {
    const key = import.meta.env.VITE_AMAP_KEY

    const response = await fetch(
      `https://restapi.amap.com/v3/place/around?key=${key}&location=${location}&keywords=${poiConfig.keywords}&types=${poiConfig.types}&radius=${searchRadius}&offset=25&page=1&extensions=all`
    )

    const result = await response.json()
    loading.value = false
    isRefreshing.value = false

    if (result.status === '1' && result.pois && result.pois.length > 0) {
      const pois: PoiItem[] = result.pois.map((poi: any) => ({
        id: poi.id,
        name: poi.name,
        address: poi.address,
        distance: poi.distance,
        type: poi.type,
        location: poi.location,
        tel: poi.tel,
      }))

      poiData.value[category] = pois

      // 保存到缓存
      setCached(
        props.latitude,
        props.longitude,
        category,
        searchRadius,
        pois,
        searchRadius,
        location
      )
    } else {
      poiData.value[category] = []
    }
  } catch (e) {
    loading.value = false
    isRefreshing.value = false
    console.error('POI search error:', e)
    poiData.value[category] = []
  }
}

// 刷新当前分类数据
const refreshCurrentCategory = () => {
  isRefreshing.value = true
  searchPOI(activeCategory.value, selectedRadius.value, true)
}

// 切换距离筛选
const changeRadius = (radius: number) => {
  selectedRadius.value = radius
  // 如果当前分类数据为空或需要更大范围的搜索，重新请求
  const currentData = poiData.value[activeCategory.value] || []
  const needRefetch = currentData.length === 0 ||
    currentData.some((poi: any) => radius > selectedRadius.value && Number(poi.distance) > 3000)

  if (needRefetch || radius > 3000) {
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
      <button v-for="cat in POI_TYPES" :key="cat.key" @click="searchPOI(cat.key)" :class="[
        'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
        activeCategory === cat.key
          ? 'bg-blue-500 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      ]">
        <span class="mr-1">{{ cat.icon }}</span>
        {{ cat.name }}
      </button>
    </div>

    <!-- 距离筛选 -->
    <div class="flex items-center gap-2 mb-4 flex-wrap">
      <span class="text-xs text-gray-500">范围:</span>
      <div class="flex flex-wrap gap-1">
        <button v-for="opt in DISTANCE_OPTIONS" :key="opt.value" @click="changeRadius(opt.value)" :class="[
          'px-2 py-1 rounded text-xs font-medium transition-colors',
          selectedRadius === opt.value
            ? 'bg-blue-100 text-blue-700 border border-blue-300'
            : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
        ]">
          {{ opt.label }}
        </button>
      </div>
      <!-- 刷新按钮 -->
      <button
        @click="refreshCurrentCategory"
        :disabled="loading"
        class="ml-auto p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="刷新当前分类数据"
      >
        <svg
          :class="['w-4 h-4', isRefreshing && 'animate-spin']"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>



    <!-- POI 列表 -->
    <div class="bg-gray-50 rounded-lg p-3 h-120 overflow-y-auto">
      <div v-if="loading" class="flex items-center justify-center h-32">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>

      <div v-else-if="filteredPoiList.length === 0" class="flex items-center justify-center h-32 text-gray-500 text-sm">
        暂无周边设施数据
      </div>

      <template v-else>
        <!-- 项目数量统计 -->
        <div class="text-xs text-gray-500 mb-2 font-medium">
          共 {{ filteredPoiList.length }} 个结果
        </div>
        <ul class="space-y-1.5">
          <li v-for="(poi, index) in filteredPoiList" :key="poi.id || index" @click="openInAmap(poi)"
            class="px-3 py-2 bg-white rounded-lg hover:bg-blue-50 cursor-pointer transition-colors border border-gray-100 hover:border-blue-200">
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
      </template>
    </div>

    <!-- 提示 -->
    <p class="text-xs text-gray-400 mt-3 text-center">
      点击设施可在高德地图中查看详情
    </p>
  </div>
</template>