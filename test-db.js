import { supabase } from './src/supabase.js'

async function testDatabase() {
  console.log('开始测试数据库连接...')
  
  // 测试连接
  try {
    const { data, error } = await supabase.from('users').select('*').limit(1)
    if (error) {
      console.error('连接测试失败:', error)
    } else {
      console.log('连接测试成功')
    }
  } catch (error) {
    console.error('连接测试出错:', error)
  }
  
  // 测试密码表
  try {
    const { data, error } = await supabase.from('passwords').select('*').limit(1)
    if (error) {
      console.error('密码表测试失败:', error)
    } else {
      console.log('密码表测试成功')
      console.log('密码表数据:', data)
    }
  } catch (error) {
    console.error('密码表测试出错:', error)
  }
  
  // 测试用户
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      console.log('用户测试成功:', user.id, user.email)
    } else {
      console.log('未登录')
    }
  } catch (error) {
    console.error('用户测试出错:', error)
  }
}

testDatabase()
