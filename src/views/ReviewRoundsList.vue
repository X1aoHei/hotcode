<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useReviewRoundsStore } from '@/stores/reviewRounds'
import { useProblemsStore } from '@/stores/problems'
import ReviewRoundFormModal from '@/components/ReviewRoundFormModal.vue'
import type { ReviewRound } from '@/types/reviewRound'

const router = useRouter()
const reviewRoundsStore = useReviewRoundsStore()
const problemsStore = useProblemsStore()

const rounds = computed(() => reviewRoundsStore.allRounds)

// 弹窗状态
const showModal = ref(false)
const editingRound = ref<ReviewRound | undefined>(undefined)

function getProblemTitle(id: number): string {
  return problemsStore.getById(id)?.title ?? `#${id}`
}

function openRound(round: ReviewRound) {
  if (round.problemIds.length > 0) {
    router.push({ name: 'detail', params: { id: String(round.problemIds[0]) } })
  }
}

function createRound() {
  editingRound.value = undefined
  showModal.value = true
}

function editRound(round: ReviewRound) {
  editingRound.value = round
  showModal.value = true
}

async function deleteRound(round: ReviewRound) {
  try {
    await ElMessageBox.confirm(
      `确定删除复习轮次「${round.name}」吗？`,
      '删除确认',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    )
    reviewRoundsStore.deleteRound(round.id)
    ElMessage.success('已删除')
  } catch {
    // 取消
  }
}

function onModalClose() {
  showModal.value = false
  editingRound.value = undefined
}
</script>

<template>
  <div class="rounds-page">
    <!-- 顶部导航 -->
    <div class="page-header">
      <button class="back-btn" @click="router.push('/')">← 返回</button>
      <h1 class="page-title">复习轮次</h1>
    </div>

    <!-- 新建按钮 -->
    <button class="create-btn" @click="createRound">
      ＋ 新建复习轮次
    </button>

    <!-- 轮次列表 -->
    <ul v-if="rounds.length > 0" class="round-list">
      <li v-for="round in rounds" :key="round.id" class="round-card">
        <div class="round-header" @click="openRound(round)">
          <div class="round-name">{{ round.name }}</div>
          <el-tag size="small" type="warning">{{ round.problemIds.length }} 题</el-tag>
        </div>

        <!-- 笔记预览 -->
        <p v-if="round.note" class="round-note">{{ round.note }}</p>

        <!-- 题目标签 -->
        <div class="round-problems">
          <span
            v-for="id in [...round.problemIds].sort((a, b) => a - b)"
            :key="id"
            class="problem-chip"
            @click.stop="router.push({ name: 'detail', params: { id: String(id) } })"
          >
            {{ id }}. {{ getProblemTitle(id) }}
          </span>
        </div>

        <!-- 操作按钮 -->
        <div class="round-actions">
          <el-button size="small" @click.stop="editRound(round)">编辑</el-button>
          <el-button size="small" type="danger" @click.stop="deleteRound(round)">删除</el-button>
        </div>
      </li>
    </ul>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <p>暂无复习轮次</p>
      <p class="empty-hint">点击「新建复习轮次」开始系统化复习错题</p>
    </div>
  </div>

  <ReviewRoundFormModal
    :visible="showModal"
    :review-round="editingRound"
    @close="onModalClose"
  />
</template>

<style scoped>
.rounds-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 顶部导航 */
.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.back-btn {
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  font-size: 14px;
  cursor: pointer;
}
.back-btn:active {
  background: #f3f4f6;
}
.page-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

/* 新建按钮 */
.create-btn {
  width: 100%;
  padding: 12px;
  border: 1.5px dashed #f59e0b;
  border-radius: 10px;
  background: #fffbeb;
  color: #d97706;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.create-btn:active {
  background: #fef3c7;
}

/* 轮次列表 */
.round-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.round-card {
  background: #fff;
  border-radius: 10px;
  padding: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}
.round-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}
.round-name {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

/* 笔记预览 */
.round-note {
  margin: 8px 0 0;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 题目标签 */
.round-problems {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.problem-chip {
  font-size: 12px;
  padding: 4px 8px;
  background: #fef3c7;
  border-radius: 6px;
  color: #92400e;
  cursor: pointer;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.problem-chip:active {
  background: #fde68a;
}

/* 操作按钮 */
.round-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  justify-content: flex-end;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 48px 16px;
  color: #9ca3af;
}
.empty-state p {
  margin: 0;
  font-size: 15px;
}
.empty-hint {
  margin-top: 8px !important;
  font-size: 13px !important;
}

/* 桌面端 */
@media (min-width: 640px) {
  .round-card {
    padding: 16px;
  }
  .round-name {
    font-size: 17px;
  }
}
</style>
