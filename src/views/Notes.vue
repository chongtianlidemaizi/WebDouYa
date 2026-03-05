<template>
  <div class="notes">
    <div class="header">
      <h1>记事管理</h1>
      <button class="btn-add" @click="showAddForm = true">添加记事</button>
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
            <span class="note-date">{{ formatDate(note.createdAt) }}</span>
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
      loading: false
    }
  },
  computed: {
    filteredNotes() {
      return this.notes.filter(note => {
        return !this.filter.search || 
          note.title.toLowerCase().includes(this.filter.search.toLowerCase()) ||
          note.content.toLowerCase().includes(this.filter.search.toLowerCase())
      })
    }
  },
  mounted() {
    this.loadNotes()
  },
  methods: {
    async loadNotes() {
      this.loading = true
      try {
        // 这里可以从数据库中获取实际的记事数据
        // 暂时使用模拟数据
        this.notes = [
          {
            id: 1,
            title: '购物清单',
            content: '1. 牛奶\n2. 鸡蛋\n3. 面包\n4. 蔬菜',
            createdAt: new Date()
          },
          {
            id: 2,
            title: '工作计划',
            content: '完成项目提案\n准备周会演示\n回复客户邮件',
            createdAt: new Date(Date.now() - 86400000)
          }
        ]
      } catch (error) {
        console.error('加载记事失败:', error)
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
        // 这里可以从数据库中删除记事
        this.notes = this.notes.filter(n => n.id !== id)
      } catch (error) {
        console.error('删除记事失败:', error)
      } finally {
        this.loading = false
      }
    },
    async saveNote() {
      this.loading = true
      try {
        if (this.editingNote) {
          // 编辑现有记事
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
          const newNote = {
            id: Date.now(),
            title: this.form.title,
            content: this.form.content,
            createdAt: new Date()
          }
          this.notes.push(newNote)
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