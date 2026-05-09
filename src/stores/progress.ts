import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api/client'
import { ElMessage } from 'element-plus'

export type MasteryStatus = 'unseen' | 'learning' | 'mastered'

export const useProgressStore = defineStore('progress', () => {
  const status = ref<Record<number, MasteryStatus>>({})
  const lastViewed = ref<Record<number, number>>({})

  async function init() {
    try {
      const data = await api.getProgress()
      const s: Record<number, MasteryStatus> = {}
      const lv: Record<number, number> = {}
      for (const [idStr, rec] of Object.entries(data)) {
        const id = Number(idStr)
        s[id] = rec.status as MasteryStatus
        lv[id] = rec.lastViewed
      }
      status.value = s
      lastViewed.value = lv
    } catch (e) {
      console.error('加载进度数据失败:', e)
      ElMessage.error('加载进度数据失败，请刷新重试')
    }
  }

  function setStatus(id: number, s: MasteryStatus) {
    const prev = status.value[id]
    status.value = { ...status.value, [id]: s }
    api.updateProgress(id, { status: s }).catch((e) => {
      // 回滚
      if (prev) {
        status.value = { ...status.value, [id]: prev }
      } else {
        const { [id]: _, ...rest } = status.value
        status.value = rest
      }
      ElMessage.error('更新状态失败')
      console.error(e)
    })
  }

  function getStatus(id: number): MasteryStatus {
    return status.value[id] ?? 'unseen'
  }

  function markViewed(id: number) {
    const now = Date.now()
    lastViewed.value = { ...lastViewed.value, [id]: now }
    api.updateProgress(id, { lastViewed: now }).catch((e) => {
      console.error('更新查看时间失败:', e)
    })
  }

  function reset() {
    status.value = {}
    lastViewed.value = {}
    api.resetProgress().catch((e) => {
      ElMessage.error('重置进度失败')
      console.error(e)
    })
  }

  const stats = computed(() => {
    const vals = Object.values(status.value)
    return {
      mastered: vals.filter((v) => v === 'mastered').length,
      learning: vals.filter((v) => v === 'learning').length
    }
  })

  return { status, lastViewed, init, setStatus, getStatus, markViewed, reset, stats }
})
