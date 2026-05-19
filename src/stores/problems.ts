import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { problems as staticProblems } from '@/data/problems'
import type { Problem } from '@/types/problem'
import { api } from '@/utils/api'

const STORAGE_KEY = 'hot100-user-problems-v1'

interface UserData {
  added: Problem[]
  modified: Record<number, Problem>
  deleted: number[]
}

function loadLocal(): UserData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { added: [], modified: {}, deleted: [] }
    return JSON.parse(raw)
  } catch {
    return { added: [], modified: {}, deleted: [] }
  }
}

export const useProblemsStore = defineStore('problems', () => {
  const userData = ref<UserData>(loadLocal())
  let synced = false

  /** 从 D1 加载数据 */
  async function sync() {
    try {
      const data = await api.get<UserData>('/user-problems')
      userData.value = {
        added: data.added ?? [],
        modified: data.modified ?? {},
        deleted: data.deleted ?? [],
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData.value))
      synced = true
    } catch {
      // API 不可用时使用 localStorage
    }
  }

  /** 保存到 D1 + localStorage */
  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData.value))
    if (synced) {
      api.post('/user-problems', userData.value).catch(() => {})
    }
  }

  // 启动时从 D1 同步
  sync()

  const allProblems = computed<Problem[]>(() => {
    const deletedSet = new Set(userData.value.deleted)
    const list: Problem[] = []
    for (const p of staticProblems) {
      if (deletedSet.has(p.id)) continue
      list.push(userData.value.modified[p.id] ?? p)
    }
    list.push(...userData.value.added)
    return list
  })

  const allTags = computed<string[]>(() =>
    Array.from(new Set(allProblems.value.flatMap((p) => p.tags))).sort()
  )

  function getById(id: number): Problem | undefined {
    return allProblems.value.find((p) => p.id === id)
  }

  function isCustom(id: number) {
    return userData.value.added.some((p) => p.id === id)
  }

  function isModified(id: number) {
    return id in userData.value.modified
  }

  function addProblem(p: Problem) {
    userData.value.added.push(p)
    persist()
  }

  function updateProblem(p: Problem) {
    const isStatic = staticProblems.some((sp) => sp.id === p.id)
    if (isStatic) {
      userData.value.modified = { ...userData.value.modified, [p.id]: p }
    } else {
      const idx = userData.value.added.findIndex((ap) => ap.id === p.id)
      if (idx >= 0) userData.value.added.splice(idx, 1, p)
    }
    persist()
  }

  function deleteProblem(id: number) {
    const isStatic = staticProblems.some((sp) => sp.id === id)
    if (isStatic) {
      if (!userData.value.deleted.includes(id)) {
        userData.value.deleted = [...userData.value.deleted, id]
      }
      const { [id]: _, ...rest } = userData.value.modified
      userData.value.modified = rest
    } else {
      userData.value.added = userData.value.added.filter((p) => p.id !== id)
    }
    persist()
  }

  function resetProblem(id: number) {
    const { [id]: _, ...rest } = userData.value.modified
    userData.value.modified = rest
    userData.value.deleted = userData.value.deleted.filter((d) => d !== id)
    persist()
  }

  function nextCustomId(): number {
    const ids = userData.value.added.map((p) => p.id)
    return ids.length ? Math.max(...ids) + 1 : 10001
  }

  function idExists(id: number) {
    return allProblems.value.some((p) => p.id === id)
  }

  return {
    allProblems,
    allTags,
    getById,
    isCustom,
    isModified,
    addProblem,
    updateProblem,
    deleteProblem,
    resetProblem,
    nextCustomId,
    idExists,
    sync,
  }
})
