import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { initDatabase, testConnection } from './db-init'

// 初始化数据库
async function initApp() {
  console.log('正在初始化数据库...')
  await initDatabase()
  await testConnection()
  console.log('应用初始化完成')
}

initApp()

createApp(App).use(router).use(i18n).mount('#app')