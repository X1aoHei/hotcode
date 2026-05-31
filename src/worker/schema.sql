-- 用户自定义题目
CREATE TABLE IF NOT EXISTS user_problems (
  id INTEGER PRIMARY KEY,
  data TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 用户修改的内置题目
CREATE TABLE IF NOT EXISTS modified_problems (
  problem_id INTEGER PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 用户删除的内置题目
CREATE TABLE IF NOT EXISTS deleted_problems (
  problem_id INTEGER PRIMARY KEY,
  deleted_at INTEGER NOT NULL
);

-- 学习进度
CREATE TABLE IF NOT EXISTS progress (
  problem_id INTEGER PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'unseen',
  last_viewed INTEGER,
  is_wrong INTEGER NOT NULL DEFAULT 0
);

-- 题目组合
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  problem_ids TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 复习轮次
CREATE TABLE IF NOT EXISTS review_rounds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  problem_ids TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 记忆笔记
CREATE TABLE IF NOT EXISTS notes (
  problem_id INTEGER PRIMARY KEY,
  content TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 代码草稿
CREATE TABLE IF NOT EXISTS drafts (
  problem_id INTEGER PRIMARY KEY,
  content TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
