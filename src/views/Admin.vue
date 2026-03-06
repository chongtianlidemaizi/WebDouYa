<template>
  <div class="admin">
    <div class="header">
      <h1>{{ $t('admin.title') }}</h1>
      <button class="btn btn-logout" @click="logout">{{ $t('nav.logout') }}</button>
    </div>
    
    <div class="admin-content">
      <div class="sidebar">
        <ul>
          <li :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'">{{ $t('admin.users') }}</li>
          <li :class="{ active: activeTab === 'vip' }" @click="activeTab = 'vip'">{{ $t('admin.vipManagement') }}</li>
          <li :class="{ active: activeTab === 'tools' }" @click="activeTab = 'tools'">{{ $t('admin.tools') }}</li>
        </ul>
      </div>
      
      <div class="main-content">
        <!-- 用户管理 -->
        <div v-if="activeTab === 'users'" class="tab-content">
          <h2>{{ $t('admin.users') }}</h2>
          <div class="search-bar">
            <input type="text" v-model="searchQuery" placeholder="{{ $t('admin.searchUsers') }}">
            <button class="btn btn-search" @click="fetchUsers">{{ $t('common.search') }}</button>
          </div>
          
          <div v-if="loading" class="loading">{{ $t('common.loading') }}</div>
          <table v-else>
            <thead>
              <tr>
                <th>ID</th>
                <th>{{ $t('profile.email') }}</th>
                <th>{{ $t('profile.username') }}</th>
                <th>{{ $t('profile.registrationTime') }}</th>
                <th>{{ $t('profile.accountType') }}</th>
                <th>{{ $t('profile.expires') }}</th>
                <th>{{ $t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td>{{ user.id }}</td>
                <td>{{ user.email }}</td>
                <td>{{ user.user_metadata?.username || $t('profile.notSet') }}</td>
                <td>{{ formatDate(user.created_at) }}</td>
                <td :class="['user-role', user.is_vip ? 'vip' : '']">
                  {{ user.is_vip ? $t('profile.vip') : $t('profile.notVip') }}
                </td>
                <td>{{ user.vip_expires_at ? formatDate(user.vip_expires_at) : $t('admin.none') }}</td>
                <td>
                  <button class="btn btn-edit" @click="editUser(user)">{{ $t('admin.edit') }}</button>
                  <button class="btn btn-delete" @click="deleteUser(user.id)">{{ $t('admin.delete') }}</button>
                </td>
              </tr>
              <tr v-if="users.length === 0">
                <td colspan="7" class="no-data">{{ $t('admin.noUsers') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- 会员管理 -->
        <div v-if="activeTab === 'vip'" class="tab-content">
          <h2>{{ $t('admin.vipManagement') }}</h2>
          <div class="vip-actions">
            <button class="btn btn-primary" @click="openVipModal">{{ $t('admin.addVip') }}</button>
          </div>
          
          <div v-if="loading" class="loading">{{ $t('common.loading') }}</div>
          <table v-else>
            <thead>
              <tr>
                <th>ID</th>
                <th>{{ $t('profile.email') }}</th>
                <th>{{ $t('profile.username') }}</th>
                <th>{{ $t('profile.expires') }}</th>
                <th>{{ $t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in vipUsers" :key="user.id">
                <td>{{ user.id }}</td>
                <td>{{ user.email }}</td>
                <td>{{ user.user_metadata?.username || $t('profile.notSet') }}</td>
                <td>{{ formatDate(user.vip_expires_at) }}</td>
                <td>
                  <button class="btn btn-edit" @click="extendVip(user)">{{ $t('admin.extend') }}</button>
                  <button class="btn btn-delete" @click="removeVip(user.id)">{{ $t('admin.removeVip') }}</button>
                </td>
              </tr>
              <tr v-if="vipUsers.length === 0">
                <td colspan="5" class="no-data">{{ $t('admin.noVipUsers') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- 工具管理 -->
        <div v-if="activeTab === 'tools'" class="tab-content">
          <h2>{{ $t('admin.tools') }}</h2>
          <div class="tool-actions">
            <button class="btn btn-primary" @click="openToolModal">{{ $t('admin.addTool') }}</button>
          </div>
          
          <div v-if="loading" class="loading">{{ $t('common.loading') }}</div>
          <table v-else>
            <thead>
              <tr>
                <th>ID</th>
                <th>{{ $t('admin.toolName') }}</th>
                <th>{{ $t('admin.toolDescription') }}</th>
                <th>{{ $t('admin.createdAt') }}</th>
                <th>{{ $t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tool in tools" :key="tool.id">
                <td>{{ tool.id }}</td>
                <td>{{ tool.name }}</td>
                <td>{{ tool.description }}</td>
                <td>{{ formatDate(tool.created_at) }}</td>
                <td>
                  <button class="btn btn-edit" @click="editTool(tool)">{{ $t('admin.edit') }}</button>
                  <button class="btn btn-delete" @click="deleteTool(tool.id)">{{ $t('admin.delete') }}</button>
                </td>
              </tr>
              <tr v-if="tools.length === 0">
                <td colspan="5" class="no-data">{{ $t('admin.noTools') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- 编辑用户弹窗 -->
    <div v-if="showEditModal" class="modal">
      <div class="modal-content">
        <h3>{{ $t('admin.editUser') }}</h3>
        <form @submit.prevent="saveUser">
          <div class="form-group">
            <label>{{ $t('profile.email') }}</label>
            <input type="email" v-model="editUserForm.email" disabled>
          </div>
          <div class="form-group">
            <label>{{ $t('profile.username') }}</label>
            <input type="text" v-model="editUserForm.username">
          </div>
          <div class="form-group">
            <label>{{ $t('profile.status') }}</label>
            <select v-model="editUserForm.is_vip">
              <option value="false">{{ $t('profile.notVip') }}</option>
              <option value="true">{{ $t('profile.vip') }}</option>
            </select>
          </div>
          <div class="form-group" v-if="editUserForm.is_vip === 'true'">
            <label>{{ $t('profile.expires') }}</label>
            <input type="date" v-model="editUserForm.vip_expires_at">
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="showEditModal = false">{{ $t('common.cancel') }}</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">{{ $t('common.save') }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '../supabase'

export default {
  name: 'Admin',
  data() {
    return {
      activeTab: 'users',
      users: [],
      vipUsers: [],
      tools: [],
      searchQuery: '',
      loading: false,
      showEditModal: false,
      editUserForm: {
        id: '',
        email: '',
        username: '',
        is_vip: 'false',
        vip_expires_at: ''
      }
    }
  },
  mounted() {
    this.checkAdmin()
    this.fetchUsers()
    this.fetchVipUsers()
    this.fetchTools()
  },
  methods: {
    async checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        this.$router.push('/login')
      }
      // 这里可以添加管理员权限检查逻辑
    },
    async fetchUsers() {
      this.loading = true
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*, auth.users(user_metadata, email, created_at)')
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('获取用户列表失败:', error)
          return
        }
        
        this.users = data.map(item => ({
          id: item.id,
          email: item.auth?.users?.email || '未知',
          user_metadata: item.auth?.users?.user_metadata || {},
          created_at: item.auth?.users?.created_at || item.created_at,
          is_vip: item.is_vip,
          vip_expires_at: item.vip_expires_at
        }))
      } catch (error) {
        console.error('获取用户列表时出错:', error)
      } finally {
        this.loading = false
      }
    },
    async fetchVipUsers() {
      this.loading = true
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*, auth.users(user_metadata, email)')
          .eq('is_vip', true)
          .order('vip_expires_at', { ascending: false })
        
        if (error) {
          console.error('获取会员列表失败:', error)
          return
        }
        
        this.vipUsers = data.map(item => ({
          id: item.id,
          email: item.auth?.users?.email || '未知',
          user_metadata: item.auth?.users?.user_metadata || {},
          vip_expires_at: item.vip_expires_at
        }))
      } catch (error) {
        console.error('获取会员列表时出错:', error)
      } finally {
        this.loading = false
      }
    },
    async fetchTools() {
      this.loading = true
      try {
        const { data, error } = await supabase
          .from('tools')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('获取工具列表失败:', error)
          return
        }
        
        this.tools = data
      } catch (error) {
        console.error('获取工具列表时出错:', error)
      } finally {
        this.loading = false
      }
    },
    async deleteUser(id) {
      if (!confirm(this.$t('admin.confirmDeleteUser'))) {
        return
      }
      
      this.loading = true
      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', id)
        
        if (error) {
          console.error('删除用户失败:', error)
          alert(this.$t('admin.deleteFailed'))
          return
        }
        
        // 同时删除认证用户
        const { error: authError } = await supabase.auth.admin.deleteUser(id)
        if (authError) {
          console.error('删除认证用户失败:', authError)
        }
        
        await this.fetchUsers()
        await this.fetchVipUsers()
      } catch (error) {
        console.error('删除用户时出错:', error)
        alert(this.$t('admin.deleteFailed'))
      } finally {
        this.loading = false
      }
    },
    editUser(user) {
      this.editUserForm = {
        id: user.id,
        email: user.email,
        username: user.user_metadata?.username || '',
        is_vip: user.is_vip ? 'true' : 'false',
        vip_expires_at: user.vip_expires_at ? new Date(user.vip_expires_at).toISOString().split('T')[0] : ''
      }
      this.showEditModal = true
    },
    async saveUser() {
      this.loading = true
      try {
        // 更新用户元数据
        const { error: metadataError } = await supabase.auth.admin.updateUserById(this.editUserForm.id, {
          data: { username: this.editUserForm.username }
        })
        
        if (metadataError) {
          console.error('更新用户元数据失败:', metadataError)
        }
        
        // 更新用户表
        const { error } = await supabase
          .from('users')
          .update({
            is_vip: this.editUserForm.is_vip === 'true',
            vip_expires_at: this.editUserForm.is_vip === 'true' ? this.editUserForm.vip_expires_at : null
          })
          .eq('id', this.editUserForm.id)
        
        if (error) {
          console.error('更新用户失败:', error)
          alert(this.$t('admin.updateFailed'))
          return
        }
        
        this.showEditModal = false
        await this.fetchUsers()
        await this.fetchVipUsers()
      } catch (error) {
        console.error('更新用户时出错:', error)
        alert(this.$t('admin.updateFailed'))
      } finally {
        this.loading = false
      }
    },
    async extendVip(user) {
      // 计算新的到期时间（延长一年）
      const currentExpiry = user.vip_expires_at ? new Date(user.vip_expires_at) : new Date()
      const newExpiry = new Date(currentExpiry)
      newExpiry.setFullYear(newExpiry.getFullYear() + 1)
      
      this.loading = true
      try {
        const { error } = await supabase
          .from('users')
          .update({
            vip_expires_at: newExpiry.toISOString()
          })
          .eq('id', user.id)
        
        if (error) {
          console.error('续期会员失败:', error)
          alert(this.$t('admin.extendFailed'))
          return
        }
        
        await this.fetchVipUsers()
      } catch (error) {
        console.error('续期会员时出错:', error)
        alert(this.$t('admin.extendFailed'))
      } finally {
        this.loading = false
      }
    },
    async removeVip(id) {
      if (!confirm(this.$t('admin.confirmRemoveVip'))) {
        return
      }
      
      this.loading = true
      try {
        const { error } = await supabase
          .from('users')
          .update({
            is_vip: false,
            vip_expires_at: null
          })
          .eq('id', id)
        
        if (error) {
          console.error('取消会员失败:', error)
          alert(this.$t('admin.removeFailed'))
          return
        }
        
        await this.fetchUsers()
        await this.fetchVipUsers()
      } catch (error) {
        console.error('取消会员时出错:', error)
        alert(this.$t('admin.removeFailed'))
      } finally {
        this.loading = false
      }
    },
    async deleteTool(id) {
      if (!confirm(this.$t('admin.confirmDeleteTool'))) {
        return
      }
      
      this.loading = true
      try {
        const { error } = await supabase
          .from('tools')
          .delete()
          .eq('id', id)
        
        if (error) {
          console.error('删除工具失败:', error)
          alert(this.$t('admin.deleteFailed'))
          return
        }
        
        await this.fetchTools()
      } catch (error) {
        console.error('删除工具时出错:', error)
        alert(this.$t('admin.deleteFailed'))
      } finally {
        this.loading = false
      }
    },
    openVipModal() {
      // 打开添加会员弹窗
      alert(this.$t('admin.featureInDevelopment'))
    },
    openToolModal() {
      // 打开添加工具弹窗
      alert(this.$t('admin.featureInDevelopment'))
    },
    editTool(tool) {
      // 编辑工具
      alert(this.$t('admin.featureInDevelopment'))
    },
    formatDate(date) {
      if (!date) return this.$t('admin.unknown')
      const locale = this.$i18n.locale
      return new Date(date).toLocaleString(locale)
    },
    async logout() {
      await supabase.auth.signOut()
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.admin {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  background: #2c3e50;
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  margin: 0;
  font-size: 20px;
}

.admin-content {
  display: flex;
  min-height: calc(100vh - 70px);
}

.sidebar {
  width: 200px;
  background: white;
  box-shadow: 2px 0 5px rgba(0,0,0,0.1);
}

.sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar li {
  padding: 15px 20px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
  transition: background 0.3s;
}

.sidebar li:hover {
  background: #f8f9fa;
}

.sidebar li.active {
  background: #3498db;
  color: white;
}

.main-content {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}

.tab-content h2 {
  color: #2c3e50;
  margin-bottom: 20px;
}

.search-bar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.search-bar input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
  font-size: 14px;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.btn-edit {
  background: #3498db;
  color: white;
  margin-right: 5px;
}

.btn-delete {
  background: #e74c3c;
  color: white;
}

.btn-logout {
  background: #e74c3c;
  color: white;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border-radius: 8px;
  overflow: hidden;
}

th, td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background: #f8f9fa;
  font-weight: bold;
  color: #34495e;
}

tr:hover {
  background: #f8f9fa;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #666;
}

.user-role {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.user-role.vip {
  background: #fff3cd;
  color: #856404;
}

.vip-actions,
.tool-actions {
  margin-bottom: 20px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.modal-content h3 {
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
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:disabled {
  background: #f8f9fa;
  cursor: not-allowed;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .admin-content {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
  }
  
  .sidebar ul {
    display: flex;
    overflow-x: auto;
  }
  
  .sidebar li {
    border-bottom: none;
    border-right: 1px solid #eee;
  }
  
  table {
    font-size: 12px;
  }
  
  th, td {
    padding: 8px 10px;
  }
}
</style>