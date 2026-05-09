# 部署指南

本文档将帮助你在本地运行和部署 LeetCode Hot 100 记忆题库项目。

## 目录

- [环境要求](#环境要求)
- [快速开始（本地开发）](#快速开始本地开发)
- [Cloudflare 部署](#cloudflare-部署)
- [数据库配置](#数据库配置)
- [常见问题](#常见问题)

---

## 环境要求

| 工具 | 版本要求 | 说明 |
|------|----------|------|
| **Node.js** | >= 18.0.0 | 推荐使用 LTS 版本 |
| **npm** | >= 9.0.0 | 随 Node.js 一起安装 |
| **Git** | 任意版本 | 用于克隆项目 |
| **Cloudflare 账号** | - | 部署到 Cloudflare 时需要 |

### 检查环境

```bash
# 检查 Node.js 版本
node --version

# 检查 npm 版本
npm --version
```

如果尚未安装 Node.js，请访问 [nodejs.org](https://nodejs.org/) 下载安装。

---

## 快速开始（本地开发）

### 1. 克隆项目

```bash
git clone https://github.com/your-username/hotcode.git
cd hotcode
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

开发服务器将在 `http://localhost:5173` 启动。

> **注意**：本地开发模式下，数据存储在浏览器 localStorage 中，无需配置数据库。

---

## Cloudflare 部署

要将项目部署到 Cloudflare，需要完成以下步骤：

### 步骤 1：安装 Wrangler CLI

Wrangler 是 Cloudflare 的官方命令行工具：

```bash
npm install -g wrangler
```

### 步骤 2：登录 Cloudflare

```bash
wrangler login
```

这将打开浏览器，引导你完成 Cloudflare 账号授权。

### 步骤 3：创建 D1 数据库

```bash
wrangler d1 create hotcode-db
```

执行后会输出类似以下内容：

```
✅ Successfully created DB 'hotcode-db' in region 'APAC'
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**请复制 `database_id`**，后续步骤需要使用。

### 步骤 4：更新配置文件

编辑项目根目录的 `wrangler.jsonc` 文件，将 `database_id` 替换为你自己的：

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "hotcode",
  "main": "worker/index.ts",
  "compatibility_date": "2026-05-06",
  "compatibility_flags": [
    "nodejs_compat"
  ],
  "observability": {
    "enabled": true
  },
  "assets": {
    "not_found_handling": "single-page-application"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "hotcode-db",
      "database_id": "你的数据库ID"  // 替换这里
    }
  ]
}
```

### 步骤 5：初始化数据库表结构

```bash
wrangler d1 execute hotcode-db --file=./worker/schema.sql
```

### 步骤 6：构建并部署

```bash
# 构建项目
npm run build

# 部署到 Cloudflare
npm run deploy
```

部署成功后，Wrangler 会输出你的应用 URL，通常格式为：
```
https://hotcode.your-subdomain.workers.dev
```

---

## 数据库配置

### 数据库表结构

项目使用 4 张数据表：

| 表名 | 用途 |
|------|------|
| `user_problems` | 用户新增/修改的题目 |
| `deleted_problems` | 用户删除的内置题目 |
| `progress` | 每题掌握状态 + 最后查看时间 |
| `problem_content` | 每题笔记 + 草稿 |

### 本地开发使用远程数据库（可选）

如果希望本地开发时也使用 Cloudflare D1 数据库，可以创建 `.dev.vars` 文件：

```bash
# 本地开发时连接远程 D1（可选）
CLOUDFLARE_DATABASE_ID=你的数据库ID
```

然后使用 `--remote` 标志运行：

```bash
wrangler dev --remote
```

### 查看数据库内容

```bash
# 查看所有表
wrangler d1 execute hotcode-db --command "SELECT name FROM sqlite_master WHERE type='table'"

# 查看题目数据
wrangler d1 execute hotcode-db --command "SELECT * FROM user_problems LIMIT 10"

# 查看进度数据
wrangler d1 execute hotcode-db --command "SELECT * FROM progress LIMIT 10"
```

---

## 常见问题

### Q1: `npm install` 失败

**解决方案**：
```bash
# 清除缓存后重试
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Q2: `wrangler login` 无法打开浏览器

**解决方案**：使用交互式登录：
```bash
wrangler login --browser false
```

### Q3: 部署后页面显示 404

**解决方案**：检查 `wrangler.jsonc` 中的 `assets` 配置是否正确：
```jsonc
"assets": {
  "not_found_handling": "single-page-application"
}
```

### Q4: 数据库连接失败

**解决方案**：
1. 确认 `wrangler.jsonc` 中的 `database_id` 正确
2. 确认已执行数据库初始化命令
3. 检查 Cloudflare 账号是否有 D1 权限

### Q5: 本地开发时 API 请求失败

**解决方案**：本地开发默认使用 localStorage 存储，不依赖后端 API。如需测试后端功能：
```bash
npm run preview
```

---

## 项目命令参考

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动本地开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 构建并本地预览（含 Worker） |
| `npm run deploy` | 构建并部署到 Cloudflare |

---

## 获取帮助

- 提交 Issue：[GitHub Issues](https://github.com/your-username/hotcode/issues)
- Cloudflare Workers 文档：https://developers.cloudflare.com/workers/
- Cloudflare D1 文档：https://developers.cloudflare.com/d1/

---

## 许可证

本项目采用 [MIT License](./LICENSE) 开源协议。
