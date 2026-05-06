import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

/** 每道题的掌握状态 */
export type MasteryStatus = 'unseen' | 'learning' | 'mastered'

interface ProgressState {
  /** key = 题号，value = 状态 */
  status: Record<number, MasteryStatus>
  /** 上次查看时间戳 */
  lastViewed: Record<number, number>
}

const STORAGE_KEY = 'hot100-progress-v1'

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { status: {}, lastViewed: {} }
    return JSON.parse(raw)
  } catch {
    return { status: {}, lastViewed: {} }
  }
}

export const useProgressStore = defineStore('progress', () => {
  const initial = load()
  const status = ref<Record<number, MasteryStatus>>(initial.status ?? {})
  const lastViewed = ref<Record<number, number>>(initial.lastViewed ?? {})

  watch(
    [status, lastViewed],
    () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ status: status.value, lastViewed: lastViewed.value })
      )
    },
    { deep: true }
  )

  function setStatus(id: number, s: MasteryStatus) {
    status.value = { ...status.value, [id]: s }
  }

  function getStatus(id: number): MasteryStatus {
    return status.value[id] ?? 'unseen'
  }

  function markViewed(id: number) {
    lastViewed.value = { ...lastViewed.value, [id]: Date.now() }
  }

  function reset() {
    status.value = {}
    lastViewed.value = {}
  }

  const stats = computed(() => {
    const vals = Object.values(status.value)
    return {
      mastered: vals.filter((v) => v === 'mastered').length,
      learning: vals.filter((v) => v === 'learning').length
    }
  })

  return { status, lastViewed, setStatus, getStatus, markViewed, reset, stats }
})
