import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import './styles/main.css'
import { migrateLocalToD1 } from './utils/dataIO'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(ElementPlus)

// 启动时检测 localStorage 旧数据并迁移到 D1
migrateLocalToD1().then((migrated) => {
  if (migrated) {
    console.log('[hotcode] localStorage 数据已迁移到 D1')
  }
  app.mount('#app')
})
