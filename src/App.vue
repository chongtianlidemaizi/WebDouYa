<template>
  <div id="app">
    <div class="app-container">
      <!-- 侧边导航 -->
      <div class="sidebar">
        <div class="sidebar-header">
          <h1 class="app-name">{{ $t('app.name') }}</h1>
          <p class="app-desc">{{ $t('app.desc') }}</p>
        </div>
        
        <nav class="sidebar-nav">
          <router-link to="/home" class="nav-item home-item">
            <span class="nav-icon">🏠</span>
            <span class="nav-text">{{ $t('nav.home') }}</span>
          </router-link>
          
          <div class="nav-section">
            <h3 class="nav-section-title">{{ $t('nav.tools') }}</h3>
            <router-link 
              v-for="tool in userTools" 
              :key="tool.id" 
              :to="tool.route" 
              class="nav-item tool-item"
            >
              <span class="nav-icon">{{ tool.icon }}</span>
              <span class="nav-text">{{ tool.name }}</span>
            </router-link>
            <div v-if="userTools.length === 0" class="empty-tools">
              <p>{{ $t('home.noTools') }}</p>
            </div>
          </div>
          
          <div class="nav-section">
            <h3 class="nav-section-title">{{ $t('nav.account') }}</h3>
            <router-link to="/profile" class="nav-item profile-item">
              <span class="nav-icon">👤</span>
              <span class="nav-text">{{ $t('nav.profile') }}</span>
            </router-link>
          </div>
          
          <!-- 语言选择 -->
          <div class="nav-section language-section">
            <h3 class="nav-section-title">{{ $t('common.language') }}</h3>
            <div class="language-selector">
              <select v-model="currentLanguage" class="language-select">
                <option value="zh-CN">{{ $t('language.zhCN') }}</option>
                <option value="zh-TW">{{ $t('language.zhTW') }}</option>
                <option value="en">{{ $t('language.en') }}</option>
              </select>
            </div>
          </div>
          
          <!-- 退出登录按钮移到最底部 -->
          <div class="nav-section logout-section">
            <a href="#" class="nav-item logout-item" @click.prevent="logout">
              <span class="nav-icon">🚪</span>
              <span class="nav-text">{{ $t('nav.logout') }}</span>
            </a>
          </div>
        </nav>
      </div>
      
      <!-- 主内容区 -->
      <div class="main-content">
        <router-view @tools-updated="updateTools" />
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from './supabase'
import { initDatabase } from './db-init'
import i18n from './i18n'

export default {
  name: 'App',
  data() {
    return {
      userTools: [],
      user: null,
      currentLanguage: localStorage.getItem('language') || 'zh-CN'
    }
  },
  watch: {
    currentLanguage: {
      handler(newLang) {
        i18n.global.locale.value = newLang
        localStorage.setItem('language', newLang)
        // 语言变化时更新工具名称
        this.updateToolNames()
      },
      immediate: true
    }
  },
  methods: {
    updateToolNames() {
      // 根据当前语言更新工具名称
      for (let i = 0; i < this.userTools.length; i++) {
        if (this.userTools[i].route === '/passwords') {
          this.userTools[i].name = this.$t('passwords.title')
        } else if (this.userTools[i].route === '/notes') {
          this.userTools[i].name = this.$t('notes.title')
        }
      }
    },
    async mounted() {
      await this.initApp()
      // 监听路由变化，在用户登录后重新加载工具
      this.$router.beforeEach(async (to, from, next) => {
        // 检查用户是否已登录
        const user = localStorage.getItem('user')
        if (user) {
          // 用户已登录，确保用户信息已加载
          await this.loadUser()
          if (this.user && this.userTools.length === 0) {
            // 只有当用户工具为空时才加载，避免覆盖已更新的工具列表
            await this.loadUserTools()
          }
        }
        next()
      })
    },
    async initApp() {
      // 初始化数据库
      await initDatabase()
      // 加载用户信息
      await this.loadUser()
      // 加载用户工具
      if (this.user) {
        await this.loadUserTools()
      }
    },
    async loadUser() {
      // 先从Supabase获取用户信息
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        this.user = user
        // 确保用户在数据库中存在
        await this.ensureUserExists(user)
        // 存储用户信息到localStorage
        localStorage.setItem('user', JSON.stringify(user))
        // 加载用户工具
        await this.loadUserTools()
      } else {
        // 尝试从localStorage获取用户信息
        const savedUser = localStorage.getItem('user')
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser)
            this.user = userData
            // 确保用户在数据库中存在
            await this.ensureUserExists(userData)
            // 加载用户工具
            await this.loadUserTools()
          } catch (error) {
            console.error('从localStorage加载用户信息失败:', error)
            // 清除无效的用户信息
            localStorage.removeItem('user')
          }
        } else {
          // 尝试从localStorage获取保存的登录信息
          const savedLogin = localStorage.getItem('savedLogin')
          if (savedLogin) {
            try {
              const loginData = JSON.parse(savedLogin)
              // 使用保存的登录信息自动登录
              const { data, error } = await supabase.auth.signInWithPassword({
                email: loginData.email,
                password: loginData.password
              })
              
              if (!error && data.user) {
                this.user = data.user
                await this.ensureUserExists(data.user)
                localStorage.setItem('user', JSON.stringify(data.user))
                // 加载用户工具
                await this.loadUserTools()
              }
            } catch (error) {
              console.error('自动登录失败:', error)
              // 清除无效的登录信息
              localStorage.removeItem('savedLogin')
            }
          } else {
            // 清除无效的用户信息
            localStorage.removeItem('user')
          }
        }
      }
    },
    async ensureUserExists(user) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error && error.code === 'PGRST116') { // 未找到用户
        // 创建新用户
        await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            username: user.user_metadata?.username || user.email.split('@')[0]
          })
      }
    },
    async loadUserTools() {
      if (!this.user) return
      
      try {
        const { data, error } = await supabase
          .from('tools')
          .select('*')
          .eq('user_id', this.user.id)
        
        if (error) {
          console.error('加载工具失败:', error)
          this.userTools = []
        } else {
          this.userTools = data || []
          // 加载工具后更新工具名称
          this.updateToolNames()
        }
      } catch (error) {
        console.error('加载工具失败:', error)
        this.userTools = []
      }
    },
    async saveUserTools() {
      if (!this.user) return
      
      try {
        // 先删除用户所有工具
        await supabase
          .from('tools')
          .delete()
          .eq('user_id', this.user.id)
        
        // 再插入新工具
        if (this.userTools.length > 0) {
          const toolsToInsert = this.userTools.map(tool => ({
            user_id: this.user.id,
            name: tool.name,
            route: tool.route,
            icon: tool.icon
          }))
          
          await supabase
            .from('tools')
            .insert(toolsToInsert)
        }
      } catch (error) {
        console.error('保存工具失败:', error)
      }
    },
    updateTools(tools) {
      this.userTools = tools
      this.updateToolNames()
      // 不需要调用saveUserTools()，因为Home.vue已经直接保存到数据库了
    },
    async logout() {
      await supabase.auth.signOut()
      // 清除localStorage中的用户信息和保存的登录信息
      localStorage.removeItem('user')
      localStorage.removeItem('savedLogin')
      this.$router.push('/login')
    },

  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background: #f5f7fa;
}

#app {
  min-height: 100vh;
}

.app-container {
  display: flex;
  min-height: 100vh;
}

/* 侧边栏 */
.sidebar {
  width: 260px;
  background: #2c3e50;
  color: white;
  padding: 20px;
  box-shadow: 2px 0 10px rgba(0,0,0,0.1);
  position: fixed;
  height: 100vh;
  overflow-y: auto;
  z-index: 100;
}

.sidebar-header {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.app-name {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
  color: #3498db;
}

.app-desc {
  font-size: 14px;
  color: rgba(255,255,255,0.7);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  text-decoration: none;
  color: rgba(255,255,255,0.8);
  transition: all 0.3s;
  gap: 12px;
}

.nav-item:hover {
  background: rgba(255,255,255,0.1);
  color: white;
}

.nav-item.router-link-active {
  background: #3498db;
  color: white;
}

.nav-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.nav-text {
  font-size: 14px;
  font-weight: 500;
}

.nav-section {
  margin-top: 20px;
}

.nav-section-title {
  font-size: 12px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.5);
  margin-bottom: 10px;
  padding-left: 16px;
  letter-spacing: 1px;
}

.empty-tools {
  padding: 12px 16px;
  color: rgba(255,255,255,0.5);
  font-size: 14px;
  font-style: italic;
}

.language-section {
  margin-top: 20px;
}

.language-selector {
  padding: 0 16px;
}

.language-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 4px;
  background: rgba(255,255,255,0.1);
  color: white;
  font-size: 14px;
  cursor: pointer;
}

.language-select option {
  background: #2c3e50;
  color: white;
}

.logout-section {
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid rgba(255,255,255,0.1);
}

.logout-item {
  cursor: pointer;
}

/* 确保侧边栏导航区域有足够的高度，让退出登录按钮在底部 */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: calc(100vh - 150px);
}

/* 主内容区 */
.main-content {
  flex: 1;
  margin-left: 260px;
  min-height: 100vh;
  background: #f5f7fa;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    width: 200px;
  }
  
  .main-content {
    margin-left: 200px;
  }
  
  .app-name {
    font-size: 20px;
  }
  
  .nav-text {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .sidebar {
    width: 100%;
    height: auto;
    position: relative;
  }
  
  .main-content {
    margin-left: 0;
  }
  
  .app-container {
    flex-direction: column;
  }
  
  .sidebar-nav {
    flex-direction: row;
    overflow-x: auto;
  }
  
  .nav-section {
    margin-top: 0;
    margin-right: 20px;
  }
  
  .nav-section-title {
    padding-left: 0;
  }
  
  .nav-item {
    flex-direction: column;
    padding: 10px;
    min-width: 80px;
    text-align: center;
  }
  
  .nav-icon {
    margin-bottom: 5px;
  }
}
</style>