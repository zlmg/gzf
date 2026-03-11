<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from '@/components/Layout/AppHeader.vue'
import AppFooter from '@/components/Layout/AppFooter.vue'
import FavoriteNotification from '@/components/FavoriteNotification.vue'
import { useSync } from '@/composables/useSync'

const { startAutoSync } = useSync()

// 启动自动同步
startAutoSync()
</script>

<template>
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