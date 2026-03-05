<template>
  <div class="w-full min-h-screen p-4">
    <el-button @click="$router.back()" class="mb-4">
      <el-icon><ArrowLeft /></el-icon>
      返回列表
    </el-button>

    <h1 class="text-2xl font-bold mb-6 text-center">房源对比</h1>

    <div v-if="compareList.length > 0">
      <!-- 对比表格 -->
      <div class="overflow-x-auto">
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-gray-100">
              <th class="border p-3 text-left">对比项</th>
              <th
                v-for="house in compareList"
                :key="house.projectNo"
                class="border p-3 text-center"
              >
                <div class="relative">
                  <h3 class="font-semibold">{{ house.projectName }}</h3>
                  <el-button
                    type="text"
                    size="small"
                    @click="removeFromCompare(house.projectNo)"
                    class="absolute top-0 right-0"
                  >
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
              <td
                v-for="house in compareList"
                :key="house.projectNo"
                class="border p-3 text-center"
              >
                <img
                  :src="getImageUrl(house.thumbnail.split(',')[0])"
                  :alt="house.projectName"
                  class="w-40 h-30 object-cover mx-auto"
                />
              </td>
            </tr>
            <!-- 地址 -->
            <tr>
              <td class="border p-3 font-medium">地址</td>
              <td
                v-for="house in compareList"
                :key="house.projectNo"
                class="border p-3"
              >
                {{ house.location }}
              </td>
            </tr>
            <!-- 区域 -->
            <tr>
              <td class="border p-3 font-medium">区域</td>
              <td
                v-for="house in compareList"
                :key="house.projectNo"
                class="border p-3"
              >
                {{ house.layout }}
              </td>
            </tr>
            <!-- 户型 -->
            <tr>
              <td class="border p-3 font-medium">户型</td>
              <td
                v-for="house in compareList"
                :key="house.projectNo"
                class="border p-3"
              >
                {{ house.roomType }}室
              </td>
            </tr>
            <!-- 租金 -->
            <tr>
              <td class="border p-3 font-medium">租金</td>
              <td
                v-for="house in compareList"
                :key="house.projectNo"
                class="border p-3"
              >
                {{ house.minRent }}-{{ house.maxRent }}元/月
              </td>
            </tr>
            <!-- 可租套数 -->
            <tr>
              <td class="border p-3 font-medium">可租套数</td>
              <td
                v-for="house in compareList"
                :key="house.projectNo"
                class="border p-3"
                :class="
                  house.kezuCount > 0
                    ? 'text-green-600 font-medium'
                    : 'text-gray-400'
                "
              >
                {{ house.kezuCount }}套
              </td>
            </tr>
            <!-- 操作 -->
            <tr>
              <td class="border p-3 font-medium">操作</td>
              <td
                v-for="house in compareList"
                :key="house.projectNo"
                class="border p-3 text-center"
              >
                <el-button
                  type="primary"
                  size="small"
                  @click="viewDetail(house.projectNo)"
                >
                  查看详情
                </el-button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 对比说明 -->
      <div class="mt-8 bg-gray-50 p-4 rounded-lg">
        <h2 class="text-xl font-semibold mb-3">对比分析</h2>
        <div class="text-gray-700">
          <p class="mb-2"><strong>可租套数分析：</strong></p>
          <ul class="list-disc pl-5 space-y-1">
            <li>可租套数反映了房源的供应情况，套数越多表示供应越充足</li>
            <li>当可租套数为0时，表示该房源当前无可用单元</li>
            <li>
              可租套数与租金水平通常呈负相关关系：供应充足时租金相对稳定，供应紧张时租金可能上涨
            </li>
            <li>
              建议结合区域和户型等因素综合考虑，选择可租套数合理且符合自身需求的房源
            </li>
          </ul>
          <p class="mt-3"><strong>市场供需关系影响：</strong></p>
          <ul class="list-disc pl-5 space-y-1">
            <li>可租套数较多的区域通常表示供大于求，租客有更多选择空间</li>
            <li>可租套数较少的区域可能存在供不应求的情况，需要尽快做出决策</li>
            <li>租金价格与可租套数的组合可以帮助判断房源的性价比和竞争程度</li>
          </ul>
        </div>
      </div>
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
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useHouseStore } from "../stores/house";
import { ArrowLeft, Close, InfoFilled } from "@element-plus/icons-vue";

const router = useRouter();
const houseStore = useHouseStore();

const compareList = computed(() => houseStore.compareList);

const removeFromCompare = (id: string) => {
  houseStore.removeFromCompare(id);
};

const viewDetail = (id: string) => {
  router.push(`/detail/${id}`);
};

const getImageUrl = (path: string) => {
  return `https://www.bsgzf.com.cn${path}`;
};
</script>

<style scoped></style>
