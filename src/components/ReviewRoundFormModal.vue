<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useReviewRoundsStore } from '@/stores/reviewRounds'
import { useProgressStore } from '@/stores/progress'
import { useProblemsStore } from '@/stores/problems'
import type { ReviewRound } from '@/types/reviewRound'

const props = defineProps<{
  visible: boolean
  /** 传入则为编辑模式 */
  reviewRound?: ReviewRound | null
  /** 新建模式下默认选中的题目 ID */
  defaultProblemId?: number | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const reviewRoundsStore = useReviewRoundsStore()
const progressStore = useProgressStore()
const problemsStore = useProblemsStore()

const isEdit = computed(() => !!props.reviewRound)
const modalTitle = computed(() => (isEdit.value ? '编辑复习轮次' : '新建复习轮次'))

// 表单数据
const name = ref('')
const note = ref('')
const selectedProblemIds = ref<number[]>([])

// 题目选项 — 只显示错题集中的题目
const problemOptions = computed(() => {
  const wrongSet = new Set(progressStore.wrongSet)
  return problemsStore.allProblems
    .filter((p) => wrongSet.has(p.id))
    .map((p) => ({
      value: p.id,
      label: `${p.id}. ${p.title}`,
    }))
})

watch(
  () => props.visible,
  (val) => {
    if (!val) return
    if (props.reviewRound) {
      name.value = props.reviewRound.name
      note.value = props.reviewRound.note
      selectedProblemIds.value = [...props.reviewRound.problemIds]
    } else {
      name.value = ''
      note.value = ''
      // 如果传入了默认题目 ID，自动选中
      selectedProblemIds.value = props.defaultProblemId ? [props.defaultProblemId] : []
    }
  }
)

function handleSave() {
  if (!name.value.trim()) {
    ElMessage.error('请输入轮次名称')
    return
  }

  if (isEdit.value && props.reviewRound) {
    reviewRoundsStore.updateRound(props.reviewRound.id, {
      name: name.value.trim(),
      note: note.value.trim(),
      problemIds: selectedProblemIds.value,
    })
    ElMessage.success('复习轮次已更新')
  } else {
    reviewRoundsStore.createRound(name.value.trim(), selectedProblemIds.value, note.value.trim())
    ElMessage.success('复习轮次已创建')
  }

  emit('close')
}
</script>

<template>
  <teleport to="body">
    <transition name="modal">
      <div v-if="visible" class="form-overlay">
        <div class="form-panel">

          <!-- 头部 -->
          <div class="form-header">
            <span class="form-title">{{ modalTitle }}</span>
            <button class="hdr-btn--close" @click="emit('close')">✕</button>
          </div>

          <!-- 表单内容 -->
          <div class="form-body">
            <div class="form-section">
              <div class="field">
                <label class="field-label">轮次名称 <em>*</em></label>
                <el-input v-model="name" placeholder="如：第一轮复习" />
              </div>

              <div class="field">
                <label class="field-label">选择错题 <em>*</em></label>
                <el-select
                  v-model="selectedProblemIds"
                  multiple
                  filterable
                  placeholder="搜索并选择错题"
                  style="width: 100%"
                  popper-class="form-modal-popper"
                >
                  <el-option
                    v-for="opt in problemOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
                <p class="field-hint">只能选择错题集中的题目 ({{ problemOptions.length }} 道)</p>
              </div>

              <div class="field field--full">
                <label class="field-label">轮次笔记</label>
                <el-input
                  v-model="note"
                  type="textarea"
                  :rows="6"
                  placeholder="添加关于这个复习轮次的说明..."
                  resize="none"
                />
              </div>
            </div>
          </div>

          <!-- 底部操作 -->
          <div class="form-footer">
            <button class="foot-btn foot-btn--cancel" @click="emit('close')">取消</button>
            <button class="foot-btn foot-btn--save" @click="handleSave">
              {{ isEdit ? '保存修改' : '创建轮次' }}
            </button>
          </div>

        </div>
      </div>
    </transition>
  </teleport>
</template>

<style scoped>
/* ── 遮罩 ── */
.form-overlay {
  position: fixed;
  inset: 0;
  z-index: 2100;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
}

/* ── 面板（移动端：底部抽屉） ── */
.form-panel {
  width: 100%;
  max-height: 80dvh;
  background: #fff;
  border-radius: 14px 14px 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom);
}

/* ── 头部 ── */
.form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}
.form-title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}
.hdr-btn--close {
  background: #f3f4f6;
  border: none;
  color: #374151;
  padding: 5px 12px;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  min-height: 32px;
}

/* ── 表单内容 ── */
.form-body {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 14px 16px;
}
.form-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.field--full {
  flex: 1;
  min-height: 0;
}
.field-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}
.field-label em {
  color: #ef4444;
  font-style: normal;
  margin-left: 2px;
}
.field-hint {
  margin: 2px 0 0;
  font-size: 11px;
  color: #9ca3af;
}

/* ── 底部按钮 ── */
.form-footer {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid #f3f4f6;
  flex-shrink: 0;
}
.foot-btn {
  flex: 1;
  padding: 12px;
  border-radius: 9px;
  border: none;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  min-height: 46px;
}
.foot-btn--cancel {
  background: #f3f4f6;
  color: #374151;
}
.foot-btn--save {
  background: #3b82f6;
  color: #fff;
}
.foot-btn--save:active {
  background: #2563eb;
}

/* ── 过渡动画 ── */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active .form-panel,
.modal-leave-active .form-panel {
  transition: transform 0.25s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .form-panel,
.modal-leave-to .form-panel {
  transform: translateY(100%);
}

/* ── 桌面端：居中弹窗 ── */
@media (min-width: 640px) {
  .form-overlay {
    align-items: center;
    justify-content: center;
  }
  .form-panel {
    width: min(560px, 92vw);
    max-height: min(72vh, 600px);
    border-radius: 12px;
  }
}

/* 下拉弹出层 z-index 需高于模态框遮罩 (2100) */
:global(.form-modal-popper) {
  z-index: 2200 !important;
}
</style>
