<template>
  <div class="w-full max-w-[1200px] mx-auto min-h-screen p-4">
    <h1 class="text-3xl font-bold mb-6 text-center">公租房房源列表</h1>

    <!-- 筛选条件 -->
    <div class="bg-gray-50 p-4 rounded-lg shadow-sm mb-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 区域筛选 -->
        <div>
          <label class="block text-sm font-medium mb-1">区域</label>
          <el-select
            v-model="filters.district"
            placeholder="请选择区域"
            clearable
          >
            <el-option
              v-for="district in districts"
              :key="district"
              :label="district"
              :value="district"
            />
          </el-select>
        </div>

        <!-- 价格区间筛选 -->
        <div>
          <label class="block text-sm font-medium mb-1">价格区间</label>
          <el-slider
            v-model="priceRange"
            range
            :min="0"
            :max="6000"
            :step="100"
          />
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>{{ priceRange[0] }}元</span>
            <span>{{ priceRange[1] }}元</span>
          </div>
        </div>

        <!-- 户型筛选 -->
        <div>
          <label class="block text-sm font-medium mb-1">户型</label>
          <el-select
            v-model="filters.roomType"
            placeholder="请选择户型"
            clearable
          >
            <el-option
              v-for="type in roomTypes"
              :key="type"
              :label="type + '室'"
              :value="type"
            />
          </el-select>
        </div>

        <!-- 排序 -->
        <div>
          <label class="block text-sm font-medium mb-1">排序</label>
          <el-select v-model="sortBy" placeholder="请选择排序方式">
            <el-option value="price_asc" label="价格从低到高" />
            <el-option value="price_desc" label="价格从高到低" />
          </el-select>
        </div>
      </div>

      <!-- 筛选按钮 -->
      <div class="mt-4 flex justify-end">
        <el-button type="primary" @click="applyFilters">应用筛选</el-button>
        <el-button @click="resetFilters" class="ml-2">重置</el-button>
      </div>
    </div>

    <!-- 房源列表 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div
        v-for="house in paginatedHouses"
        :key="house.projectNo"
        class="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="relative">
          <img
            :src="getImageUrl(house.thumbnail.split(',')[0])"
            :alt="house.projectName"
            class="w-full h-48 object-cover"
          />
          <div
            class="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded"
          >
            {{ house.minRent }}-{{ house.maxRent }}元/月
          </div>
        </div>
        <div class="p-4">
          <h3 class="text-lg font-semibold mb-2">{{ house.projectName }}</h3>
          <p class="text-gray-600 text-sm mb-2">{{ house.location }}</p>
          <div class="flex justify-between text-sm text-gray-500 mb-3">
            <span>区域：{{ house.layout }}</span>
            <span>户型：{{ house.roomType }}室</span>
          </div>
          <div class="flex justify-between">
            <el-button
              type="primary"
              size="small"
              @click="viewDetail(house.projectNo)"
            >
              查看详情
            </el-button>
            <el-button
              size="small"
              @click="addToCompare(house)"
              :disabled="isInCompare(house.projectNo)"
            >
              {{ isInCompare(house.projectNo) ? "已加入对比" : "加入对比" }}
            </el-button>
            <el-button
              type="warning"
              size="small"
              @click="addToFavorite(house)"
              :icon="isFavorite(house.projectNo) ? Star : ''"
            >
              {{ isFavorite(house.projectNo) ? "已收藏" : "收藏" }}
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="mt-8 flex justify-center">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[12, 24, 36]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filteredHouses.length"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 操作按钮组 -->
    <div class="fixed bottom-6 right-6 flex flex-col gap-3">
      <el-button
        type="primary"
        round
        @click="goToCompare"
        :disabled="compareList.length === 0"
      >
        <el-icon><DataAnalysis /></el-icon>
        对比 ({{ compareList.length }}/4)
      </el-button>
      <el-button type="warning" round @click="goToFavorite">
        <el-icon><Star /></el-icon>
        收藏
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useHouseStore } from "../stores/house";
import { useFavoriteStore } from "../stores/favorite";
import { DataAnalysis, Star } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

const router = useRouter();
const houseStore = useHouseStore();
const favoriteStore = useFavoriteStore();

// 筛选条件
const filters = ref({
  district: "",
  roomType: "",
});

const priceRange = ref([0, 6000]);
const sortBy = ref("");

// 分页
const currentPage = ref(1);
const pageSize = ref(12);

// 计算属性
const houses = computed(() => houseStore.houses);
const compareList = computed(() => houseStore.compareList);

// 区域列表
const districts = computed(() => {
  const districtSet = new Set(houses.value.map((house) => house.layout));
  return Array.from(districtSet);
});

// 户型列表
const roomTypes = computed(() => {
  const typeSet = new Set<string>();
  houses.value.forEach((house) => {
    house.roomType.split(",").forEach((type) => {
      typeSet.add(type);
    });
  });
  return Array.from(typeSet).sort();
});

// 筛选后的房源
const filteredHouses = computed(() => {
  let result = [...houses.value];

  // 区域筛选
  if (filters.value.district) {
    result = result.filter((house) => house.layout === filters.value.district);
  }

  // 价格筛选
  result = result.filter((house) => {
    return (
      house.minRent >= priceRange.value[0] &&
      house.maxRent <= priceRange.value[1]
    );
  });

  // 户型筛选
  if (filters.value.roomType) {
    result = result.filter((house) => {
      return house.roomType.split(",").includes(filters.value.roomType);
    });
  }

  // 排序
  if (sortBy.value === "price_asc") {
    result.sort((a, b) => a.minRent - b.minRent);
  } else if (sortBy.value === "price_desc") {
    result.sort((a, b) => b.minRent - a.minRent);
  }

  return result;
});

// 分页后的房源
const paginatedHouses = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredHouses.value.slice(start, end);
});

// 方法
const applyFilters = () => {
  currentPage.value = 1;
};

const resetFilters = () => {
  filters.value = {
    district: "",
    roomType: "",
  };
  priceRange.value = [0, 6000];
  sortBy.value = "";
  currentPage.value = 1;
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
};

const handleCurrentChange = (current: number) => {
  currentPage.value = current;
};

const viewDetail = (id: string) => {
  router.push(`/detail/${id}`);
};

const addToCompare = (house: any) => {
  houseStore.addToCompare(house);
};

const isInCompare = (id: string) => {
  return houseStore.isInCompare(id);
};

const goToCompare = () => {
  router.push("/compare");
};

const getImageUrl = (path: string) => {
  return `https://www.bsgzf.com.cn${path}`;
};

const addToFavorite = (house: any) => {
  const success = favoriteStore.addFavorite(
    house.projectNo,
    house.projectName,
    house.location,
    getImageUrl(house.thumbnail.split(",")[0]),
  );
  if (success) {
    ElMessage.success("收藏成功");
  } else {
    ElMessage.warning("已收藏");
  }
};

const isFavorite = (id: string) => {
  return favoriteStore.isFavorite(id);
};

const goToFavorite = () => {
  router.push("/favorite");
};

// 初始化
onMounted(() => {
  houseStore.loadHouses();
  favoriteStore.loadFavorites();
});
</script>

<style scoped></style>
