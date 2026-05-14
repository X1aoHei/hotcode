import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

/** 每道题的掌握状态 */
export type MasteryStatus = 'unseen' | 'learning' | 'mastered'

interface ProgressState {
  /** key = 题号，value = 状态 */
  status: Record<number, MasteryStatus>
  /** 上次查看时间戳 */
  lastViewed: Record<number, number>
  /** 错题集题目 ID 列表 */
  wrongSet: number[]
}

const STORAGE_KEY = 'hot100-progress-v1'

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { status: {}, lastViewed: {}, wrongSet: [] }
    const data = JSON.parse(raw)
    return { status: data.status ?? {}, lastViewed: data.lastViewed ?? {}, wrongSet: data.wrongSet ?? [] }
  } catch {
    return { status: {}, lastViewed: {}, wrongSet: [] }
  }
}

export const useProgressStore = defineStore('progress', () => {
  const initial = load()
  const status = ref<Record<number, MasteryStatus>>(initial.status ?? {})
  const lastViewed = ref<Record<number, number>>(initial.lastViewed ?? {})
  const wrongSet = ref<number[]>(initial.wrongSet ?? [])

  watch(
    [status, lastViewed, wrongSet],
    () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ status: status.value, lastViewed: lastViewed.value, wrongSet: wrongSet.value })
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
    wrongSet.value = []
  }

  /** 切换错题标记 */
  function toggleWrong(id: number) {
    const idx = wrongSet.value.indexOf(id)
    if (idx >= 0) {
      wrongSet.value.splice(idx, 1)
    } else {
      wrongSet.value.push(id)
    }
  }

  /** 是否已标记为错题 */
  function isWrong(id: number): boolean {
    return wrongSet.value.includes(id)
  }

  const stats = computed(() => {
    const vals = Object.values(status.value)
    return {
      mastered: vals.filter((v) => v === 'mastered').length,
      learning: vals.filter((v) => v === 'learning').length
    }
  })

  return { status, lastViewed, wrongSet, setStatus, getStatus, markViewed, reset, toggleWrong, isWrong, stats }
})
