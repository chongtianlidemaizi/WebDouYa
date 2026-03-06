<template>
  <div class="password-manager">
    <div class="header">
      <h1>密码管理</h1>
      <div class="header-right">
        <div class="password-limit">
          {{ passwordCount }}/{{ currentPasswordLimit }} 个密码
        </div>
        <button class="btn-add" @click="showAddForm = true" :disabled="!canAddPassword">添加密码</button>
      </div>
    </div>
    
    <div class="filter-section">
      <div class="filter-group">
        <label>分类</label>
        <select v-model="filter.category">
          <option value="">全部</option>
          <option value="网站">网站</option>
          <option value="应用">应用</option>
          <option value="银行">银行</option>
          <option value="其他">其他</option>
        </select>
      </div>
      <div class="filter-group">
        <label>搜索</label>
        <input type="text" v-model="filter.search" placeholder="搜索密码...">
      </div>
    </div>
    
    <div class="password-list">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="filteredPasswords.length === 0" class="empty">
        <p>暂无密码记录</p>
        <button class="btn" @click="showAddForm = true">添加第一个密码</button>
      </div>
      <div v-else class="password-grid">
        <div v-for="password in filteredPasswords" :key="password.id" class="password-card">
          <div class="password-header">
            <h3>{{ password.title }}</h3>
            <div class="password-actions">
              <button class="btn-action" @click="copyPassword(password.password)">📋</button>
              <button class="btn-action" @click="editPassword(password)">✏️</button>
              <button class="btn-action" @click="deletePassword(password.id)">🗑️</button>
            </div>
          </div>
          <div class="password-details">
            <p><strong>账号:</strong> {{ password.username }}</p>
            <p><strong>密码:</strong> {{ maskedPassword(password.password) }}</p>
            <p><strong>分类:</strong> {{ password.category }}</p>
            <p><strong>标签:</strong> 
              <span v-for="tag in password.tags" :key="tag" class="tag">{{ tag }}</span>
            </p>
            <p><strong>备注:</strong> {{ password.note || '无' }}</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 添加/编辑密码表单 -->
    <div v-if="showAddForm" class="modal-overlay" @click="showAddForm = false">
      <div class="modal" @click.stop>
        <h2>{{ editingPassword ? '编辑密码' : '添加密码' }}</h2>
        <form @submit.prevent="savePassword">
          <div class="form-group">
            <label>标题</label>
            <input type="text" v-model="form.title" required>
          </div>
          <div class="form-group">
            <label>账号</label>
            <input type="text" v-model="form.username">
          </div>
          <div class="form-group password-input-group">
            <label>密码</label>
            <div class="password-input-wrapper">
              <input :type="showPassword ? 'text' : 'password'" v-model="form.password" required>
              <button type="button" class="toggle-password" @click="showPassword = !showPassword">
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>分类</label>
            <select v-model="form.category" required>
              <option value="">请选择分类</option>
              <option value="网站">网站</option>
              <option value="应用">应用</option>
              <option value="银行">银行</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div class="form-group">
            <label>标签 (用逗号分隔)</label>
            <input type="text" v-model="form.tagsInput" placeholder="例如: 重要,工作,个人">
          </div>
          <div class="form-group">
            <label>备注</label>
            <textarea v-model="form.note" rows="3" placeholder="添加备注..."></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="showAddForm = false">取消</button>
            <button type="submit" class="btn" :disabled="loading">保存</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '../supabase'

export default {
  name: 'PasswordManager',
  data() {
    return {
      passwords: [],
      filter: {
        category: '',
        search: ''
      },
      showAddForm: false,
      editingPassword: null,
      form: {
        title: '',
        username: '',
        password: '',
        category: '',
        tagsInput: '',
        note: ''
      },
      showPassword: false,
      loading: false,
      user: null,
      isVip: false,
      passwordLimit: 6, // 普通用户限制
      vipPasswordLimit: 32, // 会员用户限制
      passwordCount: 0
    }
  },
  computed: {
    filteredPasswords() {
      return this.passwords.filter(password => {
        const matchesCategory = !this.filter.category || password.category === this.filter.category
        const matchesSearch = !this.filter.search || 
          password.title.toLowerCase().includes(this.filter.search.toLowerCase()) ||
          password.username.toLowerCase().includes(this.filter.search.toLowerCase()) ||
          password.note?.toLowerCase().includes(this.filter.search.toLowerCase())
        return matchesCategory && matchesSearch
      })
    },
    currentPasswordLimit() {
      return this.isVip ? this.vipPasswordLimit : this.passwordLimit
    },
    canAddPassword() {
      return this.passwordCount < this.currentPasswordLimit
    }
  },
  mounted() {
    this.loadUser()
    this.loadPasswords()
  },
  methods: {
    async loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        this.user = user
        // 获取用户会员状态
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
        } else if (data) {
          // 检查会员是否过期
          const now = new Date()
          const expiresAt = data.vip_expires_at ? new Date(data.vip_expires_at) : null
          this.isVip = data.is_vip && expiresAt && expiresAt > now
        }
      } catch (error) {
        console.error('加载用户状态失败:', error)
        this.isVip = false
      }
    },
    async loadPasswords() {
      if (!this.user) return
      
      this.loading = true
      try {
        const { data, error } = await supabase
          .from('passwords')
          .select('*')
          .eq('user_id', this.user.id)
          .order('created_at', { ascending: false })
        
        if (error) {
          throw error
        }
        
        this.passwords = data || []
        this.passwordCount = this.passwords.length
      } catch (error) {
        console.error('加载密码失败:', error)
        // 如果数据库表不存在，创建表
        await this.createPasswordsTable()
        this.passwords = []
        this.passwordCount = 0
      } finally {
        this.loading = false
      }
    },
    async createPasswordsTable() {
      try {
        const { error } = await supabase
          .rpc('create_passwords_table')
        
        if (error) {
          console.error('创建密码表失败:', error)
        }
      } catch (error) {
        console.error('创建密码表失败:', error)
      }
    },
    maskedPassword(password) {
      return '*'.repeat(password.length)
    },
    copyPassword(password) {
      navigator.clipboard.writeText(password)
        .then(() => {
          alert('密码已复制到剪贴板')
        })
        .catch(err => {
          console.error('复制失败:', err)
        })
    },
    editPassword(password) {
      this.editingPassword = password
      this.form = {
        title: password.title,
        username: password.username,
        password: password.password,
        category: password.category,
        tagsInput: password.tags.join(','),
        note: password.note
      }
      this.showAddForm = true
    },
    async deletePassword(id) {
      if (!confirm('确定要删除这个密码吗？')) {
        return
      }
      
      this.loading = true
      try {
        const { error } = await supabase
          .from('passwords')
          .delete()
          .eq('id', id)
        
        if (error) {
          throw error
        }
        
        this.passwords = this.passwords.filter(p => p.id !== id)
        this.passwordCount = this.passwords.length
      } catch (error) {
        console.error('删除密码失败:', error)
      } finally {
        this.loading = false
      }
    },
    async savePassword() {
      // 检查是否达到密码数量限制
      if (!this.editingPassword && !this.canAddPassword) {
        alert(`您已达到密码存储限制（${this.currentPasswordLimit}个），升级为会员可存储更多密码`)
        return
      }
      
      this.loading = true
      try {
        console.log('开始保存密码:', this.editingPassword ? '编辑' : '添加')
        console.log('当前用户:', this.user)
        
        const tags = this.form.tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag)
        
        // 先确保用户在数据库中存在
        await this.ensureUserExists()
        
        if (this.editingPassword) {
          // 编辑现有密码
          const { error } = await supabase
            .from('passwords')
            .update({
              title: this.form.title,
              username: this.form.username,
              password: this.form.password,
              category: this.form.category,
              tags,
              note: this.form.note
            })
            .eq('id', this.editingPassword.id)
          
          if (error) {
            console.error('编辑密码失败:', error)
            throw error
          }
          
          const index = this.passwords.findIndex(p => p.id === this.editingPassword.id)
          if (index !== -1) {
            this.passwords[index] = {
              ...this.passwords[index],
              title: this.form.title,
              username: this.form.username,
              password: this.form.password,
              category: this.form.category,
              tags,
              note: this.form.note
            }
          }
          
          console.log('编辑密码成功')
          alert('密码更新成功！')
        } else {
          // 添加新密码
          const { data, error } = await supabase
            .from('passwords')
            .insert({
              user_id: this.user.id,
              title: this.form.title,
              username: this.form.username,
              password: this.form.password,
              category: this.form.category,
              tags,
              note: this.form.note
            })
            .select()
          
          if (error) {
            console.error('添加密码失败:', error)
            throw error
          }
          
          if (data && data[0]) {
            console.log('添加密码成功:', data[0])
            this.passwords.unshift(data[0])
            this.passwordCount++
            alert('密码添加成功！')
          } else {
            console.error('添加密码失败: 没有返回数据')
            throw new Error('添加密码失败: 没有返回数据')
          }
        }
        
        this.showAddForm = false
        this.resetForm()
      } catch (error) {
        console.error('保存密码失败:', error)
        console.error('错误代码:', error.code)
        console.error('错误消息:', error.message)
        
        if (error.code === '42P01') {
          alert('数据库表不存在，请在Supabase控制台创建密码表\n\nCREATE TABLE passwords (\n  id SERIAL PRIMARY KEY,\n  user_id UUID NOT NULL,\n  title TEXT NOT NULL,\n  username TEXT,\n  password TEXT NOT NULL,\n  category TEXT,\n  tags TEXT[],\n  note TEXT,\n  is_local BOOLEAN DEFAULT false,\n  created_at TIMESTAMP DEFAULT NOW(),\n  updated_at TIMESTAMP DEFAULT NOW(),\n  FOREIGN KEY (user_id) REFERENCES users(id)\n);')
        } else if (error.code === '23503') {
          // 外键约束错误，用户可能不在users表中
          await this.ensureUserExists()
          // 重新尝试保存
          await this.savePassword()
        } else {
          alert(`保存密码失败: ${error.message}`)
        }
      } finally {
        this.loading = false
      }
    },
    async ensureUserExists() {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', this.user.id)
          .single()
        
        if (error && error.code === 'PGRST116') { // 未找到用户
          console.log('用户不存在，正在创建...')
          // 创建新用户
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: this.user.id,
              email: this.user.email,
              username: this.user.user_metadata?.username || this.user.email.split('@')[0]
            })
          
          if (insertError) {
            console.error('创建用户失败:', insertError)
            throw insertError
          }
          console.log('用户创建成功')
        } else if (error) {
          console.error('检查用户时出错:', error)
          throw error
        } else {
          console.log('用户已存在')
        }
      } catch (error) {
        console.error('确保用户存在时出错:', error)
        throw error
      }
    },
    resetForm() {
      this.editingPassword = null
      this.showPassword = false
      this.form = {
        title: '',
        username: '',
        password: '',
        category: '',
        tagsInput: '',
        note: ''
      }
    }
  }
}
</script>

<style scoped>
.password-manager {
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
  margin-bottom: 20px;
}

.header h1 {
  color: #2c3e50;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.password-limit {
  font-size: 14px;
  color: #666;
  background: #f8f9fa;
  padding: 8px 12px;
  border-radius: 4px;
}

.btn-add:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.btn-add {
  padding: 10px 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-add:hover {
  background: #2980b9;
}

.filter-section {
  display: flex;
  gap: 20px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.filter-group {
  flex: 1;
}

.filter-group label {
  display: block;
  margin-bottom: 8px;
  color: #666;
  font-weight: 500;
}

.filter-group input,
.filter-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.password-list {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.loading,
.empty {
  text-align: center;
  padding: 40px;
  color: #666;
}

.empty button {
  margin-top: 20px;
  padding: 10px 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.password-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.password-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  transition: box-shadow 0.3s;
}

.password-card:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.password-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.password-header h3 {
  margin: 0;
  color: #2c3e50;
}

.password-actions {
  display: flex;
  gap: 5px;
}

.btn-action {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 5px;
  border-radius: 4px;
  transition: background 0.3s;
}

.btn-action:hover {
  background: #f0f0f0;
}

.password-details p {
  margin: 8px 0;
  font-size: 14px;
}

.tag {
  display: inline-block;
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  margin-right: 5px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 30px;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h2 {
  margin-bottom: 20px;
  color: #2c3e50;
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

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.password-input-wrapper {
  position: relative;
  width: 100%;
}

.password-input-wrapper input {
  padding-right: 40px;
}

.toggle-password {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: background 0.3s;
}

.toggle-password:hover {
  background: #f0f0f0;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
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

@media (max-width: 768px) {
  .filter-section {
    flex-direction: column;
  }
  
  .password-grid {
    grid-template-columns: 1fr;
  }
}
</style>