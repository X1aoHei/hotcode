-- 用户新增/修改的题目
CREATE TABLE IF NOT EXISTS user_problems (
  problem_id       INTEGER PRIMARY KEY,
  title            TEXT NOT NULL,
  slug             TEXT NOT NULL DEFAULT '',
  difficulty       TEXT NOT NULL DEFAULT 'Medium',
  tags             TEXT NOT NULL DEFAULT '[]',
  description      TEXT NOT NULL DEFAULT '',
  approach         TEXT NOT NULL DEFAULT '',
  code             TEXT NOT NULL DEFAULT '',
  time_complexity  TEXT,
  space_complexity TEXT,
  draft            TEXT,
  is_custom        INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 用户删除的内置题目
CREATE TABLE IF NOT EXISTS deleted_problems (
  problem_id  INTEGER PRIMARY KEY,
  deleted_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 每题掌握状态 + 最后查看时间
CREATE TABLE IF NOT EXISTS progress (
  problem_id  INTEGER PRIMARY KEY,
  status      TEXT NOT NULL DEFAULT 'unseen',
  last_viewed INTEGER NOT NULL DEFAULT 0
);

-- 每题笔记 + 草稿
CREATE TABLE IF NOT EXISTS problem_content (
  problem_id INTEGER PRIMARY KEY,
  note       TEXT,
  draft      TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 错题集
CREATE TABLE IF NOT EXISTS wrong_set (
  problem_id  INTEGER PRIMARY KEY,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
