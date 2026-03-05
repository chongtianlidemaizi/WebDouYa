<template>
  <div class="home">
    <div class="header">
      <h1>密码与记事管理</h1>
      <div class="user-info">
        <span>{{ user?.email }}</span>
        <button class="btn-logout" @click="logout">退出登录</button>
      </div>
    </div>
    
    <div class="dashboard">
      <div class="stats">
        <div class="stat-card">
          <h3>密码数量</h3>
          <p>{{ passwordCount }}</p>
        </div>
        <div class="stat-card">
          <h3>记事数量</h3>
          <p>{{ noteCount }}</p>
        </div>
        <div class="stat-card">
          <h3>账号类型</h3>
          <p>{{ userRole }}</p>
        </div>
      </div>
      
      <div class="quick-actions">
        <h2>快速操作</h2>
        <div class="action-grid">
          <router-link to="/passwords" class="action-card">
            <div class="action-icon password-icon">🔐</div>
            <h3>密码管理</h3>
            <p>管理和分类您的密码</p>
          </router-link>
          <router-link to="/notes" class="action-card">
            <div class="action-icon note-icon">📝</div>
            <h3>记事管理</h3>
            <p>创建和管理个人记事</p>
          </router-link>
          <router-link to="/profile" class="action-card">
            <div class="action-icon profile-icon">👤</div>
            <h3>个人中心</h3>
            <p>查看和编辑个人信息</p>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '../supabase'

export default {
  name: 'Home',
  data() {
    return {
      user: null,
      passwordCount: 0,
      noteCount: 0,
      userRole: '普通用户'
    }
  },
  mounted() {
    this.loadUser()
    this.loadStats()
  },
  methods: {
    async loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        this.user = user
        this.userRole = user.user_metadata?.role === 'vip' ? '会员用户' : '普通用户'
      } else {
        // 未登录，跳转到登录页
        this.$router.push('/login')
      }
    },
    async loadStats() {
      // 这里可以从数据库中获取实际的统计数据
      // 暂时使用模拟数据
      this.passwordCount = 12
      this.noteCount = 8
    },
    async logout() {
      await supabase.auth.signOut()
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}

.header h1 {
  color: #2c3e50;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info span {
  color: #666;
}

.btn-logout {
  padding: 8px 16px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-logout:hover {
  background: #c0392b;
}

.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
}

.stat-card h3 {
  color: #666;
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: 500;
}

.stat-card p {
  font-size: 28px;
  font-weight: bold;
  color: #3498db;
  margin: 0;
}

.quick-actions {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.quick-actions h2 {
  color: #2c3e50;
  margin-bottom: 20px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.action-card {
  background: #f8f9fa;
  padding: 30px;
  border-radius: 8px;
  text-decoration: none;
  color: #333;
  transition: transform 0.3s, box-shadow 0.3s;
  text-align: center;
}

.action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.action-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.action-card h3 {
  margin-bottom: 10px;
  color: #2c3e50;
}

.action-card p {
  color: #666;
  font-size: 14px;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .user-info {
    width: 100%;
    justify-content: center;
  }
  
  .action-grid {
    grid-template-columns: 1fr;
  }
}
</style>