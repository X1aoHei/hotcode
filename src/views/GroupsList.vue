<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useGroupsStore } from '@/stores/groups'
import { useProblemsStore } from '@/stores/problems'
import GroupFormModal from '@/components/GroupFormModal.vue'
import type { ProblemGroup } from '@/types/group'

const router = useRouter()
const groupsStore = useGroupsStore()
const problemsStore = useProblemsStore()

const groups = computed(() => groupsStore.allGroups)

// 弹窗状态
const showModal = ref(false)
const editingGroup = ref<ProblemGroup | undefined>(undefined)

function getProblemTitle(id: number): string {
  return problemsStore.getById(id)?.title ?? `#${id}`
}

function openGroup(group: ProblemGroup) {
  if (group.problemIds.length > 0) {
    router.push({ name: 'detail', params: { id: String(group.problemIds[0]) } })
  }
}

function createGroup() {
  editingGroup.value = undefined
  showModal.value = true
}

function editGroup(group: ProblemGroup) {
  editingGroup.value = group
  showModal.value = true
}

async function deleteGroup(group: ProblemGroup) {
  try {
    await ElMessageBox.confirm(
      `确定删除组合「${group.name}」吗？`,
      '删除确认',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    )
    groupsStore.deleteGroup(group.id)
    ElMessage.success('已删除')
  } catch {
    // 取消
  }
}

function onModalClose() {
  showModal.value = false
  editingGroup.value = undefined
}
</script>

<template>
  <div class="groups-page">
    <!-- 顶部导航 -->
    <div class="page-header">
      <button class="back-btn" @click="router.push('/')">← 返回</button>
      <h1 class="page-title">题目组合</h1>
    </div>

    <!-- 新建按钮 -->
    <button class="create-btn" @click="createGroup">
      ＋ 新建组合
    </button>

    <!-- 组合列表 -->
    <ul v-if="groups.length > 0" class="group-list">
      <li v-for="group in groups" :key="group.id" class="group-card">
        <div class="group-header" @click="openGroup(group)">
          <div class="group-name">{{ group.name }}</div>
          <el-tag size="small" type="info">{{ group.problemIds.length }} 题</el-tag>
        </div>

        <!-- 笔记预览 -->
        <p v-if="group.note" class="group-note">{{ group.note }}</p>

        <!-- 题目标签 -->
        <div class="group-problems">
          <span
            v-for="id in group.problemIds"
            :key="id"
            class="problem-chip"
            @click.stop="router.push({ name: 'detail', params: { id: String(id) } })"
          >
            {{ id }}. {{ getProblemTitle(id) }}
          </span>
        </div>

        <!-- 操作按钮 -->
        <div class="group-actions">
          <el-button size="small" @click.stop="editGroup(group)">编辑</el-button>
          <el-button size="small" type="danger" @click.stop="deleteGroup(group)">删除</el-button>
        </div>
      </li>
    </ul>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <p>暂无题目组合</p>
      <p class="empty-hint">点击「新建组合」将相关题目关联在一起</p>
    </div>
  </div>

  <GroupFormModal
    :visible="showModal"
    :group="editingGroup"
    @close="onModalClose"
  />
</template>

<style scoped>
.groups-page {
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
  border: 1.5px dashed #93c5fd;
  border-radius: 10px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.create-btn:active {
  background: #dbeafe;
}

/* 组合列表 */
.group-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.group-card {
  background: #fff;
  border-radius: 10px;
  padding: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}
.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}
.group-name {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

/* 笔记预览 */
.group-note {
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
.group-problems {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.problem-chip {
  font-size: 12px;
  padding: 4px 8px;
  background: #f3f4f6;
  border-radius: 6px;
  color: #374151;
  cursor: pointer;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.problem-chip:active {
  background: #e5e7eb;
}
/* 操作按钮 */
.group-actions {
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
  .group-card {
    padding: 16px;
  }
  .group-name {
    font-size: 17px;
  }
}
</style>
