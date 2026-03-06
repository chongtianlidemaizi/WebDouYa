-- 修复密码表，添加user_id列
ALTER TABLE passwords ADD COLUMN IF NOT EXISTS user_id UUID;

-- 添加外键约束
ALTER TABLE passwords ADD CONSTRAINT passwords_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

-- 更新现有数据的user_id（如果有）
-- 注意：这需要根据实际情况修改，这里假设使用第一个用户的ID
-- UPDATE passwords SET user_id = (SELECT id FROM users LIMIT 1);

-- 修复记事表，添加user_id列
ALTER TABLE notes ADD COLUMN IF NOT EXISTS user_id UUID;

-- 添加外键约束
ALTER TABLE notes ADD CONSTRAINT notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

-- 创建RPC函数用于添加user_id列到密码表
CREATE OR REPLACE FUNCTION alter_passwords_add_user_id()
RETURNS void AS $$
BEGIN
  ALTER TABLE passwords ADD COLUMN IF NOT EXISTS user_id UUID;
  ALTER TABLE passwords ADD CONSTRAINT IF NOT EXISTS passwords_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- 创建RPC函数用于添加user_id列到记事表
CREATE OR REPLACE FUNCTION alter_notes_add_user_id()
RETURNS void AS $$
BEGIN
  ALTER TABLE notes ADD COLUMN IF NOT EXISTS user_id UUID;
  ALTER TABLE notes ADD CONSTRAINT IF NOT EXISTS notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- 重新创建密码表（如果需要）
-- 注意：这会删除现有数据，请谨慎使用
/*
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
*/

-- 重新创建记事表（如果需要）
-- 注意：这会删除现有数据，请谨慎使用
/*
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
*/
