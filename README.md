# LeetCode Hot 100 · 记忆题库

一个基于 **Vue 3 + Vite + TypeScript + Element Plus** 的纯前端 LeetCode 热题 100 记忆/答题应用，
专为题目背诵和反复练习设计。所有数据保存在浏览器 `localStorage`，无需后端。

## ✨ 功能

- 📋 **题目列表**：100 道热题元数据，按官方分类整理（哈希、双指针、动态规划……）
- 🔍 **搜索与筛选**：支持按题号 / 标题 / slug 关键词、难度、标签（多选与逻辑）、掌握状态过滤
- 🎲 **随机抽题**：从当前筛选结果或"未掌握"题目中随机出题
- 👁️ **遮挡解答（默写模式）**：进入题目时，思路与代码默认隐藏，便于自测
- ✍️ **默写区**：内嵌文本框书写解法草稿，按题号本地保存
- ✅ **掌握状态追踪**：未学习 / 学习中 / 已掌握 三态切换，本地持久化
- ⌨️ **键盘快捷键**：`←` 上一题 · `→` 下一题 · `A` 切换思路 · `C` 切换代码
- 🔗 跳转 leetcode.cn 原题

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 本地开发（默认 http://localhost:5173 ）
npm run dev

# 生产构建
npm run build

# 预览构建产物
npm run preview
```

## 📁 项目结构

```
src/
├── data/problems.ts      # Hot 100 题库（元数据 + 部分含完整解答）
├── types/problem.ts      # 题目类型定义
├── stores/progress.ts    # Pinia 掌握状态 store（localStorage 持久化）
├── views/
│   ├── ProblemList.vue   # 列表页（搜索 / 筛选 / 随机抽题）
│   └── ProblemDetail.vue # 详情页（默写 / 遮挡解答 / 状态切换）
├── router/index.ts       # 路由
├── styles/main.css       # 全局样式
├── App.vue               # 应用框架（含顶部进度条）
└── main.ts               # 入口
```

## 🧠 题库说明

- 题号、标题、难度、标签均按官方分类整理。
- 前 ~25 道高频题目附带完整的 **思路 + TypeScript 参考代码 + 时间/空间复杂度**。
- 其余题目保留题面与解题要点提示，参考代码字段为空，便于你**逐题手写补全**。
- 想要补充/修改某题，直接编辑 `src/data/problems.ts` 即可，无需改动其他代码。

## 🗃️ 本地存储

| Key                      | 含义               |
| ------------------------ | ------------------ |
| `hot100-progress-v1`     | 掌握状态 + 浏览时间 |
| `hot100-draft-{id}`      | 第 id 题的默写草稿 |

清空浏览器 localStorage 即可重置全部进度。

## 📜 License

MIT
