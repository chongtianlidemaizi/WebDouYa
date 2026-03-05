import { supabase } from './supabase'

export async function initDatabase() {
  try {
    // 尝试查询表，检查是否存在
    const { error } = await supabase.from('transactions').select('*').limit(1)
    
    // 如果表不存在，会返回错误
    if (error && error.code === '42P01') { // 42P01 = undefined_table
      console.log('表不存在，正在创建...')
      
      // 这里我们需要通过Supabase控制台或SQL编辑器创建表
      // 由于前端JavaScript客户端无法直接执行DDL语句
      // 我们会在控制台提示用户创建表
      console.log('请在Supabase控制台执行以下SQL语句创建表:')
      console.log(`
        CREATE TABLE transactions (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          amount NUMERIC(10,2) NOT NULL,
          date DATE NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `)
      
      return false
    } else if (error) {
      console.error('检查表时出错:', error)
      return false
    }
    
    console.log('数据库表已存在，初始化成功')
    return true
  } catch (error) {
    console.error('初始化数据库时出错:', error)
    return false
  }
}

// 测试数据库连接
export async function testConnection() {
  try {
    const { data, error } = await supabase.from('transactions').select('*').limit(1)
    if (error) {
      console.error('连接测试失败:', error)
      return false
    }
    console.log('连接测试成功')
    return true
  } catch (error) {
    console.error('连接测试时出错:', error)
    return false
  }
}