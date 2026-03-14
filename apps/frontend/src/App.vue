<script setup lang="ts">
import { RouterView } from 'vue-router'
import FavoriteNotification from '@/components/FavoriteNotification.vue'
import AppFooter from '@/components/Layout/AppFooter.vue'
import AppHeader from '@/components/Layout/AppHeader.vue'
import { useSync } from '@/composables/useSync'
import { usePropertyStore } from '@/stores/property'
import { onMounted } from 'vue'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

const { startAutoSync } = useSync()

// 启动自动同步
startAutoSync()

// 初始化房源数据，确保在任何页面都能获取
const propertyStore = usePropertyStore()
onMounted(() => {
  if (propertyStore.properties.length === 0) {
    propertyStore.fetchProperties()
  }
})
</script>

<template>
  <el-config-provider :locale="zhCn">
    <div class="min-h-screen flex flex-col bg-gray-50">
      <AppHeader />
      <main class="flex-1 pt-16 md:pt-20">
        <RouterView v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
      <AppFooter />
      <FavoriteNotification />
    </div>
  </el-config-provider>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
