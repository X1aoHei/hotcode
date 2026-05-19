import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { api } from '@/utils/api'

export type MasteryStatus = 'unseen' | 'learning' | 'mastered'

interface ProgressState {
  status: Record<number, MasteryStatus>
  lastViewed: Record<number, number>
  wrongSet: number[]
}

const STORAGE_KEY = 'hot100-progress-v1'

function loadLocal(): ProgressState {
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
  const initial = loadLocal()
  const status = ref<Record<number, MasteryStatus>>(initial.status ?? {})
  const lastViewed = ref<Record<number, number>>(initial.lastViewed ?? {})
  const wrongSet = ref<number[]>(initial.wrongSet ?? [])
  let synced = false

  /** 从 D1 加载数据 */
  async function sync() {
    try {
      const data = await api.get<ProgressState>('/progress')
      status.value = data.status ?? {}
      lastViewed.value = data.lastViewed ?? {}
      wrongSet.value = data.wrongSet ?? []
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ status: status.value, lastViewed: lastViewed.value, wrongSet: wrongSet.value })
      )
      synced = true
    } catch {
      // API 不可用时使用 localStorage
    }
  }

  // 保存到 localStorage + D1
  watch(
    [status, lastViewed, wrongSet],
    () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ status: status.value, lastViewed: lastViewed.value, wrongSet: wrongSet.value })
      )
      if (synced) {
        api.post('/progress', { status: status.value, lastViewed: lastViewed.value, wrongSet: wrongSet.value }).catch(() => {})
      }
    },
    { deep: true }
  )

  // 启动时从 D1 同步
  sync()

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

  function toggleWrong(id: number) {
    const idx = wrongSet.value.indexOf(id)
    if (idx >= 0) {
      wrongSet.value.splice(idx, 1)
    } else {
      wrongSet.value.push(id)
    }
  }

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

  return { status, lastViewed, wrongSet, setStatus, getStatus, markViewed, reset, toggleWrong, isWrong, stats, sync }
})
