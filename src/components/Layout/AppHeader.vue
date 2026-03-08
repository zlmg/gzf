<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useFavoriteStore } from '@/stores/favorite'

const favoriteStore = useFavoriteStore()
const isMobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}
</script>

<template>
  <header class="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
    <div class="container-app py-3 md:py-4">
      <div class="flex items-center justify-between">
        <!-- Logo and Title -->
        <RouterLink
          to="/"
          class="flex items-center gap-2 md:gap-3 hover:opacity-90 transition-opacity"
          @click="closeMobileMenu"
        >
          <svg class="w-7 h-7 md:w-8 md:h-8 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <h1 class="text-base md:text-xl font-bold truncate">公租房查询demo</h1>
        </RouterLink>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center space-x-4">
          <RouterLink
            to="/"
            class="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
            active-class="bg-white/20"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
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
            class="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
            active-class="bg-white/20"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            房源对比
          </RouterLink>
        </nav>

        <!-- Mobile Menu Button -->
        <button
          @click="toggleMobileMenu"
          class="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="菜单"
        >
          <svg v-if="!isMobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Mobile Navigation Dropdown -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <nav v-if="isMobileMenuOpen" class="md:hidden mt-3 pt-3 border-t border-white/20">
          <div class="flex flex-col space-y-1">
            <RouterLink
              to="/"
              class="px-4 py-3 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
              active-class="bg-white/20"
              @click="closeMobileMenu"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              房源列表
            </RouterLink>
            <RouterLink
              to="/favorites"
              class="px-4 py-3 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
              active-class="bg-white/20"
              @click="closeMobileMenu"
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
              class="px-4 py-3 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
              active-class="bg-white/20"
              @click="closeMobileMenu"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              房源对比
            </RouterLink>
          </div>
        </nav>
      </Transition>
    </div>
  </header>
</template>