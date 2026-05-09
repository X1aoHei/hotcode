import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { problems as staticProblems } from '@/data/problems'
import { api } from '@/api/client'
import type { Problem } from '@/types/problem'
import { ElMessage } from 'element-plus'

interface UserData {
  added: Problem[]
  modified: Record<number, Problem>
  deleted: number[]
}

const defaultUserData: UserData = { added: [], modified: {}, deleted: [] }

export const useProblemsStore = defineStore('problems', () => {
  const userData = ref<UserData>({ ...defaultUserData })

  async function init() {
    try {
      userData.value = await api.getUserProblems()
    } catch (e) {
      console.error('加载用户题目数据失败:', e)
      ElMessage.error('加载题目数据失败，请刷新重试')
    }
  }

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

  async function addProblem(p: Problem) {
    userData.value.added.push(p)
    try {
      await api.createProblem(p)
    } catch (e) {
      userData.value.added = userData.value.added.filter((ap) => ap.id !== p.id)
      ElMessage.error('保存题目失败')
      throw e
    }
  }

  async function updateProblem(p: Problem) {
    const isStatic = staticProblems.some((sp) => sp.id === p.id)
    const prev = isStatic ? userData.value.modified[p.id] : userData.value.added.find((ap) => ap.id === p.id)

    if (isStatic) {
      userData.value.modified = { ...userData.value.modified, [p.id]: p }
    } else {
      const idx = userData.value.added.findIndex((ap) => ap.id === p.id)
      if (idx >= 0) userData.value.added.splice(idx, 1, p)
    }

    try {
      await api.updateProblem(p.id, p, !isStatic)
    } catch (e) {
      // 回滚
      if (isStatic) {
        if (prev) {
          userData.value.modified = { ...userData.value.modified, [p.id]: prev }
        } else {
          const { [p.id]: _, ...rest } = userData.value.modified
          userData.value.modified = rest
        }
      } else {
        const idx = userData.value.added.findIndex((ap) => ap.id === p.id)
        if (idx >= 0 && prev) userData.value.added.splice(idx, 1, prev as Problem)
      }
      ElMessage.error('更新题目失败')
      throw e
    }
  }

  async function deleteProblem(id: number) {
    const isStatic = staticProblems.some((sp) => sp.id === id)
    // 保存回滚数据
    const prevAdded = [...userData.value.added]
    const prevModified = { ...userData.value.modified }
    const prevDeleted = [...userData.value.deleted]

    if (isStatic) {
      if (!userData.value.deleted.includes(id)) {
        userData.value.deleted = [...userData.value.deleted, id]
      }
      const { [id]: _, ...rest } = userData.value.modified
      userData.value.modified = rest
    } else {
      userData.value.added = userData.value.added.filter((p) => p.id !== id)
    }

    try {
      await api.deleteProblem(id)
    } catch (e) {
      userData.value.added = prevAdded
      userData.value.modified = prevModified
      userData.value.deleted = prevDeleted
      ElMessage.error('删除题目失败')
      throw e
    }
  }

  async function resetProblem(id: number) {
    const prevModified = { ...userData.value.modified }
    const prevDeleted = [...userData.value.deleted]

    const { [id]: _, ...rest } = userData.value.modified
    userData.value.modified = rest
    userData.value.deleted = userData.value.deleted.filter((d) => d !== id)

    try {
      await api.resetProblem(id)
    } catch (e) {
      userData.value.modified = prevModified
      userData.value.deleted = prevDeleted
      ElMessage.error('还原题目失败')
      throw e
    }
  }

  function nextCustomId(): number {
    const ids = userData.value.added.map((p) => p.id)
    return ids.length ? Math.max(...ids) + 1 : 10001
  }

  function idExists(id: number) {
    return allProblems.value.some((p) => p.id === id)
  }

  return {
    init,
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
