<template>
  <div class="home">
    <h2>首页</h2>
    <div class="intro">
      <p>欢迎使用交易周记录系统</p>
      <p>这是一个用于记录和管理交易数据的系统</p>
    </div>
    <div class="stats">
      <div class="stat-card">
        <h3>总交易数</h3>
        <p>{{ totalTransactions }}</p>
      </div>
      <div class="stat-card">
        <h3>本周交易</h3>
        <p>{{ weeklyTransactions }}</p>
      </div>
      <div class="stat-card">
        <h3>总金额</h3>
        <p>{{ totalAmount }}</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home',
  data() {
    return {
      totalTransactions: 128,
      weeklyTransactions: 24,
      totalAmount: '¥12,800'
    }
  }
}
</script>

<style scoped>
.home {
  padding: 20px;
}

h2 {
  margin-bottom: 20px;
  color: #2c3e50;
}

.intro {
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
}

.stat-card h3 {
  color: #666;
  margin-bottom: 10px;
}

.stat-card p {
  font-size: 24px;
  font-weight: bold;
  color: #3498db;
}
</style>