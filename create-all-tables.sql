-- 删除所有表（如果存在）
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS passwords;
DROP TABLE IF EXISTS tools;
DROP TABLE IF EXISTS users;

-- 删除所有触发器和函数
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_passwords_updated_at ON passwords;
DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;

DROP FUNCTION IF EXISTS update_users_updated_at();
DROP FUNCTION IF EXISTS update_passwords_updated_at();
DROP FUNCTION IF EXISTS update_notes_updated_at();
DROP FUNCTION IF EXISTS create_users_table();
DROP FUNCTION IF EXISTS create_tools_table();
DROP FUNCTION IF EXISTS create_passwords_table();
DROP FUNCTION IF EXISTS create_notes_table();

-- 创建用户表
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

-- 创建工具表
CREATE TABLE tools (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  route TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 创建密码表
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

-- 创建记事表
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
CREATE OR REPLACE FUNCTION create_users_table()
RETURNS void AS $$
BEGIN
  -- 表已在上面创建
  RETURN;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_tools_table()
RETURNS void AS $$
BEGIN
  -- 表已在上面创建
  RETURN;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_passwords_table()
RETURNS void AS $$
BEGIN
  -- 表已在上面创建
  RETURN;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_notes_table()
RETURNS void AS $$
BEGIN
  -- 表已在上面创建
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- 插入示例数据（可选）
-- 注意：这只是示例数据，实际使用时可以删除或修改
-- INSERT INTO users (id, email, username) VALUES 
--   ('00000000-0000-0000-0000-000000000001', 'test@example.com', 'testuser');

-- 显示创建结果
SELECT '所有表创建完成' AS result;
