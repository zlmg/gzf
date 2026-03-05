<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useFavoriteStore } from '@/stores/favorite'

const favoriteStore = useFavoriteStore()
</script>

<template>
  <header class="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
    <div class="container mx-auto px-4 py-4">
      <div class="flex items-center justify-between">
        <RouterLink to="/" class="flex items-center space-x-3 hover:opacity-90 transition-opacity">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <h1 class="text-xl font-bold">公租房房源查询系统</h1>
        </RouterLink>
        <nav class="flex items-center space-x-4">
          <RouterLink
            to="/"
            class="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
            active-class="bg-white/20"
          >
            房源列表
          </RouterLink>
          <RouterLink
            to="/favorites"
            class="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
            active-class="bg-white/20"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            收藏
            <span
              v-if="favoriteStore.count > 0"
              class="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
            >
              {{ favoriteStore.count > 99 ? '99+' : favoriteStore.count }}
            </span>
          </RouterLink>
          <RouterLink
            to="/compare"
            class="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
            active-class="bg-white/20"
          >
            房源对比
          </RouterLink>
        </nav>
      </div>
    </div>
  </header>
</template>