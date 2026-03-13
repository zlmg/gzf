import { createApp } from 'vue'
import { pinia } from './stores'
import router from './router'
import ui from '@nuxt/ui/vue-plugin'
import App from './App.vue'
import './style.css'

const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(ui)

app.mount('#app')
