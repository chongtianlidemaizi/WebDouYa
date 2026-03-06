<template>
  <div class="home">
    <div class="header">
      <h1>{{ $t('home.title') }}</h1>
      <div class="user-info">
        <span>{{ user?.email }}</span>
      </div>
    </div>
    
    <div class="tool-management">
      <!-- 添加工具部分 -->
      <div class="add-tool-section">
        <h2>{{ $t('home.add') }} {{ $t('nav.tools') }}</h2>
        <div class="available-tools">
          <div 
            v-for="tool in availableTools" 
            :key="tool.id"
            class="tool-card available"
          >
            <div class="tool-icon">{{ tool.icon }}</div>
            <h3>{{ tool.name }}</h3>
            <p>{{ tool.description }}</p>
            <button class="btn-add" @click="addTool(tool)">{{ $t('home.add') }}</button>
          </div>
        </div>
      </div>
      
      <!-- 已添加工具部分 -->
      <div class="added-tools-section">
        <h2>{{ $t('home.added') }} {{ $t('nav.tools') }}</h2>
        <div v-if="userTools.length === 0" class="empty-state">
          <p>{{ $t('home.noTools') }}</p>
        </div>
        <div v-else class="added-tools">
          <div 
            v-for="tool in userTools" 
            :key="tool.id"
            class="tool-card added"
          >
            <div class="tool-icon">{{ tool.icon }}</div>
            <h3>{{ tool.name }}</h3>
            <p>{{ tool.description }}</p>
            <div class="tool-actions">
              <router-link :to="tool.route" class="btn-use">{{ $t('common.use') }}</router-link>
              <button class="btn-remove" @click="removeTool(tool.id)">{{ $t('home.remove') }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '../supabase'

export default {
  name: 'Home',
  data() {
    return {
      user: null,
      userTools: [],
      availableTools: [
        {
          id: 1,
          name: '密码管理',
          route: '/passwords',
          icon: '🔐',
          description: '管理和分类您的密码'
        },
        {
          id: 2,
          name: '记事管理',
          route: '/notes',
          icon: '📝',
          description: '创建和管理个人记事'
        }
      ]
    }
  },
  mounted() {
    this.loadUser()
  },
  methods: {
    async loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        this.user = user
        await this.loadUserTools()
      } else {
        // 未登录，跳转到登录页
        this.$router.push('/login')
      }
    },
    async loadUserTools() {
      if (!this.user) return
      
      try {
        console.log('开始加载用户工具，用户ID:', this.user.id)
        const { data, error } = await supabase
          .from('tools')
          .select('*')
          .eq('user_id', this.user.id)
        
        console.log('加载工具结果:', { data, error })
        
        if (error) {
          console.error('加载工具失败:', error)
          if (error.code === '42P01') {
            console.error('工具表不存在')
          }
          this.userTools = []
        } else {
          this.userTools = data || []
          console.log('成功加载工具:', this.userTools)
        }
      } catch (error) {
        console.error('加载工具失败:', error)
        this.userTools = []
      }
    },
    async addTool(tool) {
      if (!this.user) {
        alert(this.$t('common.loginFirst'))
        return
      }
      
      console.log('开始添加工具:', tool)
      console.log('当前用户:', this.user)
      
      // 检查工具是否已经添加
      const isAdded = this.userTools.some(t => t.name === tool.name)
      console.log('工具是否已添加:', isAdded)
      
      if (!isAdded) {
        try {
          console.log('准备插入数据到tools表')
          
          // 先确保用户在数据库中存在
          await this.ensureUserExists()
          
          // 先测试数据库连接
          const { error: connectionError } = await supabase.from('tools').select('*').limit(1)
          if (connectionError) {
            console.error('数据库连接测试失败:', connectionError)
            if (connectionError.code === '42P01') {
              alert('数据库表不存在，请在Supabase控制台创建工具表\n\nCREATE TABLE tools (\n  id SERIAL PRIMARY KEY,\n  user_id UUID NOT NULL,\n  name TEXT NOT NULL,\n  route TEXT NOT NULL,\n  icon TEXT NOT NULL,\n  created_at TIMESTAMP DEFAULT NOW(),\n  FOREIGN KEY (user_id) REFERENCES users(id)\n);')
            } else {
              alert(`数据库连接失败: ${connectionError.message}`)
            }
            return
          }
          
          const { data, error } = await supabase
            .from('tools')
            .insert({
              user_id: this.user.id,
              name: tool.name,
              route: tool.route,
              icon: tool.icon
            })
            .select()
          
          console.log('插入操作结果:', { data, error })
          
          if (error) {
            console.error('添加工具失败:', error)
            console.error('错误代码:', error.code)
            console.error('错误消息:', error.message)
            if (error.code === '42P01') {
              alert('数据库表不存在，请在Supabase控制台创建工具表')
            } else if (error.code === '23503') {
              // 外键约束错误，用户可能不在users表中
              await this.ensureUserExists()
              // 重新尝试添加，但避免递归调用
              try {
                const { data: retryData, error: retryError } = await supabase
                  .from('tools')
                  .insert({
                    user_id: this.user.id,
                    name: tool.name,
                    route: tool.route,
                    icon: tool.icon
                  })
                  .select()
                
                if (retryError) {
                  throw retryError
                } else if (retryData && retryData[0]) {
                  console.log('添加工具成功:', retryData[0])
                  this.userTools.push(retryData[0])
                  // 通知父组件更新工具列表
                  this.$emit('tools-updated', this.userTools)
                  alert('工具添加成功！')
                }
              } catch (retryError) {
                console.error('重试添加工具失败:', retryError)
                alert(`添加工具失败: ${retryError.message}`)
              }
              return
            } else if (error.code === '23505') {
              alert('工具已存在')
            } else {
              alert(`添加工具失败: ${error.message}`)
            }
          } else if (data && data[0]) {
            console.log('添加工具成功:', data[0])
            this.userTools.push(data[0])
            // 通知父组件更新工具列表
            this.$emit('tools-updated', this.userTools)
            alert('工具添加成功！')
          } else {
            console.error('添加工具失败: 没有返回数据')
            alert('添加工具失败: 没有返回数据')
          }
        } catch (error) {
          console.error('添加工具失败:', error)
          console.error('错误堆栈:', error.stack)
          alert(`添加工具失败: ${error.message}`)
        }
      } else {
        alert('该工具已经添加过了')
      }
    },
    async ensureUserExists() {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', this.user.id)
          .single()
        
        if (error && error.code === 'PGRST116') { // 未找到用户
          console.log('用户不存在，正在创建...')
          // 创建新用户
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: this.user.id,
              email: this.user.email,
              username: this.user.user_metadata?.username || this.user.email.split('@')[0]
            })
          
          if (insertError) {
            console.error('创建用户失败:', insertError)
            throw insertError
          }
          console.log('用户创建成功')
        } else if (error) {
          console.error('检查用户时出错:', error)
          throw error
        } else {
          console.log('用户已存在')
        }
      } catch (error) {
        console.error('确保用户存在时出错:', error)
        throw error
      }
    },
    async removeTool(toolId) {
      if (!this.user) return
      
      try {
        const { error } = await supabase
          .from('tools')
          .delete()
          .eq('id', toolId)
        
        if (error) {
          console.error('删除工具失败:', error)
        } else {
          this.userTools = this.userTools.filter(tool => tool.id !== toolId)
          // 通知父组件更新工具列表
          this.$emit('tools-updated', this.userTools)
        }
      } catch (error) {
        console.error('删除工具失败:', error)
      }
    }
  }
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 30px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 25px 30px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  margin-bottom: 30px;
}

.header h1 {
  color: #2c3e50;
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info span {
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.tool-management {
  max-width: 1200px;
  margin: 0 auto;
}

.add-tool-section,
.added-tools-section {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  margin-bottom: 30px;
}

.add-tool-section h2,
.added-tools-section h2 {
  color: #2c3e50;
  margin-bottom: 25px;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.add-tool-section h2::before,
.added-tools-section h2::before {
  content: '';
  width: 4px;
  height: 20px;
  background: #3498db;
  border-radius: 2px;
}

.available-tools,
.added-tools {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.tool-card {
  background: #f8f9fa;
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  transition: transform 0.3s, box-shadow 0.3s, background 0.3s;
  border: 2px solid transparent;
}

.tool-card.available {
  cursor: pointer;
}

.tool-card.available:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
  border-color: #3498db;
  background: white;
}

.tool-card.added {
  background: white;
  border-color: #e0e0e0;
}

.tool-icon {
  font-size: 56px;
  margin-bottom: 20px;
}

.tool-card h3 {
  margin-bottom: 10px;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.tool-card p {
  color: #666;
  font-size: 14px;
  margin-bottom: 20px;
  line-height: 1.5;
}

.btn-add,
.btn-use,
.btn-remove {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;
  display: inline-block;
}

.btn-add {
  background: #3498db;
  color: white;
}

.btn-add:hover {
  background: #2980b9;
  transform: translateY(-2px);
}

.tool-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.btn-use {
  background: #27ae60;
  color: white;
}

.btn-use:hover {
  background: #229954;
  transform: translateY(-2px);
}

.btn-remove {
  background: #e74c3c;
  color: white;
}

.btn-remove:hover {
  background: #c0392b;
  transform: translateY(-2px);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px dashed #e0e0e0;
}

@media (max-width: 768px) {
  .home {
    padding: 20px;
  }
  
  .header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
    padding: 20px;
  }
  
  .user-info {
    width: 100%;
    justify-content: center;
  }
  
  .add-tool-section,
  .added-tools-section {
    padding: 20px;
  }
  
  .available-tools,
  .added-tools {
    grid-template-columns: 1fr;
  }
  
  .tool-card {
    padding: 25px;
  }
  
  .tool-icon {
    font-size: 48px;
  }
}
</style>