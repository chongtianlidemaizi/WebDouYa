<template>
  <div class="register">
    <div class="register-container">
      <h1>注册账号</h1>
      <form @submit.prevent="register">
        <div class="form-group">
          <label>邮箱</label>
          <input type="email" v-model="form.email" required placeholder="请输入邮箱">
        </div>
        <div class="form-group">
          <label>密码</label>
          <input type="password" v-model="form.password" required placeholder="请输入密码" minlength="6">
        </div>
        <div class="form-group">
          <label>确认密码</label>
          <input type="password" v-model="form.confirmPassword" required placeholder="请确认密码">
        </div>
        <div class="form-group">
          <label>用户名</label>
          <input type="text" v-model="form.username" required placeholder="请输入用户名">
        </div>
        <button type="submit" class="btn" :disabled="loading">注册</button>
        <p class="login-link">已有账号？<router-link to="/login">立即登录</router-link></p>
      </form>
      <div v-if="error" class="error-message">{{ error }}</div>
      <div v-if="success" class="success-message">{{ success }}</div>
    </div>
  </div>
</template>

<script>
import { supabase } from '../supabase'

export default {
  name: 'Register',
  data() {
    return {
      form: {
        email: '',
        password: '',
        confirmPassword: '',
        username: ''
      },
      loading: false,
      error: '',
      success: ''
    }
  },
  methods: {
    async register() {
      if (this.form.password !== this.form.confirmPassword) {
        this.error = '两次输入的密码不一致'
        return
      }
      
      this.loading = true
      this.error = ''
      this.success = ''
      
      try {
        // 注册用户
        const { error: signUpError } = await supabase.auth.signUp({
          email: this.form.email,
          password: this.form.password,
          options: {
            data: {
              username: this.form.username,
              role: 'user' // 默认普通用户
            }
          }
        })
        
        if (signUpError) {
          this.error = signUpError.message
          return
        }
        
        // 注册成功后自动登录
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: this.form.email,
          password: this.form.password
        })
        
        if (signInError) {
          this.error = signInError.message
          return
        }
        
        // 登录成功，存储用户信息到localStorage
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user))
        }
        
        this.success = '注册成功，正在跳转...'
        setTimeout(() => {
          this.$router.push('/home')
        }, 1500)
      } catch (error) {
        this.error = '注册失败，请重试'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.register {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.register-container {
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #2c3e50;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #666;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.form-group input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52,152,219,0.2);
}

.btn {
  width: 100%;
  padding: 12px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
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

.login-link {
  text-align: center;
  margin-top: 20px;
  color: #666;
}

.login-link a {
  color: #3498db;
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  margin-top: 15px;
  text-align: center;
}

.success-message {
  background: #d4edda;
  color: #155724;
  padding: 10px;
  border-radius: 4px;
  margin-top: 15px;
  text-align: center;
}
</style>