<template>
  <div class="password-manager">
    <div class="header">
      <h1>密码管理</h1>
      <button class="btn-add" @click="showAddForm = true">添加密码</button>
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
          <div class="form-group">
            <label>密码</label>
            <input type="password" v-model="form.password" required>
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
      loading: false
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
    }
  },
  mounted() {
    this.loadPasswords()
  },
  methods: {
    async loadPasswords() {
      this.loading = true
      try {
        // 这里可以从数据库中获取实际的密码数据
        // 暂时使用模拟数据
        this.passwords = [
          {
            id: 1,
            title: 'GitHub',
            username: 'chongtianlidemaizi',
            password: 'password123',
            category: '网站',
            tags: ['重要', '开发'],
            note: 'GitHub账号密码'
          },
          {
            id: 2,
            title: 'QQ',
            username: '1016798793',
            password: 'qqpassword456',
            category: '应用',
            tags: ['个人'],
            note: 'QQ账号密码'
          }
        ]
      } catch (error) {
        console.error('加载密码失败:', error)
      } finally {
        this.loading = false
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
        // 这里可以从数据库中删除密码
        this.passwords = this.passwords.filter(p => p.id !== id)
      } catch (error) {
        console.error('删除密码失败:', error)
      } finally {
        this.loading = false
      }
    },
    async savePassword() {
      this.loading = true
      try {
        const tags = this.form.tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag)
        
        if (this.editingPassword) {
          // 编辑现有密码
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
        } else {
          // 添加新密码
          const newPassword = {
            id: Date.now(),
            title: this.form.title,
            username: this.form.username,
            password: this.form.password,
            category: this.form.category,
            tags,
            note: this.form.note
          }
          this.passwords.push(newPassword)
        }
        
        this.showAddForm = false
        this.resetForm()
      } catch (error) {
        console.error('保存密码失败:', error)
      } finally {
        this.loading = false
      }
    },
    resetForm() {
      this.editingPassword = null
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