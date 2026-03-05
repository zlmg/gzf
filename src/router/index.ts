import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue')
    },
    {
      path: '/property/:projectNo',
      name: 'property-detail',
      component: () => import('@/views/PropertyDetail.vue')
    },
    {
      path: '/compare',
      name: 'compare',
      component: () => import('@/views/CompareView.vue')
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  }
})

export default router