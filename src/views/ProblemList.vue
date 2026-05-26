<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useProblemsStore } from '@/stores/problems'
import { useProgressStore } from '@/stores/progress'
import { useGroupsStore } from '@/stores/groups'
import ProblemFormModal from '@/components/ProblemFormModal.vue'
import { exportData, importData } from '@/utils/dataIO'
import type { Difficulty, Problem } from '@/types/problem'
import type { MasteryStatus } from '@/stores/progress'

const router = useRouter()
const problemsStore = useProblemsStore()
const progress = useProgressStore()
const groupsStore = useGroupsStore()

const problems = computed(() => problemsStore.allProblems)
const allTags = computed(() => problemsStore.allTags)

// ── 新增题目弹窗 ──
const showFormModal = ref(false)

function openInNewTab(id: number) {
  const resolved = router.resolve({ name: 'detail', params: { id: String(id) } })
  window.open(resolved.href, '_blank')
}

function onFormSaved(id: number) {
  openInNewTab(id)
}

const keyword = ref('')
const selectedDifficulty = ref<Difficulty | ''>('')
const selectedTags = ref<string[]>([])
const selectedStatus = ref<MasteryStatus | ''>('')
const showWrongSetOnly = ref(false)
const sortOrder = ref<'default' | 'asc' | 'desc'>('asc')

function toggleSort() {
  sortOrder.value =
    sortOrder.value === 'default' ? 'asc' : sortOrder.value === 'asc' ? 'desc' : 'default'
}

const sortLabel = computed(() =>
  sortOrder.value === 'asc' ? '↑ 题号升序' : sortOrder.value === 'desc' ? '↓ 题号降序' : '排序'
)

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  const list = problems.value.filter((p) => {
    if (kw) {
      const hit =
        String(p.id).includes(kw) ||
        p.title.toLowerCase().includes(kw) ||
        p.slug.toLowerCase().includes(kw)
      if (!hit) return false
    }
    if (selectedDifficulty.value && p.difficulty !== selectedDifficulty.value) return false
    if (selectedTags.value.length > 0 && !selectedTags.value.every((t) => p.tags.includes(t)))
      return false
    if (selectedStatus.value && progress.getStatus(p.id) !== selectedStatus.value) return false
    if (showWrongSetOnly.value && !progress.isWrong(p.id)) return false
    return true
  })
  if (sortOrder.value === 'asc') return [...list].sort((a, b) => a.id - b.id)
  if (sortOrder.value === 'desc') return [...list].sort((a, b) => b.id - a.id)
  return list
})

function diffClass(d: Difficulty) {
  return d === 'Easy' ? 'diff-easy' : d === 'Medium' ? 'diff-medium' : 'diff-hard'
}

function statusTagType(s: MasteryStatus): 'success' | 'warning' | 'info' {
  if (s === 'mastered') return 'success'
  if (s === 'learning') return 'warning'
  return 'info'
}

function statusLabel(s: MasteryStatus) {
  if (s === 'mastered') return '已掌握'
  if (s === 'learning') return '学习中'
  return '未学习'
}

function getGroupCount(problemId: number): number {
  return groupsStore.getGroupsByProblemId(problemId).length
}

function openProblem(id: number) {
  openInNewTab(id)
}

function randomPick() {
  const base = filtered.value.length ? filtered.value : problems.value
  const pool = base.filter((p) => progress.getStatus(p.id) === 'mastered')
  if (!pool.length) {
    ElMessage.warning('没有已掌握的题目')
    return
  }
  const target = pool[Math.floor(Math.random() * pool.length)]
  ElMessage.success(`随机：${target.id}. ${target.title}`)
  openInNewTab(target.id)
}

function randomFromUnmastered() {
  const pool = problems.value.filter((p) => progress.getStatus(p.id) !== 'mastered')
  if (!pool.length) {
    ElMessage.success('🎉 全部题目已掌握！')
    return
  }
  const target = pool[Math.floor(Math.random() * pool.length)]
  ElMessage.success(`待复习：${target.id}. ${target.title}`)
  openInNewTab(target.id)
}

function clearFilters() {
  keyword.value = ''
  selectedDifficulty.value = ''
  selectedTags.value = []
  selectedStatus.value = ''
  showWrongSetOnly.value = false
  sortOrder.value = 'default'
}

// ── 导入 / 导出 ──
const fileInputRef = ref<HTMLInputElement | null>(null)

async function handleExport() {
  try {
    await exportData()
    ElMessage.success('备份文件已下载')
  } catch (err) {
    ElMessage.error((err as Error).message)
  }
}

function triggerImport() {
  fileInputRef.value?.click()
}

async function handleImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  ;(e.target as HTMLInputElement).value = '' // 重置，允许重复选同一文件

  try {
    await ElMessageBox.confirm(
      '导入将覆盖当前所有本地数据（进度、笔记、草稿、自定义题目），确定继续？',
      '导入确认',
      { confirmButtonText: '确定导入', cancelButtonText: '取消', type: 'warning' }
    )
    const { count } = await importData(file)
    ElMessage.success(`已导入 ${count} 条数据，页面刷新中…`)
    setTimeout(() => location.reload(), 600)
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error((err as Error).message)
    }
  }
}

function quickToggleStatus(e: Event, id: number) {
  e.stopPropagation()
  const cur = progress.getStatus(id)
  const next: MasteryStatus =
    cur === 'unseen' ? 'learning' : cur === 'learning' ? 'mastered' : 'unseen'
  progress.setStatus(id, next)
}

function restoreProblem(e: Event, id: number) {
  e.stopPropagation()
  problemsStore.restoreProblem(id)
  ElMessage.success('已撤销删除')
}

const statsBar = computed(() => {
  const m = progress.stats.mastered
  const l = progress.stats.learning
  const u = problems.value.length - m - l
  const w = progress.wrongSet.length
  return { m, l, u, w }
})

const wrongStats = computed(() => {
  const wrongProblems = problems.value.filter((p) => progress.isWrong(p.id))
  const easy = wrongProblems.filter((p) => p.difficulty === 'Easy').length
  const medium = wrongProblems.filter((p) => p.difficulty === 'Medium').length
  const hard = wrongProblems.filter((p) => p.difficulty === 'Hard').length
  return { easy, medium, hard }
})
</script>

<template>
  <div class="list-page">
    <!-- 统计小条 -->
    <div class="stats-strip">
      <span class="stat-item stat-mastered">✅ 已掌握 {{ statsBar.m }}</span>
      <span class="stat-item stat-learning">🔥 学习中 {{ statsBar.l }}</span>
      <span class="stat-item stat-unseen">📋 未学习 {{ statsBar.u }}</span>
      <span class="stat-item stat-wrong">❌ 错题集 {{ statsBar.w }}</span>
    </div>

    <!-- 错题集统计 -->
    <div v-if="statsBar.w > 0" class="wrong-stats">
      <span class="wrong-stats-label">错题分布：</span>
      <span class="wrong-stats-item wrong-easy">Easy {{ wrongStats.easy }}</span>
      <span class="wrong-stats-item wrong-medium">Medium {{ wrongStats.medium }}</span>
      <span class="wrong-stats-item wrong-hard">Hard {{ wrongStats.hard }}</span>
    </div>

    <!-- 筛选区 -->
    <div class="filter-card">
      <!-- 搜索框 -->
      <div class="search-wrapper">
        <span class="search-icon">🔍</span>
        <el-input
          v-model="keyword"
          placeholder="搜索题号 / 标题 / 标签"
          clearable
          class="search-input"
        />
      </div>

      <!-- 分类筛选 -->
      <div class="category-section">
        <span class="category-label">分类筛选</span>
        <el-select
          v-model="selectedTags"
          placeholder="选择标签（可多选）"
          multiple
          collapse-tags
          collapse-tags-tooltip
          clearable
          class="category-select"
        >
          <el-option v-for="t in allTags" :key="t" :label="t" :value="t" />
        </el-select>
      </div>

      <!-- 筛选行：难度 & 状态 -->
      <div class="filter-row">
        <el-select v-model="selectedDifficulty" placeholder="难度" clearable class="filter-select">
          <el-option label="Easy" value="Easy" />
          <el-option label="Medium" value="Medium" />
          <el-option label="Hard" value="Hard" />
        </el-select>

        <el-select v-model="selectedStatus" placeholder="掌握状态" clearable class="filter-select">
          <el-option label="未学习" value="unseen" />
          <el-option label="学习中" value="learning" />
          <el-option label="已掌握" value="mastered" />
        </el-select>
      </div>

      <!-- 操作行 -->
      <div class="action-row">
        <el-button type="primary" class="action-btn" @click="randomPick">
          <span class="btn-icon">🎲</span><span class="btn-text">随机抽题</span>
        </el-button>
        <el-button type="warning" class="action-btn" @click="randomFromUnmastered">
          <span class="btn-icon">🔁</span><span class="btn-text">待复习</span>
        </el-button>
        <el-button
          :type="showWrongSetOnly ? 'danger' : 'default'"
          class="action-btn"
          @click="showWrongSetOnly = !showWrongSetOnly"
        >
          <span class="btn-icon">❌</span><span class="btn-text">错题集</span>
        </el-button>
        <el-button
          class="action-btn action-btn-sort"
          :class="{ 'sort-active': sortOrder !== 'default' }"
          @click="toggleSort"
        >
          <span class="btn-icon">↕️</span><span class="btn-text">{{ sortLabel }}</span>
        </el-button>
        <el-button class="action-btn action-btn-clear" @click="clearFilters">
          <span class="btn-icon">🧹</span><span class="btn-text">清空</span>
        </el-button>
        <span class="result-count">{{ filtered.length }} 道</span>
      </div>
      <!-- 新增题目 -->
      <button class="add-problem-btn" @click="showFormModal = true">
        ＋ 新增题目
      </button>

      <!-- 导入 / 导出 -->
      <div class="data-io-row">
        <button class="io-btn io-btn--export" @click="handleExport">📤 导出备份</button>
        <button class="io-btn io-btn--import" @click="triggerImport">📥 导入备份</button>
        <input ref="fileInputRef" type="file" accept=".json" hidden @change="handleImport" />
      </div>
    </div>

    <!-- 题目卡片列表（替换 el-table，移动端友好） -->
    <ul class="problem-list">
      <li
        v-for="p in filtered"
        :key="p.id"
        :class="['problem-item', { 'problem-deleted': p._deleted }]"
        @click="openProblem(p.id)"
      >
        <div class="item-left">
          <span class="item-id">{{ p.id }}</span>
          <span v-if="problemsStore.isCustom(p.id)" class="item-badge badge-custom" title="自定义题目">自</span>
          <span v-else-if="problemsStore.isModified(p.id)" class="item-badge badge-modified" title="已修改">改</span>
          <span v-if="getGroupCount(p.id) > 0" class="item-badge badge-group" :title="`属于 ${getGroupCount(p.id)} 个组合`">组{{ getGroupCount(p.id) }}</span>
        </div>
        <div class="item-body">
          <div :class="['item-title', { 'title-deleted': p._deleted }]">{{ p.title }}</div>
          <div class="item-meta">
            <span :class="['diff-badge', diffClass(p.difficulty)]">{{ p.difficulty }}</span>
            <span v-for="t in p.tags.slice(0, 3)" :key="t" class="tag-pill">{{ t }}</span>
            <span v-if="p.tags.length > 3" class="tag-more">+{{ p.tags.length - 3 }}</span>
          </div>
        </div>
        <div class="item-right">
          <button
            v-if="p._deleted"
            class="restore-btn"
            @click.stop="restoreProblem($event, p.id)"
          >撤销</button>
          <el-tag
            v-else
            :type="statusTagType(progress.getStatus(p.id))"
            size="small"
            effect="light"
            class="status-tag"
            @click.stop="quickToggleStatus($event, p.id)"
          >
            {{ statusLabel(progress.getStatus(p.id)) }}
          </el-tag>
          <span class="item-arrow">›</span>
        </div>
      </li>
    </ul>

    <p v-if="filtered.length === 0" class="empty-tip">没有符合条件的题目，尝试清空筛选</p>
  </div>

  <ProblemFormModal
    :visible="showFormModal"
    @close="showFormModal = false"
    @saved="onFormSaved"
  />
</template>

<style scoped>
/* ── 页面容器 ── */
.list-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ── 统计条 ── */
.stats-strip {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.stat-item {
  flex: 1;
  min-width: 80px;
  text-align: center;
  padding: 8px 4px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}
.stat-mastered { background: #dcfce7; color: #15803d; }
.stat-learning { background: #fef9c3; color: #b45309; }
.stat-unseen   { background: #f1f5f9; color: #475569; }
.stat-wrong    { background: #fee2e2; color: #dc2626; }

/* 错题集统计 */
.wrong-stats {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  background: #fef2f2;
  border-radius: 8px;
  font-size: 12px;
}
.wrong-stats-label {
  font-weight: 600;
  color: #6b7280;
}
.wrong-stats-item {
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}
.wrong-easy   { background: #dcfce7; color: #15803d; }
.wrong-medium { background: #fef9c3; color: #b45309; }
.wrong-hard   { background: #fee2e2; color: #dc2626; }

/* ── 筛选卡片 ── */
.filter-card {
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}

/* 搜索框 */
.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon {
  position: absolute;
  left: 10px;
  z-index: 1;
  font-size: 14px;
}
.search-input {
  width: 100%;
}
.search-input :deep(.el-input__inner) {
  padding-left: 32px;
}

/* 分类筛选 */
.category-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}
.category-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  padding-left: 2px;
}
.category-select {
  width: 100%;
}

/* 筛选行 */
.filter-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.filter-select {
  width: 100%;
}
.action-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  align-items: center;
}
.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 6px;
  font-size: 13px;
  white-space: nowrap;
}
.btn-icon {
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
}
.btn-text {
  line-height: 1;
}
.sort-active {
  color: #2563eb !important;
  border-color: #93c5fd !important;
}
.result-count {
  font-size: 13px;
  color: #6b7280;
  white-space: nowrap;
  text-align: right;
}

/* ── 题目列表 ── */
.problem-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}
.problem-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  padding: 13px 12px;
  cursor: pointer;
  transition: background 0.1s;
  /* 手机触控高度足够 */
  min-height: 60px;
}
.problem-item:active {
  background: #f0f9ff;
}
.problem-deleted {
  opacity: 0.6;
}
.problem-deleted:active {
  background: #fef3c7;
}
.title-deleted {
  text-decoration: line-through;
  color: #9ca3af;
}
.restore-btn {
  padding: 4px 10px;
  border: 1px solid #f59e0b;
  border-radius: 4px;
  background: #fffbeb;
  color: #b45309;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
}
.restore-btn:active {
  background: #fef3c7;
}

/* 新增题目按钮 */
.add-problem-btn {
  width: 100%;
  padding: 10px;
  border: 1.5px dashed #93c5fd;
  border-radius: 8px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.add-problem-btn:active {
  background: #dbeafe;
}

/* 导入/导出行 */
.data-io-row {
  display: flex;
  gap: 8px;
}
.io-btn {
  flex: 1;
  padding: 9px 10px;
  border-radius: 8px;
  border: 1.5px solid #e5e7eb;
  background: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.io-btn:active {
  background: #f3f4f6;
}
.io-btn--export {
  color: #0369a1;
  border-color: #bae6fd;
}
.io-btn--export:active {
  background: #e0f2fe;
}
.io-btn--import {
  color: #15803d;
  border-color: #a7f3d0;
}
.io-btn--import:active {
  background: #dcfce7;
}

/* 序号 */
.item-left {
  flex-shrink: 0;
  width: 36px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}
.item-id {
  font-size: 12px;
  color: #9ca3af;
  font-weight: 600;
}

/* 自定义/修改徽章 */
.item-badge {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 4px;
}
.badge-custom   { background: #e0f2fe; color: #0369a1; }
.badge-modified { background: #fef9c3; color: #92400e; }
.badge-group    { background: #f3e8ff; color: #7c3aed; }

/* 正文 */
.item-body {
  flex: 1;
  min-width: 0;
}
.item-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}
.item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

/* 难度 badge */
.diff-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 10px;
}
.diff-easy   { background: #dcfce7; color: #15803d; }
.diff-medium { background: #fef9c3; color: #b45309; }
.diff-hard   { background: #fee2e2; color: #b91c1c; }

.tag-more {
  font-size: 11px;
  color: #9ca3af;
}

/* 右侧 */
.item-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}
.status-tag {
  cursor: pointer;
  white-space: nowrap;
}
.item-arrow {
  color: #d1d5db;
  font-size: 18px;
  line-height: 1;
}

.empty-tip {
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
  padding: 32px 0;
}

/* ── 桌面端：更宽松 ── */
@media (min-width: 640px) {
  .filter-card {
    padding: 16px;
  }
  .action-row {
    grid-template-columns: repeat(5, auto) 1fr;
    gap: 8px;
  }
  .action-btn {
    flex: none;
    padding: 8px 14px;
    font-size: 14px;
  }
  .item-title {
    font-size: 15px;
  }
  .problem-item {
    padding: 14px 16px;
  }
}
</style>
