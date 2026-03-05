import { supabase } from './supabase'

export async function initDatabase() {
  try {
    // 初始化密码表
    await initPasswordsTable()
    
    console.log('数据库初始化成功')
    return true
  } catch (error) {
    console.error('初始化数据库时出错:', error)
    return false
  }
}

async function initPasswordsTable() {
  try {
    // 尝试查询密码表，检查是否存在
    const { error } = await supabase.from('passwords').select('*').limit(1)
    
    // 如果表不存在，会返回错误
    if (error && error.code === '42P01') { // 42P01 = undefined_table
      console.log('密码表不存在，正在创建...')
      
      // 由于前端JavaScript客户端无法直接执行DDL语句
      // 我们会在控制台提示用户创建表
      console.log('请在Supabase控制台执行以下SQL语句创建密码表:')
      console.log(`
        CREATE TABLE passwords (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          username TEXT,
          password TEXT NOT NULL,
          category TEXT,
          tags TEXT[],
          note TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        
        -- 创建更新时间触发器
        CREATE OR REPLACE FUNCTION update_passwords_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        CREATE TRIGGER update_passwords_updated_at
        BEFORE UPDATE ON passwords
        FOR EACH ROW
        EXECUTE FUNCTION update_passwords_updated_at();
        
        -- 创建RPC函数用于前端调用
        CREATE OR REPLACE FUNCTION create_passwords_table()
        RETURNS void AS $$
        BEGIN
          -- 表已在上面创建
          RETURN;
        END;
        $$ LANGUAGE plpgsql;
      `)
      
      return false
    } else if (error) {
      console.error('检查密码表时出错:', error)
      return false
    }
    
    console.log('密码表已存在，初始化成功')
    return true
  } catch (error) {
    console.error('初始化密码表时出错:', error)
    return false
  }
}

// 测试数据库连接
export async function testConnection() {
  try {
    const { data, error } = await supabase.from('passwords').select('*').limit(1)
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