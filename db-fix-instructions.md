# 数据库修复指南

## 问题
保存密码时出现错误：`Could not find the 'user_id' column of 'passwords' in the schema cache`

## 原因
密码表和记事表中缺少`user_id`列，导致无法关联到用户。

## 解决方案

### 步骤1：打开Supabase控制台
1. 登录到Supabase控制台
2. 选择你的项目
3. 点击左侧菜单中的「SQL编辑器」

### 步骤2：执行SQL语句

#### 2.1 修复密码表
执行以下SQL语句来添加`user_id`列到密码表：

```sql
-- 修复密码表，添加user_id列
ALTER TABLE passwords ADD COLUMN IF NOT EXISTS user_id UUID;

-- 添加外键约束
ALTER TABLE passwords ADD CONSTRAINT passwords_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

-- 创建更新时间触发器（如果不存在）
CREATE OR REPLACE FUNCTION update_passwords_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS update_passwords_updated_at
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
```

#### 2.2 修复记事表
执行以下SQL语句来添加`user_id`列到记事表：

```sql
-- 修复记事表，添加user_id列
ALTER TABLE notes ADD COLUMN IF NOT EXISTS user_id UUID;

-- 添加外键约束
ALTER TABLE notes ADD CONSTRAINT notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

-- 创建更新时间触发器（如果不存在）
CREATE OR REPLACE FUNCTION update_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS update_notes_updated_at
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
```

#### 2.3 重新创建表（如果上述方法失败）
如果添加列失败，可能是因为表结构损坏。可以尝试重新创建表：

**注意：这会删除现有数据，请谨慎使用！**

```sql
-- 重新创建密码表
DROP TABLE IF EXISTS passwords;
CREATE TABLE passwords (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  username TEXT,
  password TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  note TEXT,
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

-- 重新创建记事表
DROP TABLE IF EXISTS notes;
CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
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
```

### 步骤3：验证修复
1. 执行完SQL语句后，刷新Supabase控制台
2. 检查密码表和记事表是否都有`user_id`列
3. 尝试在应用中保存密码，看是否能成功

## 注意事项
- 如果你选择重新创建表，所有现有数据会被删除，请确保在执行前备份重要数据
- 如果仍然遇到问题，请检查用户是否已经登录，以及用户ID是否正确
- 确保`users`表已经存在，并且包含有效的用户数据
