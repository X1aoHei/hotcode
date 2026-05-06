<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useProblemsStore } from '@/stores/problems'
import { useProgressStore } from '@/stores/progress'
import { problems as staticProblems } from '@/data/problems'
import ProblemFormModal from '@/components/ProblemFormModal.vue'
import { Codemirror } from 'vue-codemirror'
import { java } from '@codemirror/lang-java'
import { indentUnit } from '@codemirror/language'
import { EditorState } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import type { Difficulty, Problem } from '@/types/problem'

const route = useRoute()
const router = useRouter()
const problemsStore = useProblemsStore()
const progress = useProgressStore()

const cmExtensions = [java(), oneDark, EditorState.tabSize.of(4), indentUnit.of('    ')]

const problem = shallowRef<Problem | null>(null)

function syncProblem() {
  const id = Number(route.params.id)
  problem.value = id ? (problemsStore.allProblems.find((p) => p.id === id) ?? null) : null
}

// setup 期间同步调用，此时路由已提交，params 已就绪
syncProblem()

// 切题时同步（上一题 / 下一题）
watch(() => route.params.id, syncProblem)

// 用户编辑/删除/新增题目后同步
watch(() => problemsStore.allProblems, syncProblem)

// ── 编辑弹窗 ──
const showEditModal = ref(false)

async function handleDelete() {
  if (!problem.value) return
  await ElMessageBox.confirm(
    problemsStore.isCustom(problem.value.id)
      ? '确认删除这道自定义题目？删除后无法恢复。'
      : '确认从题库中删除这道内置题目？（可在列表页重新添加）',
    '删除确认',
    { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' }
  )
  const id = problem.value.id
  problemsStore.deleteProblem(id)
  ElMessage.success('题目已删除')
  router.push('/')
}

const showApproach = ref(false)
const showCode = ref(false)
const codeFullscreen = ref(false)
const userDraft = ref('')

// ── 参考代码编辑 ──
const editingCode = ref(false)
const codeDraft = ref('')

function startEditCode() {
  codeDraft.value = problem.value?.code ?? ''
  editingCode.value = true
  showCode.value = true
}
function saveCode() {
  if (!problem.value) return
  const updated: Problem = { ...problem.value, code: codeDraft.value }
  problemsStore.updateProblem(updated)
  editingCode.value = false
  ElMessage.success('参考代码已保存')
}
function cancelEditCode() {
  editingCode.value = false
}

const originalCode = computed(() => {
  if (!problem.value) return ''
  return staticProblems.find((p) => p.id === problem.value!.id)?.code ?? ''
})
const isBuiltIn = computed(() => problem.value ? staticProblems.some((p) => p.id === problem.value!.id) : false)

async function restoreCode() {
  if (!problem.value) return
  await ElMessageBox.confirm('将还原参考代码为内置原始内容，确认吗？', '还原确认', {
    confirmButtonText: '确认还原',
    cancelButtonText: '取消',
    type: 'warning',
  })
  const updated: Problem = { ...problem.value, code: originalCode.value }
  problemsStore.updateProblem(updated)
  editingCode.value = false
  ElMessage.success('参考代码已还原')
}

// ── 记忆笔记 ──
const NOTE_PREFIX = 'hot100-note-'
const noteContent = ref('')     // 当前已保存的笔记
const noteDraft = ref('')       // 编辑中的草稿
const editingNote = ref(false)  // 是否处于编辑模式
const hasNote = computed(() => noteContent.value.trim().length > 0)

function loadNote(id: number) {
  noteContent.value = localStorage.getItem(NOTE_PREFIX + id) ?? ''
  noteDraft.value = noteContent.value
  editingNote.value = false
}
function saveNote() {
  if (!problem.value) return
  noteContent.value = noteDraft.value
  localStorage.setItem(NOTE_PREFIX + problem.value.id, noteDraft.value)
  editingNote.value = false
  ElMessage.success('笔记已保存')
}
function startEditNote() {
  noteDraft.value = noteContent.value
  editingNote.value = true
}
function cancelEditNote() {
  noteDraft.value = noteContent.value
  editingNote.value = false
}
function deleteNote() {
  if (!problem.value) return
  noteContent.value = ''
  noteDraft.value = ''
  localStorage.removeItem(NOTE_PREFIX + problem.value.id)
  editingNote.value = false
  ElMessage.success('笔记已删除')
}

/** 代码字号（全屏模式下双指缩放） */
const codeFontSize = ref(13)

/** 全屏时阻止 body 滚动 */
watch(codeFullscreen, (val) => {
  document.body.style.overflow = val ? 'hidden' : ''
})

// ── 双指缩放（pinch-to-zoom）──
let initDist = 0
let initSize = codeFontSize.value

function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 2) {
    initDist = Math.hypot(
      e.touches[1].clientX - e.touches[0].clientX,
      e.touches[1].clientY - e.touches[0].clientY
    )
    initSize = codeFontSize.value
  }
}
function onTouchMove(e: TouchEvent) {
  if (e.touches.length === 2) {
    const dist = Math.hypot(
      e.touches[1].clientX - e.touches[0].clientX,
      e.touches[1].clientY - e.touches[0].clientY
    )
    const next = Math.round(initSize * (dist / initDist))
    codeFontSize.value = Math.min(Math.max(next, 10), 24)
  }
}

// 切题时重置 UI 状态（immediate 确保首次加载也执行）
watch(() => route.params.id, (rawId) => {
  const id = Number(rawId)
  if (!id) return
  showApproach.value = false
  showCode.value = false
  userDraft.value = loadDraft(id)
  loadNote(id)
  progress.markViewed(id)
}, { immediate: true })

const DRAFT_PREFIX = 'hot100-draft-'

/** 从 Java 参考代码中提取方法定义（签名 + 空方法体） */
function extractMethodSignatures(code: string): string {
  if (!code) return ''
  const lines = code.split('\n')
  let inBody = false
  const signatures: string[] = []
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim()
    // 跳过 class 声明
    if (/^(public\s+)?(class|interface|enum)\s/.test(t)) { inBody = true; continue }
    if (!inBody) continue
    // 匹配方法定义：必须以 public/private/protected 开头
    if (/^(public|private|protected)\s/.test(t)) {
      const clean = t.replace(/\{.*$/, '').trim()
      // 同一行带 { 的方法签名
      if (t.includes('{') && clean.includes('(')) {
        signatures.push(clean + ' {')
        signatures.push('}')
        signatures.push('')
      }
      // 跨行签名：签名在本行，{ 在下一行
      else if (clean.includes('(') && i + 1 < lines.length && lines[i + 1].trim() === '{') {
        signatures.push(clean + ' {')
        signatures.push('}')
        signatures.push('')
      }
    }
  }
  return signatures.join('\n').trimEnd()
}

function loadDraft(id: number): string {
  const saved = localStorage.getItem(DRAFT_PREFIX + id)
  if (saved) return saved
  const p = problemsStore.allProblems.find((p) => p.id === id)
  return p ? extractMethodSignatures(p.code) : ''
}
// ── 默写区自动暂存（防抖） ──
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null
watch(userDraft, () => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => {
    if (problem.value) {
      localStorage.setItem(DRAFT_PREFIX + problem.value.id, userDraft.value)
    }
  }, 800)
})

function saveDraft() {
  if (problem.value) {
    localStorage.setItem(DRAFT_PREFIX + problem.value.id, userDraft.value)
    ElMessage.success('草稿已保存')
  }
}
function clearDraft() {
  if (problem.value) {
    localStorage.removeItem(DRAFT_PREFIX + problem.value.id)
    userDraft.value = extractMethodSignatures(problem.value.code)
  }
}

const prevId = computed(() => {
  if (!problem.value) return null
  const list = problemsStore.allProblems
  const idx = list.findIndex((p) => p.id === problem.value!.id)
  return idx > 0 ? list[idx - 1].id : null
})
const nextId = computed(() => {
  if (!problem.value) return null
  const list = problemsStore.allProblems
  const idx = list.findIndex((p) => p.id === problem.value!.id)
  return idx >= 0 && idx < list.length - 1 ? list[idx + 1].id : null
})

function go(id: number | null) {
  if (id == null) return
  router.push({ name: 'detail', params: { id: String(id) } })
}

function diffClass(d: Difficulty) {
  return d === 'Easy' ? 'badge-easy' : d === 'Medium' ? 'badge-medium' : 'badge-hard'
}

function setStatus(s: 'unseen' | 'learning' | 'mastered') {
  if (problem.value) {
    progress.setStatus(problem.value.id, s)
  }
}

function leetcodeUrl(slug: string) {
  return `https://leetcode.cn/problems/${slug}/`
}

function onKey(e: KeyboardEvent) {
  const el = e.target as HTMLElement
  const tag = el?.tagName
  if (tag === 'TEXTAREA' || tag === 'INPUT') return
  if (el?.closest('.cm-editor')) return
  if (e.key === 'ArrowLeft') go(prevId.value)
  else if (e.key === 'ArrowRight') go(nextId.value)
  else if (e.key === 'a' || e.key === 'A') showApproach.value = !showApproach.value
  else if (e.key === 'c' || e.key === 'C') showCode.value = !showCode.value
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div v-if="problem" class="detail-page">

    <!-- 顶部导航栏 -->
    <div class="top-nav">
      <button class="nav-btn back-btn" @click="router.push('/')">
        <span class="nav-icon">‹</span> 列表
      </button>
      <div class="nav-pager">
        <button class="nav-btn" :disabled="prevId == null" @click="go(prevId)">
          ‹ 上一题
        </button>
        <button class="nav-btn" :disabled="nextId == null" @click="go(nextId)">
          下一题 ›
        </button>
      </div>
    </div>

    <!-- 题目标题 + 元数据 -->
    <div class="title-card">
      <div class="title-row">
        <h1 class="problem-title">
          <span class="problem-id">{{ problem.id }}.</span>{{ problem.title }}
        </h1>
        <div class="title-actions">
          <span v-if="problemsStore.isCustom(problem.id)" class="title-badge badge-custom">自定义</span>
          <span v-else-if="problemsStore.isModified(problem.id)" class="title-badge badge-modified">已编辑</span>
          <button class="icon-btn" title="编辑题目" @click="showEditModal = true">✏️</button>
          <button class="icon-btn icon-btn--danger" title="删除题目" @click="handleDelete">🗑️</button>
        </div>
      </div>
      <div class="meta-row">
        <span :class="['diff-badge', diffClass(problem.difficulty)]">{{ problem.difficulty }}</span>
        <span v-for="t in problem.tags" :key="t" class="tag-pill">{{ t }}</span>
      </div>
      <a :href="leetcodeUrl(problem.slug)" target="_blank" rel="noopener" class="lc-link">
        在 LeetCode 打开 ↗
      </a>
    </div>

    <!-- 掌握状态 -->
    <div class="status-card">
      <span class="status-label">掌握状态</span>
      <div class="status-btns">
        <button
          v-for="(label, val) in { unseen: '未学习', learning: '学习中', mastered: '已掌握' }"
          :key="val"
          :class="['status-btn', `status-btn--${val}`, { active: progress.getStatus(problem.id) === val }]"
          @click="setStatus(val as any)"
        >
          {{ label }}
        </button>
      </div>
    </div>

    <!-- 题目描述 -->
    <section class="section-card">
      <div class="section-header">
        <span>📝 题目描述</span>
      </div>
      <div class="section-body">
        <p class="description">{{ problem.description }}</p>
      </div>
    </section>

    <!-- 默写区 -->
    <section class="section-card">
      <div class="section-header">
        <span>✍️ 默写区</span>
        <div class="section-actions">
          <button class="small-btn" @click="saveDraft">保存</button>
          <button class="small-btn" @click="clearDraft">清空</button>
        </div>
      </div>
      <div class="section-body draft-editor-wrap">
        <Codemirror
          v-model="userDraft"
          :extensions="cmExtensions"
          :style="{ height: '260px' }"
          placeholder="在这里默写你的解法 / 关键思路..."
          :tab="true"
        />
      </div>
    </section>

    <!-- 解题思路 -->
    <section class="section-card">
      <div class="section-header">
        <span>💡 解题思路</span>
        <button
          :class="['reveal-btn', showApproach ? 'reveal-btn--hide' : 'reveal-btn--show']"
          @click="showApproach = !showApproach"
        >
          {{ showApproach ? '隐藏' : '显示' }}
        </button>
      </div>
      <div class="section-body" v-if="showApproach">
        <p class="approach-text">{{ problem.approach || '（暂未填写思路，欢迎补充）' }}</p>
        <div v-if="problem.timeComplexity || problem.spaceComplexity" class="complexity-row">
          <span v-if="problem.timeComplexity">⏱ <code>{{ problem.timeComplexity }}</code></span>
          <span v-if="problem.spaceComplexity">💾 <code>{{ problem.spaceComplexity }}</code></span>
        </div>
      </div>
      <div class="section-body" v-else>
        <div class="hidden-block">点击「显示」查看解题思路</div>
      </div>
    </section>

    <!-- 记忆笔记 -->
    <section class="section-card">
      <div class="section-header">
        <span>
          📒 记忆笔记
          <span v-if="hasNote" class="note-dot" title="已有笔记" />
        </span>
        <div class="section-actions">
          <!-- 查看模式 -->
          <template v-if="!editingNote">
            <button class="small-btn" @click="startEditNote">
              {{ hasNote ? '编辑' : '+ 添加' }}
            </button>
            <button v-if="hasNote" class="small-btn small-btn--danger" @click="deleteNote">
              删除
            </button>
          </template>
          <!-- 编辑模式 -->
          <template v-else>
            <button class="small-btn small-btn--primary" @click="saveNote">保存</button>
            <button class="small-btn" @click="cancelEditNote">取消</button>
          </template>
        </div>
      </div>

      <!-- 编辑模式 -->
      <div v-if="editingNote" class="section-body">
        <el-input
          v-model="noteDraft"
          type="textarea"
          :rows="6"
          placeholder="写下你对这道题的记忆要点、易错点、核心结论..."
          resize="vertical"
          autofocus
        />
        <p class="note-tip">支持换行，保存后以段落形式展示</p>
      </div>

      <!-- 查看模式：有笔记则展示，无则引导添加 -->
      <div v-else class="section-body">
        <div v-if="hasNote" class="note-view">
          <p
            v-for="(line, i) in noteContent.split('\n')"
            :key="i"
            class="note-line"
          >{{ line || '\u00A0' }}</p>
        </div>
        <div v-else class="note-empty" @click="startEditNote">
          <span class="note-empty-icon">📝</span>
          <span>点击添加记忆笔记</span>
        </div>
      </div>
    </section>

    <!-- 参考代码 -->
    <section class="section-card">
      <div class="section-header">
        <span>🧩 参考代码</span>
        <div class="section-actions">
          <!-- 编辑模式 -->
          <template v-if="editingCode">
            <button class="small-btn small-btn--primary" @click="saveCode">保存</button>
            <button class="small-btn" @click="cancelEditCode">取消</button>
          </template>
          <!-- 查看模式 -->
          <template v-else>
            <button
              v-if="showCode"
              class="small-btn"
              @click="startEditCode"
            >✏️ 编辑</button>
            <button
              v-if="showCode && isBuiltIn"
              class="small-btn small-btn--danger"
              @click="restoreCode"
              title="还原为内置原始代码"
            >↩ 还原</button>
            <button
              v-if="showCode"
              class="small-btn"
              @click="codeFullscreen = true"
              title="全屏查看"
            >⛶ 全屏</button>
            <button
              :class="['reveal-btn', showCode ? 'reveal-btn--hide' : 'reveal-btn--show']"
              @click="showCode = !showCode"
            >
              {{ showCode ? '隐藏' : '显示' }}
            </button>
          </template>
        </div>
      </div>
      <!-- 编辑模式 -->
      <div v-if="editingCode" class="section-body">
        <el-input
          v-model="codeDraft"
          type="textarea"
          :rows="12"
          placeholder="粘贴参考代码..."
          resize="vertical"
          class="code-textarea"
        />
      </div>
      <!-- 查看模式 -->
      <div class="section-body code-body" v-else-if="showCode">
        <pre class="code-block"><code>{{ problem.code || '// 暂无参考代码' }}</code></pre>
      </div>
      <div class="section-body" v-else>
        <div class="hidden-block">点击「显示」查看参考代码</div>
      </div>
    </section>

    <!-- 编辑题目弹窗 -->
    <ProblemFormModal
      :visible="showEditModal"
      :problem="problem"
      @close="showEditModal = false"
      @saved="showEditModal = false"
    />

    <!-- 移动端悬浮按钮：直接弹出全屏代码 -->
    <teleport to="body">
      <button
        v-if="problem.code"
        class="fab-code"
        @click="codeFullscreen = true"
        aria-label="查看参考代码"
      >
        <span class="fab-icon">🧩</span>
        <span class="fab-label">参考代码</span>
      </button>
    </teleport>

    <!-- 全屏代码阅读器 -->
    <teleport to="body">
      <transition name="fs">
        <div
          v-if="codeFullscreen"
          class="code-fs-overlay"
          @click.self="codeFullscreen = false"
        >
          <div class="code-fs-panel">
            <!-- 工具栏 -->
            <div class="code-fs-toolbar">
              <span class="code-fs-title">{{ problem.id }}. {{ problem.title }}</span>
              <div class="code-fs-tools">
                <button class="fs-tool-btn" title="字号减小" @click="codeFontSize = Math.max(codeFontSize - 1, 10)">A-</button>
                <span class="fs-font-size">{{ codeFontSize }}px</span>
                <button class="fs-tool-btn" title="字号增大" @click="codeFontSize = Math.min(codeFontSize + 1, 24)">A+</button>
                <button class="fs-close-btn" @click="codeFullscreen = false">✕</button>
              </div>
            </div>
            <!-- 代码内容 -->
            <div
              class="code-fs-scroll"
              @touchstart="onTouchStart"
              @touchmove="onTouchMove"
            >
              <pre
                class="code-fs-block"
                :style="{ fontSize: codeFontSize + 'px' }"
              ><code>{{ problem.code || '// 暂无参考代码' }}</code></pre>
            </div>
            <!-- 底部提示 -->
            <div class="code-fs-hint">双指缩放调整字号 · 点击空白处关闭</div>
          </div>
        </div>
      </transition>
    </teleport>

  </div>

  <el-empty v-else description="找不到该题目" />
</template>

<style scoped>
/* ── 整体 ── */
.detail-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ── 顶部导航 ── */
.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.nav-pager {
  display: flex;
  gap: 8px;
}
.nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 8px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  color: #374151;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  min-height: 38px;       /* 触控友好 */
  -webkit-tap-highlight-color: transparent;
}
.nav-btn:active {
  background: #f3f4f6;
}
.nav-btn:disabled {
  opacity: 0.4;
  cursor: default;
}
.nav-icon {
  font-size: 16px;
  line-height: 1;
}

/* ── 标题卡 ── */
.title-card {
  background: #fff;
  border-radius: 10px;
  padding: 14px 14px 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}
.title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}
.problem-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0;
  line-height: 1.4;
  flex: 1;
}
.problem-id {
  color: #9ca3af;
  font-weight: 500;
  margin-right: 4px;
}
.title-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.title-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 5px;
}
.badge-custom   { background: #e0f2fe; color: #0369a1; }
.badge-modified { background: #fef9c3; color: #92400e; }
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  background: #fff;
  font-size: 15px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.icon-btn:active { background: #f3f4f6; }
.icon-btn--danger { border-color: #fecaca; }
.icon-btn--danger:active { background: #fee2e2; }
.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin-bottom: 10px;
}
.diff-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
}
.badge-easy   { background: #dcfce7; color: #15803d; }
.badge-medium { background: #fef9c3; color: #b45309; }
.badge-hard   { background: #fee2e2; color: #b91c1c; }
.lc-link {
  display: inline-block;
  font-size: 13px;
  color: #2563eb;
}

/* ── 掌握状态卡 ── */
.status-card {
  background: #fff;
  border-radius: 10px;
  padding: 12px 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.status-label {
  font-size: 13px;
  color: #6b7280;
  flex-shrink: 0;
}
.status-btns {
  display: flex;
  gap: 8px;
  flex: 1;
}
.status-btn {
  flex: 1;
  padding: 8px 4px;
  border-radius: 8px;
  border: 1.5px solid #e5e7eb;
  background: #f9fafb;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s;
  min-height: 38px;
  -webkit-tap-highlight-color: transparent;
}
.status-btn--unseen.active   { border-color: #94a3b8; background: #f1f5f9; color: #475569; font-weight: 600; }
.status-btn--learning.active { border-color: #f59e0b; background: #fef9c3; color: #b45309; font-weight: 600; }
.status-btn--mastered.active { border-color: #22c55e; background: #dcfce7; color: #15803d; font-weight: 600; }

/* ── 内容 section ── */
.section-card {
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #fafafa;
  border-bottom: 1px solid #f3f4f6;
  font-weight: 600;
  font-size: 14px;
  color: #1f2937;
}
.section-actions {
  display: flex;
  gap: 8px;
}
.section-body {
  padding: 12px 14px;
}

/* 默写区 CodeMirror 容器 */
.draft-editor-wrap {
  padding: 0;
  overflow: hidden;
  border-radius: 0 0 10px 10px;
}
.draft-editor-wrap :deep(.cm-editor) {
  height: 100%;
  font-size: 13px;
}
.draft-editor-wrap :deep(.cm-scroller) {
  font-family: 'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace;
}

/* 显示/隐藏按钮 */
.reveal-btn {
  padding: 5px 14px;
  border-radius: 6px;
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  min-height: 32px;
  -webkit-tap-highlight-color: transparent;
}
.reveal-btn--show {
  background: #3b82f6;
  color: #fff;
}
.reveal-btn--hide {
  background: #f3f4f6;
  color: #374151;
}

/* 小按钮 */
.small-btn {
  padding: 5px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  min-height: 32px;
  -webkit-tap-highlight-color: transparent;
}
.small-btn:active {
  background: #f3f4f6;
}

/* ── 内容 ── */
.description,
.approach-text {
  font-size: 14px;
  line-height: 1.8;
  color: #1f2937;
  white-space: pre-wrap;
  margin: 0;
}

.complexity-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-top: 10px;
  font-size: 13px;
  color: #4b5563;
}
.complexity-row code {
  background: #f3f4f6;
  padding: 1px 5px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', Menlo, monospace;
  font-size: 12px;
}

/* ── 代码块：横向滚动，不溢出屏幕 ── */
.code-body {
  padding: 0;
}
.code-block {
  margin: 0;
  padding: 14px;
  background: #0f172a;
  color: #e2e8f0;
  font-family: 'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace;
  font-size: 12.5px;
  line-height: 1.65;
  overflow-x: auto;
  white-space: pre;
  -webkit-overflow-scrolling: touch;
}

/* 代码编辑 textarea */
.code-textarea :deep(.el-textarea__inner) {
  font-family: 'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace;
  font-size: 12.5px;
  line-height: 1.65;
  background: #0f172a;
  color: #e2e8f0;
  border-color: #1e293b;
}

/* 遮挡块 */
.hidden-block {
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
  padding: 20px 0;
  background: repeating-linear-gradient(
    45deg,
    #f9fafb,
    #f9fafb 10px,
    #f3f4f6 10px,
    #f3f4f6 20px
  );
  border-radius: 6px;
}

/* ══ 记忆笔记 ══ */

/* 标题旁的绿点（已有笔记指示） */
.note-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22c55e;
  margin-left: 5px;
  vertical-align: middle;
  flex-shrink: 0;
}

/* 危险按钮（删除） */
.small-btn--danger {
  color: #ef4444;
  border-color: #fecaca;
}
.small-btn--danger:active {
  background: #fee2e2;
}

/* 主色按钮（保存） */
.small-btn--primary {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}
.small-btn--primary:active {
  background: #2563eb;
}

/* 笔记输入下方提示 */
.note-tip {
  margin: 6px 0 0;
  font-size: 11px;
  color: #9ca3af;
}

/* 查看模式：段落展示 */
.note-view {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.note-line {
  margin: 0;
  font-size: 14px;
  line-height: 1.85;
  color: #1f2937;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 空状态：点击区域 */
.note-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 0;
  color: #9ca3af;
  font-size: 13px;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.note-empty:active {
  background: #f9fafb;
}
.note-empty-icon {
  font-size: 28px;
  line-height: 1;
}

/* ══ 移动端悬浮按钮 ══ */
.fab-code {
  /* 仅移动端可见，桌面端隐藏 */
  display: none;
}
@media (max-width: 639px) {
  .fab-code {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    position: fixed;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    z-index: 1000;
    /* 竖向胶囊形 */
    width: 40px;
    padding: 12px 0;
    border-radius: 0 10px 10px 0;
    border: none;
    background: #1e293b;
    color: #e2e8f0;
    cursor: pointer;
    box-shadow: 2px 2px 10px rgba(0, 0, 0, .25);
    -webkit-tap-highlight-color: transparent;
    /* 竖排文字靠字符旋转实现 */
    writing-mode: initial;
  }
  .fab-code:active {
    background: #334155;
  }
  .fab-icon {
    font-size: 16px;
    line-height: 1;
  }
  .fab-label {
    font-size: 11px;
    font-weight: 600;
    writing-mode: vertical-rl;
    text-orientation: mixed;
    letter-spacing: 1px;
    line-height: 1;
  }
}

/* ══ 全屏代码阅读器 ══ */
.code-fs-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-end;   /* 从底部弹出（手机友好） */
}

.code-fs-panel {
  width: 100%;
  /* 占屏幕 92%，留顶部关闭区域 */
  height: 92dvh;
  background: #0f172a;
  border-radius: 14px 14px 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* 底部安全区 */
  padding-bottom: env(safe-area-inset-bottom);
}

/* 工具栏 */
.code-fs-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #1e293b;
  flex-shrink: 0;
}
.code-fs-title {
  color: #94a3b8;
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 55%;
}
.code-fs-tools {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.fs-tool-btn {
  padding: 5px 10px;
  background: #1e293b;
  border: none;
  border-radius: 6px;
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  min-height: 32px;
  -webkit-tap-highlight-color: transparent;
}
.fs-tool-btn:active {
  background: #334155;
}
.fs-font-size {
  color: #64748b;
  font-size: 12px;
  min-width: 32px;
  text-align: center;
}
.fs-close-btn {
  padding: 5px 10px;
  background: #ef4444;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  min-height: 32px;
  -webkit-tap-highlight-color: transparent;
}

/* 代码滚动区：双向自由滑动 */
.code-fs-scroll {
  flex: 1;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
.code-fs-block {
  margin: 0;
  padding: 16px;
  background: transparent;
  color: #e2e8f0;
  font-family: 'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace;
  line-height: 1.7;
  white-space: pre;
  /* 不换行，让横向滚动生效 */
  min-width: max-content;
}

.code-fs-hint {
  text-align: center;
  color: #334155;
  font-size: 11px;
  padding: 6px;
  flex-shrink: 0;
}

/* 过渡动画：从底部滑入 */
.fs-enter-active,
.fs-leave-active {
  transition: opacity 0.2s ease;
}
.fs-enter-active .code-fs-panel,
.fs-leave-active .code-fs-panel {
  transition: transform 0.25s ease;
}
.fs-enter-from,
.fs-leave-to {
  opacity: 0;
}
.fs-enter-from .code-fs-panel,
.fs-leave-to .code-fs-panel {
  transform: translateY(100%);
}

/* ── 桌面端加大间距 ── */
@media (min-width: 640px) {
  .title-card,
  .status-card,
  .section-header {
    padding-left: 20px;
    padding-right: 20px;
  }
  .section-body {
    padding: 16px 20px;
  }
  .problem-title {
    font-size: 22px;
  }
  .code-block {
    font-size: 13.5px;
  }
  .nav-btn {
    font-size: 14px;
  }

  /* 桌面全屏面板：居中弹窗 */
  .code-fs-overlay {
    align-items: center;
    justify-content: center;
  }
  .code-fs-panel {
    width: min(860px, 90vw);
    height: 80vh;
    border-radius: 12px;
  }
}
</style>
