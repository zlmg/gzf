import { createApp } from 'vue'
import { pinia } from './stores'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import App from './App.vue'
import './style.css'
import { useAuthStore } from './stores/auth'

const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(ElementPlus, {
  locale: zhCn,
})

// 初始化认证状态
const authStore = useAuthStore()
authStore.initAuth()

app.mount('#app')