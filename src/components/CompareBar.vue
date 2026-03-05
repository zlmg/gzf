<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCompareStore } from '@/stores/compare'
import { ElButton } from 'element-plus'

const router = useRouter()
const compareStore = useCompareStore()

const isVisible = computed(() => compareStore.compareList.length > 0)
const count = computed(() => compareStore.compareList.length)

const goToCompare = () => {
  router.push('/compare')
}

const clearAll = () => {
  compareStore.clearCompare()
}
</script>

<template>
  <Transition name="slide-up">
    <div
      v-if="isVisible"
      class="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.15)] z-50"
    >
      <div class="container mx-auto px-4 py-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span class="font-semibold text-gray-800">
                已选择 <span class="text-blue-600">{{ count }}</span> 个房源进行对比
              </span>
            </div>
            <div class="flex items-center gap-2">
              <div
                v-for="item in compareStore.compareList.slice(0, 4)"
                :key="item.projectNo"
                class="w-10 h-10 bg-gray-100 rounded overflow-hidden"
              >
                <img
                  v-if="item.images[0]"
                  :src="item.images[0]"
                  :alt="item.projectName"
                  class="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <ElButton size="default" @click="clearAll">
              清空
            </ElButton>
            <ElButton type="primary" size="default" @click="goToCompare">
              开始对比
              <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </ElButton>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>