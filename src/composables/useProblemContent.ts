/**
 * 封装每道题的笔记和草稿的加载/保存逻辑
 * 替代 ProblemDetail.vue 中直接操作 localStorage 的代码
 */

import { ref, watch, type Ref } from 'vue'
import { api } from '@/api/client'
import { ElMessage } from 'element-plus'

export function useProblemContent(
  problemId: Ref<number>,
  getDefaultDraft: (id: number) => string
) {
  const noteContent = ref('')
  const noteDraft = ref('')
  const editingNote = ref(false)
  const userDraft = ref('')
  const contentLoading = ref(false)

  // 切题时加载笔记和草稿
  watch(problemId, async (id) => {
    if (!id) return
    contentLoading.value = true
    try {
      const data = await api.getContent(id)
      noteContent.value = data.note ?? ''
      noteDraft.value = noteContent.value
      editingNote.value = false
      // 草稿：如果 API 返回空，使用默认草稿
      userDraft.value = data.draft || getDefaultDraft(id)
    } catch (e) {
      console.error('加载内容失败:', e)
      noteContent.value = ''
      noteDraft.value = ''
      userDraft.value = getDefaultDraft(id)
    } finally {
      contentLoading.value = false
    }
  }, { immediate: true })

  // ── 笔记 ──

  function startEditNote() {
    noteDraft.value = noteContent.value
    editingNote.value = true
  }

  function cancelEditNote() {
    noteDraft.value = noteContent.value
    editingNote.value = false
  }

  async function saveNote() {
    if (!problemId.value) return
    const prev = noteContent.value
    noteContent.value = noteDraft.value
    editingNote.value = false
    try {
      await api.updateContent(problemId.value, { note: noteDraft.value })
      ElMessage.success('笔记已保存')
    } catch (e) {
      noteContent.value = prev
      ElMessage.error('保存笔记失败')
      console.error(e)
    }
  }

  async function deleteNote() {
    if (!problemId.value) return
    const prevNote = noteContent.value
    const prevDraft = noteDraft.value
    noteContent.value = ''
    noteDraft.value = ''
    editingNote.value = false
    try {
      await api.updateContent(problemId.value, { note: '' })
      ElMessage.success('笔记已删除')
    } catch (e) {
      noteContent.value = prevNote
      noteDraft.value = prevDraft
      ElMessage.error('删除笔记失败')
      console.error(e)
    }
  }

  // ── 草稿（自动保存防抖） ──

  let autoSaveTimer: ReturnType<typeof setTimeout> | null = null

  watch(userDraft, () => {
    if (autoSaveTimer) clearTimeout(autoSaveTimer)
    autoSaveTimer = setTimeout(() => {
      if (problemId.value) {
        api.updateContent(problemId.value, { draft: userDraft.value }).catch((e) => {
          console.error('自动保存草稿失败:', e)
        })
      }
    }, 800)
  })

  async function saveDraft() {
    if (!problemId.value) return
    try {
      await api.updateContent(problemId.value, { draft: userDraft.value })
      ElMessage.success('草稿已保存')
    } catch (e) {
      ElMessage.error('保存草稿失败')
      console.error(e)
    }
  }

  function clearDraft() {
    if (!problemId.value) return
    userDraft.value = getDefaultDraft(problemId.value)
    api.updateContent(problemId.value, { draft: '' }).catch((e) => {
      console.error('清空草稿失败:', e)
    })
  }

  return {
    noteContent,
    noteDraft,
    editingNote,
    userDraft,
    contentLoading,
    startEditNote,
    cancelEditNote,
    saveNote,
    deleteNote,
    saveDraft,
    clearDraft,
  }
}
