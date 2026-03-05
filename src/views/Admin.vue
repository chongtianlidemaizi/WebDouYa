<template>
  <div class="admin">
    <h2>管理后台</h2>
    <div class="admin-content">
      <div class="transaction-form">
        <h3>添加交易记录</h3>
        <form @submit.prevent="addTransaction">
          <div class="form-group">
            <label>交易名称</label>
            <input type="text" v-model="newTransaction.name" required>
          </div>
          <div class="form-group">
            <label>金额</label>
            <input type="number" v-model="newTransaction.amount" required step="0.01">
          </div>
          <div class="form-group">
            <label>日期</label>
            <input type="date" v-model="newTransaction.date" required>
          </div>
          <button type="submit" class="btn" :disabled="loading">添加</button>
        </form>
      </div>
      <div class="transaction-list">
        <h3>交易记录列表</h3>
        <div v-if="loading" class="loading">加载中...</div>
        <table v-else>
          <thead>
            <tr>
              <th>ID</th>
              <th>名称</th>
              <th>金额</th>
              <th>日期</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="transaction in transactions" :key="transaction.id">
              <td>{{ transaction.id }}</td>
              <td>{{ transaction.name }}</td>
              <td>¥{{ transaction.amount }}</td>
              <td>{{ transaction.date }}</td>
              <td>
                <button class="btn btn-edit" @click="editTransaction(transaction)">编辑</button>
                <button class="btn btn-delete" @click="deleteTransaction(transaction.id)">删除</button>
              </td>
            </tr>
            <tr v-if="transactions.length === 0">
              <td colspan="5" class="no-data">暂无交易记录</td>
            </tr>
          </tbody>
        </table>
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
      newTransaction: {
        name: '',
        amount: '',
        date: ''
      },
      transactions: [],
      loading: false
    }
  },
  mounted() {
    this.fetchTransactions()
  },
  methods: {
    async fetchTransactions() {
      this.loading = true
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('获取交易记录失败:', error)
          return
        }
        
        this.transactions = data
      } catch (error) {
        console.error('获取交易记录时出错:', error)
      } finally {
        this.loading = false
      }
    },
    async addTransaction() {
      this.loading = true
      try {
        const { error } = await supabase
          .from('transactions')
          .insert({
            name: this.newTransaction.name,
            amount: parseFloat(this.newTransaction.amount),
            date: this.newTransaction.date
          })
        
        if (error) {
          console.error('添加交易记录失败:', error)
          alert('添加失败，请重试')
          return
        }
        
        // 重置表单
        this.newTransaction = { name: '', amount: '', date: '' }
        // 重新获取数据
        await this.fetchTransactions()
      } catch (error) {
        console.error('添加交易记录时出错:', error)
        alert('添加失败，请重试')
      } finally {
        this.loading = false
      }
    },
    async editTransaction(transaction) {
      // 编辑逻辑
      alert('编辑功能开发中')
    },
    async deleteTransaction(id) {
      if (!confirm('确定要删除这条交易记录吗？')) {
        return
      }
      
      this.loading = true
      try {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', id)
        
        if (error) {
          console.error('删除交易记录失败:', error)
          alert('删除失败，请重试')
          return
        }
        
        // 重新获取数据
        await this.fetchTransactions()
      } catch (error) {
        console.error('删除交易记录时出错:', error)
        alert('删除失败，请重试')
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.admin {
  padding: 20px;
}

h2 {
  margin-bottom: 20px;
  color: #2c3e50;
}

.admin-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 30px;
}

.transaction-form {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.transaction-form h3 {
  margin-bottom: 15px;
  color: #34495e;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #666;
}

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn:hover {
  opacity: 0.8;
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

.transaction-list {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.transaction-list h3 {
  margin-bottom: 15px;
  color: #34495e;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background: #f8f9fa;
  font-weight: bold;
  color: #34495e;
}

@media (max-width: 768px) {
  .admin-content {
    grid-template-columns: 1fr;
  }
}
</style>