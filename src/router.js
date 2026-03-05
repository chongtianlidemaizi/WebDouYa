import { createRouter, createWebHistory } from 'vue-router'
import Register from './views/Register.vue'
import Login from './views/Login.vue'
import Home from './views/Home.vue'
import PasswordManager from './views/PasswordManager.vue'
import Notes from './views/Notes.vue'
import Profile from './views/Profile.vue'

const routes = [
  {
    path: '/',
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
    component: Home
  },
  {
    path: '/passwords',
    name: 'PasswordManager',
    component: PasswordManager
  },
  {
    path: '/notes',
    name: 'Notes',
    component: Notes
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router