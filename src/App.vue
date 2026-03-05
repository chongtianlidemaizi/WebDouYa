<template>
  <div id="app">
    <div class="app-container">
      <!-- 侧边导航 -->
      <div class="sidebar">
        <div class="sidebar-header">
          <h1 class="app-name">豆芽工作流</h1>
          <p class="app-desc">个性化工具管理</p>
        </div>
        
        <nav class="sidebar-nav">
          <router-link to="/home" class="nav-item home-item">
            <span class="nav-icon">🏠</span>
            <span class="nav-text">工具管理</span>
          </router-link>
          
          <div class="nav-section">
            <h3 class="nav-section-title">已添加工具</h3>
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
              <p>暂无已添加工具</p>
            </div>
          </div>
          
          <div class="nav-section">
            <h3 class="nav-section-title">账户</h3>
            <router-link to="/profile" class="nav-item profile-item">
              <span class="nav-icon">👤</span>
              <span class="nav-text">个人中心</span>
            </router-link>
          </div>
          
          <!-- 退出登录按钮移到最底部 -->
          <div class="nav-section logout-section">
            <a href="#" class="nav-item logout-item" @click.prevent="logout">
              <span class="nav-icon">🚪</span>
              <span class="nav-text">退出登录</span>
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

export default {
  name: 'App',
  data() {
    return {
      userTools: []
    }
  },
  mounted() {
    this.loadUserTools()
    this.initApp()
  },
  methods: {
    async initApp() {
      // 初始化数据库
      await initDatabase()
    },

    loadUserTools() {
      // 从本地存储加载用户工具
      const storedTools = localStorage.getItem('userTools')
      if (storedTools) {
        this.userTools = JSON.parse(storedTools)
      } else {
        // 默认工具
        this.userTools = []
        this.saveUserTools()
      }
    },
    saveUserTools() {
      localStorage.setItem('userTools', JSON.stringify(this.userTools))
    },
    updateTools(tools) {
      this.userTools = tools
    },
    async logout() {
      await supabase.auth.signOut()
      this.$router.push('/login')
    }
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