<script setup lang="ts">
import { useFavoriteStore } from '@/stores/favorite'

const favoriteStore = useFavoriteStore()
</script>

<template>
  <Teleport to="body">
    <Transition name="notification">
      <div
        v-if="favoriteStore.notification.show"
        class="fixed top-4 right-4 z-[9999] px-4 py-3 rounded-lg shadow-lg flex items-center gap-2" :class="[
          {
            'bg-green-50 text-green-800 border border-green-200': favoriteStore.notification.type === 'success',
            'bg-red-50 text-red-800 border border-red-200': favoriteStore.notification.type === 'error',
            'bg-yellow-50 text-yellow-800 border border-yellow-200': favoriteStore.notification.type === 'warning',
          },
        ]"
      >
        <!-- Success Icon -->
        <svg v-if="favoriteStore.notification.type === 'success'" class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <!-- Error Icon -->
        <svg v-else-if="favoriteStore.notification.type === 'error'" class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <!-- Warning Icon -->
        <svg v-else class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span class="font-medium">{{ favoriteStore.notification.message }}</span>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
