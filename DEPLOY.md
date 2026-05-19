# 部署指南

## 前置条件

- Node.js >= 18
- npm >= 9
- Cloudflare 账号
- 已安装 Wrangler CLI（项目 devDependencies 已包含）

---

## 一、首次部署（Cloudflare 远程）

### 1. 创建 D1 数据库

```bash
npx wrangler d1 create hotcode-db
```

执行后会输出类似：

```
┌───────────────────────────┐
│ Database hotcode-db created │
├───────────────────────────┤
│ database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
└───────────────────────────┘
```

将 `database_id` 填入 `wrangler.jsonc`：

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "hotcode-db",
    "database_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
]
```

### 2. 初始化数据库表

```bash
npx wrangler d1 execute hotcode-db --file=./src/worker/schema.sql
```

### 3. 构建并部署

```bash
npm run build
npx wrangler deploy
```

部署成功后会输出 Worker URL，例如 `https://hotcode.xxx.workers.dev`。

---

## 二、本地开发

### 1. 初始化本地 D1 数据库

```bash
npx wrangler d1 execute hotcode-db --local --file=./src/worker/schema.sql
```

> `--local` 表示写入本地开发数据库，不影响远程数据。

### 2. 启动开发服务器

```bash
npm run dev
```

Vite + Cloudflare 插件会同时启动前端热更新和 Worker 本地运行时，API 请求（`/api/*`）由本地 Worker 处理并连接本地 D1。

### 3. 本地预览生产构建

```bash
npm run preview
```

该命令会先执行 `npm run build`，再用 `wrangler dev` 在本地运行生产构建，可模拟真实部署环境。

---

## 三、数据库管理

### 查看表结构

```bash
npx wrangler d1 execute hotcode-db --command "SELECT name FROM sqlite_master WHERE type='table';"
```

### 查看表数据

```bash
npx wrangler d1 execute hotcode-db --command "SELECT * FROM progress LIMIT 10;"
```

### 清空某张表

```bash
npx wrangler d1 execute hotcode-db --command "DELETE FROM notes;"
```

### 重新初始化（重建所有表）

```bash
npx wrangler d1 execute hotcode-db --file=./src/worker/schema.sql
```

> 已存在的表不会被覆盖（`CREATE TABLE IF NOT EXISTS`），需要先 DROP 再重建。

### 本地数据库

所有命令加 `--local` 即可操作本地数据库：

```bash
npx wrangler d1 execute hotcode-db --local --command "SELECT * FROM progress;"
```

---

## 四、数据迁移

用户首次打开已部署的应用时，系统会自动检测浏览器 localStorage 中的旧数据并迁移到 D1。迁移完成后 localStorage 旧数据会被清除。

如需手动迁移，可通过浏览器控制台调用：

```js
import { migrateLocalToD1 } from '@/utils/dataIO'
migrateLocalToD1().then(ok => console.log('迁移结果:', ok))
```

---

## 五、备份与恢复

### 导出数据

在应用页面点击「导出」按钮，会下载一份 JSON 备份文件。

### 导入数据

在应用页面点击「导入」按钮，选择之前导出的 JSON 文件即可恢复。

### 通过 API 直接备份

```bash
# 导出全部数据
curl https://your-worker.workers.dev/api/export > backup.json

# 恢复数据
curl -X POST https://your-worker.workers.dev/api/import \
  -H "Content-Type: application/json" \
  -d @backup.json
```

---

## 六、环境变量与配置

| 配置项 | 文件 | 说明 |
|--------|------|------|
| `database_id` | `wrangler.jsonc` | D1 数据库 ID，首次创建后填写 |
| `name` | `wrangler.jsonc` | Worker 名称，决定部署 URL |
| `compatibility_date` | `wrangler.jsonc` | Cloudflare 兼容性日期 |

---

## 七、常见问题

### Q: 部署后 API 返回 404？

检查 `wrangler.jsonc` 中的 `main` 字段是否指向 `src/worker/index.ts`。

### Q: 本地开发时 API 请求失败？

确保已执行本地数据库初始化：
```bash
npx wrangler d1 execute hotcode-db --local --file=./src/worker/schema.sql
```

### Q: 如何查看 Worker 日志？

```bash
npx wrangler tail
```

### Q: 如何重置远程数据库？

```bash
npx wrangler d1 execute hotcode-db --command "DELETE FROM user_problems; DELETE FROM modified_problems; DELETE FROM deleted_problems; DELETE FROM progress; DELETE FROM groups; DELETE FROM notes; DELETE FROM drafts;"
```
