<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()

const menuItems = [
  { path: '/user', name: 'user-profile', label: '个人信息', icon: 'User' },
  { path: '/user/security', name: 'user-security', label: '账号安全', icon: 'Lock' },
]
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="container-app">
      <div class="flex flex-col md:flex-row gap-6">
        <!-- 侧边栏 -->
        <aside class="w-full md:w-64 flex-shrink-0">
          <el-card shadow="sm" class="rounded-xl overflow-hidden">
            <!-- 用户信息头部 -->
            <div class="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 text-center">
              <div
                class="w-20 h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold"
              >
                {{ authStore.username?.charAt(0).toUpperCase() || '?' }}
              </div>
              <h3 class="mt-3 font-semibold text-lg">{{ authStore.user?.nickname || authStore.username }}</h3>
              <p class="text-blue-100 text-sm">{{ authStore.user?.email }}</p>
            </div>

            <!-- 菜单 -->
            <nav class="p-2">
              <RouterLink
                v-for="item in menuItems"
                :key="item.path"
                :to="item.path"
                :class="[
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  route.name === item.name
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50',
                ]"
              >
                <el-icon :size="20">
                  <component :is="item.icon" />
                </el-icon>
                {{ item.label }}
              </RouterLink>
            </nav>
          </el-card>
        </aside>

        <!-- 主内容区 -->
        <main class="flex-1">
          <router-view />
        </main>
      </div>
    </div>
  </div>
</template>