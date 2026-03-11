import { createRouter, createWebHistory } from 'vue-router'
import { setupRouterGuards, REQUIRES_AUTH, GUEST_ONLY } from './guards'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/property/:projectNo',
      name: 'property-detail',
      component: () => import('@/views/PropertyDetail.vue'),
    },
    {
      path: '/compare',
      name: 'compare',
      component: () => import('@/views/CompareView.vue'),
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: () => import('@/views/FavoritesView.vue'),
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('@/views/HistoryView.vue'),
    },
    // 认证相关路由
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { [GUEST_ONLY]: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { [GUEST_ONLY]: true },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/auth/ForgotPasswordView.vue'),
      meta: { [GUEST_ONLY]: true },
    },
    // 用户中心
    {
      path: '/user',
      name: 'user',
      component: () => import('@/views/user/UserView.vue'),
      meta: { [REQUIRES_AUTH]: true },
      children: [
        {
          path: '',
          name: 'user-profile',
          component: () => import('@/views/user/ProfileView.vue'),
        },
        {
          path: 'security',
          name: 'user-security',
          component: () => import('@/views/user/SecurityView.vue'),
        },
      ],
    },
  ],
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
})

// 设置路由守卫
setupRouterGuards(router)

export default router