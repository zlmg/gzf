import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/** 需要登录的路由 meta 标识 */
export const REQUIRES_AUTH = 'requiresAuth'

/** 仅游客可访问的路由 meta 标识 */
export const GUEST_ONLY = 'guestOnly'

/**
 * 路由守卫
 */
export function setupRouterGuards(router: Router) {
  router.beforeEach((to) => {
    const authStore = useAuthStore()

    // 需要登录但未登录
    if (to.meta[REQUIRES_AUTH] && !authStore.isAuthenticated) {
      return {
        name: 'login',
        query: { redirect: to.fullPath },
      }
    }

    // 仅游客可访问但已登录
    if (to.meta[GUEST_ONLY] && authStore.isAuthenticated) {
      return { name: 'home' }
    }

    return true
  })
}