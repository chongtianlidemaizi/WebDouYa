import { supabase } from './src/supabase.js'

async function fixDatabase() {
  console.log('开始修复数据库...')
  
  // 尝试添加user_id列到密码表
  try {
    const { error } = await supabase.rpc('alter_passwords_add_user_id')
    if (error) {
      console.error('添加user_id列失败:', error)
    } else {
      console.log('添加user_id列成功')
    }
  } catch (error) {
    console.error('添加user_id列出错:', error)
  }
  
  // 尝试添加user_id列到记事表
  try {
    const { error } = await supabase.rpc('alter_notes_add_user_id')
    if (error) {
      console.error('添加user_id列到记事表失败:', error)
    } else {
      console.log('添加user_id列到记事表成功')
    }
  } catch (error) {
    console.error('添加user_id列到记事表出错:', error)
  }
}

fixDatabase()
