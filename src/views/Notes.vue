<template>
  <div class="notes">
    <div class="header">
      <h1>记事管理</h1>
      <div class="header-right">
        <div class="note-limit">
          {{ noteCount }}/{{ currentNoteLimit }} 个记事
        </div>
        <button class="btn-add" @click="showAddForm = true" :disabled="!canAddNote">添加记事</button>
      </div>
    </div>
    
    <div class="filter-section">
      <div class="filter-group">
        <label>搜索</label>
        <input type="text" v-model="filter.search" placeholder="搜索记事...">
      </div>
    </div>
    
    <div class="notes-list">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="filteredNotes.length === 0" class="empty">
        <p>暂无记事</p>
        <button class="btn" @click="showAddForm = true">添加第一个记事</button>
      </div>
      <div v-else class="notes-grid">
        <div v-for="note in filteredNotes" :key="note.id" class="note-card">
          <div class="note-header">
            <h3>{{ note.title }}</h3>
            <div class="note-actions">
              <button class="btn-action" @click="editNote(note)">✏️</button>
              <button class="btn-action" @click="deleteNote(note.id)">🗑️</button>
            </div>
          </div>
          <div class="note-content">
            <p>{{ note.content }}</p>
          </div>
          <div class="note-footer">
            <span class="note-date">{{ formatDate(note.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 添加/编辑记事表单 -->
    <div v-if="showAddForm" class="modal-overlay" @click="showAddForm = false">
      <div class="modal" @click.stop>
        <h2>{{ editingNote ? '编辑记事' : '添加记事' }}</h2>
        <form @submit.prevent="saveNote">
          <div class="form-group">
            <label>标题</label>
            <input type="text" v-model="form.title" required>
          </div>
          <div class="form-group">
            <label>内容</label>
            <textarea v-model="form.content" rows="10" required placeholder="输入记事内容..."></textarea>
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
  name: 'Notes',
  data() {
    return {
      notes: [],
      filter: {
        search: ''
      },
      showAddForm: false,
      editingNote: null,
      form: {
        title: '',
        content: ''
      },
      loading: false,
      user: null,
      isVip: false,
      noteLimit: 6, // 普通用户限制
      vipNoteLimit: 32, // 会员用户限制
      noteCount: 0
    }
  },
  computed: {
    filteredNotes() {
      return this.notes.filter(note => {
        return !this.filter.search || 
          note.title.toLowerCase().includes(this.filter.search.toLowerCase()) ||
          note.content.toLowerCase().includes(this.filter.search.toLowerCase())
      })
    },
    currentNoteLimit() {
      return this.isVip ? this.vipNoteLimit : this.noteLimit
    },
    canAddNote() {
      return this.noteCount < this.currentNoteLimit
    }
  },
  mounted() {
    this.init()
  },
  methods: {
    async init() {
      await this.loadUser()
      await this.loadNotes()
    },
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
    async loadNotes() {
      if (!this.user) return
      
      this.loading = true
      try {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', this.user.id)
          .order('created_at', { ascending: false })
        
        if (error) {
          throw error
        }
        
        this.notes = data || []
        this.noteCount = this.notes.length
      } catch (error) {
        console.error('加载记事失败:', error)
        this.notes = []
        this.noteCount = 0
      } finally {
        this.loading = false
      }
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    editNote(note) {
      this.editingNote = note
      this.form = {
        title: note.title,
        content: note.content
      }
      this.showAddForm = true
    },
    async deleteNote(id) {
      if (!confirm('确定要删除这个记事吗？')) {
        return
      }
      
      this.loading = true
      try {
        const { error } = await supabase
          .from('notes')
          .delete()
          .eq('id', id)
        
        if (error) {
          throw error
        }
        
        this.notes = this.notes.filter(n => n.id !== id)
        this.noteCount = this.notes.length
      } catch (error) {
        console.error('删除记事失败:', error)
      } finally {
        this.loading = false
      }
    },
    async saveNote() {
      // 检查是否达到记事数量限制
      if (!this.editingNote && !this.canAddNote) {
        alert(`您已达到记事存储限制（${this.currentNoteLimit}个），升级为会员可存储更多记事`)
        return
      }
      
      this.loading = true
      try {
        if (this.editingNote) {
          // 编辑现有记事
          const { error } = await supabase
            .from('notes')
            .update({
              title: this.form.title,
              content: this.form.content
            })
            .eq('id', this.editingNote.id)
          
          if (error) {
            throw error
          }
          
          const index = this.notes.findIndex(n => n.id === this.editingNote.id)
          if (index !== -1) {
            this.notes[index] = {
              ...this.notes[index],
              title: this.form.title,
              content: this.form.content
            }
          }
        } else {
          // 添加新记事
          const { data, error } = await supabase
            .from('notes')
            .insert({
              user_id: this.user.id,
              title: this.form.title,
              content: this.form.content
            })
            .select()
          
          if (error) {
            throw error
          }
          
          if (data && data[0]) {
            this.notes.unshift(data[0])
            this.noteCount++
          }
        }
        
        this.showAddForm = false
        this.resetForm()
      } catch (error) {
        console.error('保存记事失败:', error)
      } finally {
        this.loading = false
      }
    },
    resetForm() {
      this.editingNote = null
      this.form = {
        title: '',
        content: ''
      }
    }
  }
}
</script>

<style scoped>
.notes {
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

.note-limit {
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
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.filter-group label {
  display: block;
  margin-bottom: 8px;
  color: #666;
  font-weight: 500;
}

.filter-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.notes-list {
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

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.note-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  transition: box-shadow 0.3s;
  background: #fff;
}

.note-card:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.note-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
}

.note-actions {
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

.note-content {
  margin-bottom: 15px;
  line-height: 1.5;
  color: #333;
}

.note-content p {
  margin: 0;
  white-space: pre-wrap;
}

.note-footer {
  border-top: 1px solid #eee;
  padding-top: 10px;
  text-align: right;
}

.note-date {
  font-size: 12px;
  color: #999;
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
  max-width: 600px;
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
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group textarea {
  resize: vertical;
  min-height: 200px;
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
  .notes-grid {
    grid-template-columns: 1fr;
  }
}
</style>