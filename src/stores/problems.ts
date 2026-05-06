import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { problems as staticProblems } from '@/data/problems'
import type { Problem } from '@/types/problem'

const STORAGE_KEY = 'hot100-user-problems-v1'

interface UserData {
  /** 用户新增的自定义题目 */
  added: Problem[]
  /** 用户修改过的内置题目（完整副本，覆盖静态数据） */
  modified: Record<number, Problem>
  /** 用户删除的内置题目 ID */
  deleted: number[]
}

function loadUserData(): UserData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { added: [], modified: {}, deleted: [] }
    return JSON.parse(raw)
  } catch {
    return { added: [], modified: {}, deleted: [] }
  }
}

export const useProblemsStore = defineStore('problems', () => {
  const userData = ref<UserData>(loadUserData())

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData.value))
  }

  /** 合并后的完整题目列表（静态 + 用户改动） */
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

  /** 所有标签（去重排序） */
  const allTags = computed<string[]>(() =>
    Array.from(new Set(allProblems.value.flatMap((p) => p.tags))).sort()
  )

  /** 按 ID 查找题目 */
  function getById(id: number): Problem | undefined {
    return allProblems.value.find((p) => p.id === id)
  }

  /** 是否为用户自定义题目 */
  function isCustom(id: number) {
    return userData.value.added.some((p) => p.id === id)
  }

  /** 是否为修改过的内置题目 */
  function isModified(id: number) {
    return id in userData.value.modified
  }

  /** 新增自定义题目 */
  function addProblem(p: Problem) {
    userData.value.added.push(p)
    persist()
  }

  /** 更新题目（内置 → 存 modified；自定义 → 直接替换） */
  function updateProblem(p: Problem) {
    const isStatic = staticProblems.some((sp) => sp.id === p.id)
    if (isStatic) {
      userData.value.modified = { ...userData.value.modified, [p.id]: p }
    } else {
      const idx = userData.value.added.findIndex((ap) => ap.id === p.id)
      if (idx >= 0) userData.value.added[idx] = p
    }
    persist()
  }

  /** 删除题目（内置 → 加入 deleted；自定义 → 直接移除） */
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

  /** 还原内置题目至原始状态 */
  function resetProblem(id: number) {
    const { [id]: _, ...rest } = userData.value.modified
    userData.value.modified = rest
    userData.value.deleted = userData.value.deleted.filter((d) => d !== id)
    persist()
  }

  /** 生成下一个自定义题目 ID（从 10001 开始） */
  function nextCustomId(): number {
    const ids = userData.value.added.map((p) => p.id)
    return ids.length ? Math.max(...ids) + 1 : 10001
  }

  /** ID 是否已存在 */
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
  }
})
