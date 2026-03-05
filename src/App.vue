<template>
  <div id="app">
    <h1>交易周记录</h1>
    <div class="container">
      <div class="sidebar">
        <nav>
          <router-link to="/">首页</router-link>
          <router-link to="/admin">管理后台</router-link>
        </nav>
      </div>
      <div class="main-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #333;
}

#app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #2c3e50;
}

.container {
  display: flex;
  gap: 20px;
}

.sidebar {
  width: 200px;
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
}

.sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sidebar a {
  text-decoration: none;
  color: #333;
  padding: 10px;
  border-radius: 4px;
  transition: background 0.3s;
}

.sidebar a:hover {
  background: #e0e0e0;
}

.main-content {
  flex: 1;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>