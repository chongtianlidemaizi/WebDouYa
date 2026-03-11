<template>
  <div class="login">
    <div class="login-container">
      <h1>{{ $t('login.title') }}</h1>
      <form @submit.prevent="login">
        <div class="form-group">
          <label>{{ $t('login.email') }}</label>
          <input type="email" v-model="form.email" required :placeholder="$t('login.emailPlaceholder')">
        </div>
        <div class="form-group">
          <label>{{ $t('login.password') }}</label>
          <input type="password" v-model="form.password" required :placeholder="$t('login.passwordPlaceholder')">
        </div>
        <div class="form-group remember">
          <input type="checkbox" v-model="form.remember">
          <label>{{ $t('login.remember') }}</label>
        </div>
        <button type="submit" class="btn" :disabled="loading">{{ $t('login.login') }}</button>
        <p class="register-link">{{ $t('login.register') }}<router-link to="/"> {{ $t('login.registerNow') }}</router-link></p>
      </form>
      <div v-if="error" class="error-message">{{ error }}</div>
    </div>
  </div>
</template>

<script>
import { supabase } from '../supabase'

export default {
  name: 'Login',
  data() {
    return {
      form: {
        email: '',
        password: '',
        remember: false
      },
      loading: false,
      error: ''
    }
  },
  mounted() {
    // 从localStorage加载保存的登录信息
    this.loadSavedLogin()
    // 自动填充测试账户和密码
    if (!this.form.email) {
      this.form.email = '2075289757@qq.com'
      this.form.password = '694071728Yll'
      this.form.remember = true
    }
  },
  methods: {
    loadSavedLogin() {
      const savedLogin = localStorage.getItem('savedLogin')
      if (savedLogin) {
        try {
          const loginData = JSON.parse(savedLogin)
          this.form.email = loginData.email
          this.form.password = loginData.password
          this.form.remember = true
        } catch (error) {
          console.error('加载保存的登录信息失败:', error)
        }
      }
    },
    async login() {
      this.loading = true
      this.error = ''
      
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: this.form.email,
          password: this.form.password
        })
        
        if (error) {
          this.error = error.message
          return
        }
        
        // 登录成功，存储用户信息到localStorage
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user))
          
          // 如果用户选择记住我，保存登录信息
          if (this.form.remember) {
            localStorage.setItem('savedLogin', JSON.stringify({
              email: this.form.email,
              password: this.form.password
            }))
          } else {
            // 否则清除保存的登录信息
            localStorage.removeItem('savedLogin')
          }
        }
        
        // 跳转到首页
        this.$router.push('/home')
      } catch (error) {
        this.error = '登录失败，请重试'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.login-container {
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

.register-link {
  text-align: center;
  margin-top: 20px;
  color: #666;
}

.register-link a {
  color: #3498db;
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}

.remember {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.remember input[type="checkbox"] {
  width: auto;
}

.remember label {
  margin: 0;
  cursor: pointer;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  margin-top: 15px;
  text-align: center;
}
</style>