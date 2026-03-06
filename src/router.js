import { createRouter, createWebHistory } from 'vue-router'
import Register from './views/Register.vue'
import Login from './views/Login.vue'
import Home from './views/Home.vue'
import PasswordManager from './views/PasswordManager.vue'
import Notes from './views/Notes.vue'
import Profile from './views/Profile.vue'
import { supabase } from './supabase'

const routes = [
  {
    path: '/',
    name: 'Root',
    component: Login // 默认显示登录页面
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/home',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: '/passwords',
    name: 'PasswordManager',
    component: PasswordManager,
    meta: { requiresAuth: true }
  },
  {
    path: '/notes',
    name: 'Notes',
    component: Notes,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  // 处理根路径的重定向
  if (to.path === '/') {
    const { data: { user } } = await supabase.auth.getUser()
    // 检查是否有保存的登录信息
    const savedLogin = localStorage.getItem('savedLogin')
    if (user || savedLogin) {
      // 有账户，跳转到登录页
      next('/login')
    } else {
      // 没有登录过，跳转到注册页
      next('/register')
    }
  } else {
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
    
    if (requiresAuth) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // 未登录，跳转到登录页
        next('/login')
      } else {
        next()
      }
    } else {
      next()
    }
  }
})

export default router