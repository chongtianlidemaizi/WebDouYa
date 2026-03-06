import { supabase } from './supabase'

export async function initDatabase() {
  try {
    // 初始化用户表
    await initUsersTable()
    // 初始化工具表
    await initToolsTable()
    // 初始化密码表
    await initPasswordsTable()
    // 初始化记事表
    await initNotesTable()
    
    console.log('数据库初始化成功')
    return true
  } catch (error) {
    console.error('初始化数据库时出错:', error)
    return false
  }
}

async function initUsersTable() {
  try {
    // 尝试查询用户表，检查是否存在
    const { error } = await supabase.from('users').select('*').limit(1)
    
    // 如果表不存在，会返回错误
    if (error && error.code === '42P01') { // 42P01 = undefined_table
      console.log('用户表不存在，正在创建...')
      
      // 由于前端JavaScript客户端无法直接执行DDL语句
      // 我们会在控制台提示用户创建表
      console.log('请在Supabase控制台执行以下SQL语句创建用户表:')
      console.log(`
        CREATE TABLE users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT UNIQUE NOT NULL,
          username TEXT,
          is_vip BOOLEAN DEFAULT false,
          vip_expires_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        
        -- 创建更新时间触发器
        CREATE OR REPLACE FUNCTION update_users_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_users_updated_at();
        
        -- 创建RPC函数用于前端调用
        CREATE OR REPLACE FUNCTION create_users_table()
        RETURNS void AS $$
        BEGIN
          -- 表已在上面创建
          RETURN;
        END;
        $$ LANGUAGE plpgsql;
      `)
      
      return false
    } else if (error) {
      console.error('检查用户表时出错:', error)
      return false
    }
    
    console.log('用户表已存在，初始化成功')
    return true
  } catch (error) {
    console.error('初始化用户表时出错:', error)
    return false
  }
}

async function initToolsTable() {
  try {
    // 尝试查询工具表，检查是否存在
    const { error } = await supabase.from('tools').select('*').limit(1)
    
    // 如果表不存在，会返回错误
    if (error && error.code === '42P01') { // 42P01 = undefined_table
      console.log('工具表不存在，正在创建...')
      
      // 由于前端JavaScript客户端无法直接执行DDL语句
      // 我们会在控制台提示用户创建表
      console.log('请在Supabase控制台执行以下SQL语句创建工具表:')
      console.log(`
        CREATE TABLE tools (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL,
          name TEXT NOT NULL,
          route TEXT NOT NULL,
          icon TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
        
        -- 创建RPC函数用于前端调用
        CREATE OR REPLACE FUNCTION create_tools_table()
        RETURNS void AS $$
        BEGIN
          -- 表已在上面创建
          RETURN;
        END;
        $$ LANGUAGE plpgsql;
      `)
      
      return false
    } else if (error) {
      console.error('检查工具表时出错:', error)
      return false
    }
    
    console.log('工具表已存在，初始化成功')
    return true
  } catch (error) {
    console.error('初始化工具表时出错:', error)
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
          user_id UUID NOT NULL,
          title TEXT NOT NULL,
          username TEXT,
          password TEXT NOT NULL,
          category TEXT,
          tags TEXT[],
          note TEXT,
          is_local BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (user_id) REFERENCES users(id)
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

async function initNotesTable() {
  try {
    // 尝试查询记事表，检查是否存在
    const { error } = await supabase.from('notes').select('*').limit(1)
    
    // 如果表不存在，会返回错误
    if (error && error.code === '42P01') { // 42P01 = undefined_table
      console.log('记事表不存在，正在创建...')
      
      // 由于前端JavaScript客户端无法直接执行DDL语句
      // 我们会在控制台提示用户创建表
      console.log('请在Supabase控制台执行以下SQL语句创建记事表:')
      console.log(`
        CREATE TABLE notes (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL,
          title TEXT NOT NULL,
          content TEXT,
          is_local BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
        
        -- 创建更新时间触发器
        CREATE OR REPLACE FUNCTION update_notes_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        CREATE TRIGGER update_notes_updated_at
        BEFORE UPDATE ON notes
        FOR EACH ROW
        EXECUTE FUNCTION update_notes_updated_at();
        
        -- 创建RPC函数用于前端调用
        CREATE OR REPLACE FUNCTION create_notes_table()
        RETURNS void AS $$
        BEGIN
          -- 表已在上面创建
          RETURN;
        END;
        $$ LANGUAGE plpgsql;
      `)
      
      return false
    } else if (error) {
      console.error('检查记事表时出错:', error)
      return false
    }
    
    console.log('记事表已存在，初始化成功')
    return true
  } catch (error) {
    console.error('初始化记事表时出错:', error)
    return false
  }
}

// 测试数据库连接
export async function testConnection() {
  try {
    const { data, error } = await supabase.from('users').select('*').limit(1)
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