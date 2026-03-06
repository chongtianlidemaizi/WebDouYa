<template>
  <div class="profile">
    <div class="header">
      <h1>{{ $t('profile.title') }}</h1>
    </div>
    
    <div class="profile-content">
      <div class="user-info">
        <h2>{{ $t('profile.account') }}</h2>
        <div class="info-item">
          <label>{{ $t('profile.email') }}</label>
          <span>{{ user?.email }}</span>
        </div>
        <div class="info-item">
          <label>{{ $t('profile.username') }}</label>
          <span>{{ user?.user_metadata?.username || $t('profile.notSet') }}</span>
        </div>
        <div class="info-item">
          <label>{{ $t('profile.accountType') }}</label>
          <span :class="['user-role', userRole === $t('profile.vip') ? 'vip' : '']">{{ userRole }}</span>
        </div>
        <div class="info-item">
          <label>{{ $t('profile.registrationTime') }}</label>
          <span>{{ formatDate(user?.created_at) }}</span>
        </div>
      </div>
      
      <div class="account-settings">
        <h2>{{ $t('profile.accountSettings') }}</h2>
        
        <div class="settings-section">
          <h3>{{ $t('profile.changePassword') }}</h3>
          <form @submit.prevent="changePassword">
            <div class="form-group">
              <label>{{ $t('profile.currentPassword') }}</label>
              <input type="password" v-model="passwordForm.currentPassword" required>
            </div>
            <div class="form-group">
              <label>{{ $t('profile.newPassword') }}</label>
              <input type="password" v-model="passwordForm.newPassword" required minlength="6">
            </div>
            <div class="form-group">
              <label>{{ $t('profile.confirmPassword') }}</label>
              <input type="password" v-model="passwordForm.confirmPassword" required>
            </div>
            <div class="form-note">
              <p>{{ $t('profile.passwordNote') }}</p>
            </div>
            <button type="submit" class="btn" :disabled="loading">{{ $t('profile.change') }}</button>
          </form>
        </div>
        
        <div class="settings-section">
          <h3>{{ $t('profile.vip') }}</h3>
          <div class="membership-card" v-if="userRole === $t('profile.notVip')">
            <h4>{{ $t('profile.upgradeToVip') }}</h4>
            <p>{{ $t('profile.vipBenefits') }}</p>
            <ul>
              <li>{{ $t('profile.passwordLimitUpgrade') }}</li>
              <li>{{ $t('profile.noteLimitUpgrade') }}</li>
              <li>{{ $t('profile.cloudSync') }}</li>
              <li>{{ $t('profile.prioritySupport') }}</li>
            </ul>
            <button class="btn btn-vip" @click="upgradeToVip" :disabled="loading">{{ $t('profile.upgrade') }}</button>
          </div>
          <div class="membership-card vip" v-else>
            <h4>{{ $t('profile.alreadyVip') }}</h4>
            <p>{{ $t('profile.thankYouForSupport') }}</p>
            <p class="vip-expiry">{{ $t('profile.vipExpiry') }}：{{ vipExpiryText }}</p>
          </div>
        </div>
        
        <div class="settings-section">
          <h3>{{ $t('profile.storage') }}</h3>
          <div class="storage-item">
            <label>{{ $t('profile.storageType') }}</label>
            <div class="storage-options">
              <label class="radio-option">
                <input type="radio" v-model="storageType" value="cloud" :disabled="!isVip">
                <span>{{ $t('profile.cloud') }}</span>
              </label>
              <label class="radio-option">
                <input type="radio" v-model="storageType" value="local">
                <span>{{ $t('profile.local') }}</span>
              </label>
            </div>
            <button class="btn btn-secondary" @click="saveStorageType">{{ $t('profile.saveStorage') }}</button>
          </div>
          <div class="storage-note" v-if="!isVip">
            <p>{{ $t('profile.cloudStorageNote') }}</p>
          </div>
        </div>
        
        <div class="settings-section">
          <h3>{{ $t('profile.accountSecurity') }}</h3>
          <div class="security-item">
            <label>{{ $t('profile.twoFactorAuth') }}</label>
            <span class="status">{{ $t('profile.notEnabled') }}</span>
            <button class="btn btn-secondary">{{ $t('profile.enable') }}</button>
          </div>
          <div class="security-item">
            <label>{{ $t('profile.loginDevices') }}</label>
            <span class="status">{{ loginDevices }} {{ $t('profile.devices') }}</span>
            <button class="btn btn-secondary">{{ $t('profile.view') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '../supabase'

export default {
  name: 'Profile',
  data() {
    return {
      user: null,
      userRole: '普通用户',
      isVip: false,
      vipExpiresAt: null,
      passwordForm: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      loading: false,
      loginDevices: 1,
      storageType: 'cloud' // cloud 或 local
    }
  },
  computed: {
    vipExpiryText() {
      if (!this.vipExpiresAt) return '永久'
      return new Date(this.vipExpiresAt).toLocaleDateString('zh-CN')
    }
  },
  mounted() {
    this.loadUser()
    this.loadStorageType()
  },
  methods: {
    loadStorageType() {
      // 从本地存储加载存储类型
      const storedType = localStorage.getItem('storageType')
      if (storedType) {
        this.storageType = storedType
      } else {
        // 默认存储类型：会员使用云端，非会员使用本地
        this.storageType = this.isVip ? 'cloud' : 'local'
      }
    },
    async loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        this.user = user
        await this.loadUserStatus()
      } else {
        // 未登录，跳转到登录页
        this.$router.push('/login')
      }
    },
    async loadUserStatus() {
      if (!this.user) return
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('is_vip, vip_expires_at')
          .eq('id', this.user.id)
          .single()
        
        if (error) {
          console.error('加载用户状态失败:', error)
          this.isVip = false
          this.userRole = this.$t('profile.notVip')
        } else if (data) {
          // 检查会员是否过期
          const now = new Date()
          const expiresAt = data.vip_expires_at ? new Date(data.vip_expires_at) : null
          this.isVip = data.is_vip && expiresAt && expiresAt > now
          this.vipExpiresAt = data.vip_expires_at
          this.userRole = this.isVip ? this.$t('profile.vip') : this.$t('profile.notVip')
        }
      } catch (error) {
        console.error('加载用户状态失败:', error)
        this.isVip = false
        this.userRole = this.$t('profile.notVip')
      }
    },
    async upgradeToVip() {
      if (!this.user) return
      
      this.loading = true
      try {
        // 计算会员到期时间（例如：一年后）
        const expiresAt = new Date()
        expiresAt.setFullYear(expiresAt.getFullYear() + 1)
        
        const { error } = await supabase
          .from('users')
          .update({
            is_vip: true,
            vip_expires_at: expiresAt.toISOString()
          })
          .eq('id', this.user.id)
        
        if (error) {
          throw error
        }
        
        alert(this.$t('profile.vipUpgradeSuccess'))
        await this.loadUserStatus()
      } catch (error) {
        console.error('升级会员失败:', error)
        alert(this.$t('profile.vipUpgradeFailed'))
      } finally {
        this.loading = false
      }
    },
    formatDate(date) {
      if (!date) return '未知'
      return new Date(date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    async changePassword() {
      if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
        alert(this.$t('profile.passwordsNotMatch'))
        return
      }
      
      this.loading = true
      try {
        // 这里可以实现密码修改逻辑
        // 暂时只是模拟
        alert(this.$t('profile.passwordChangeEmailSent'))
        this.passwordForm = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }
      } catch (error) {
        console.error('修改密码失败:', error)
        alert(this.$t('profile.passwordChangeFailed'))
      } finally {
        this.loading = false
      }
    },
    async saveStorageType() {
      // 保存存储类型到本地存储
      localStorage.setItem('storageType', this.storageType)
      alert(this.$t('profile.storageSettingsSaved'))
    }
  }
}
</script>

<style scoped>
.profile {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
}

.header {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.header h1 {
  color: #2c3e50;
  margin: 0;
}

.profile-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.user-info {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.user-info h2 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 18px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item label {
  color: #666;
  font-weight: 500;
}

.info-item span {
  color: #333;
}

.user-role {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
}

.user-role.vip {
  background: #fff3cd;
  color: #856404;
}

.account-settings {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.account-settings h2 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 18px;
}

.settings-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.settings-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.settings-section h3 {
  color: #34495e;
  margin-bottom: 15px;
  font-size: 16px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #666;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-note {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.form-note p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.btn {
  padding: 10px 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn:hover {
  background: #2980b9;
}

.btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.btn-secondary {
  background: #95a5a6;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.btn-vip {
  background: #e67e22;
}

.btn-vip:hover {
  background: #d35400;
}

.membership-card {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.membership-card.vip {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
}

.membership-card h4 {
  margin-bottom: 10px;
  color: #2c3e50;
}

.membership-card p {
  margin-bottom: 15px;
  color: #666;
}

.membership-card ul {
  margin-bottom: 20px;
  padding-left: 20px;
}

.membership-card li {
  margin-bottom: 5px;
  color: #666;
}

.vip-expiry {
  font-weight: 500;
  color: #856404 !important;
}

.security-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.security-item:last-child {
  border-bottom: none;
}

.status {
  color: #666;
  font-size: 14px;
}

.storage-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.storage-options {
  display: flex;
  gap: 20px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}

.radio-option input:disabled {
  cursor: not-allowed;
}

.radio-option span {
  color: #666;
  font-size: 14px;
}

.storage-note {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
}

.storage-note p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

@media (max-width: 768px) {
  .profile-content {
    grid-template-columns: 1fr;
  }
  
  .storage-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .storage-options {
    width: 100%;
    justify-content: space-between;
  }
  
  .storage-item button {
    width: 100%;
  }
}
</style>