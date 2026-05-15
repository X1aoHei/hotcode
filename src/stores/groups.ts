import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { ProblemGroup } from '@/types/group'

const STORAGE_KEY = 'hot100-groups-v1'

function load(): ProblemGroup[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export const useGroupsStore = defineStore('groups', () => {
  const groups = ref<ProblemGroup[]>(load())

  watch(
    groups,
    () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(groups.value))
    },
    { deep: true }
  )

  /** 所有组合（按更新时间倒序） */
  const allGroups = computed(() =>
    [...groups.value].sort((a, b) => b.updatedAt - a.updatedAt)
  )

  /** 获取包含指定题目的所有组合 */
  function getGroupsByProblemId(problemId: number): ProblemGroup[] {
    return groups.value.filter((g) => g.problemIds.includes(problemId))
  }

  /** 按 ID 获取组合 */
  function getGroupById(id: string): ProblemGroup | undefined {
    return groups.value.find((g) => g.id === id)
  }

  /** 创建组合 */
  function createGroup(name: string, problemIds: number[], note = ''): string {
    const now = Date.now()
    const id = now.toString(36)
    groups.value.push({
      id,
      name,
      note,
      problemIds: [...problemIds],
      createdAt: now,
      updatedAt: now,
    })
    return id
  }

  /** 更新组合 */
  function updateGroup(
    id: string,
    patch: Partial<Pick<ProblemGroup, 'name' | 'note' | 'problemIds'>>
  ) {
    const group = groups.value.find((g) => g.id === id)
    if (!group) return
    if (patch.name !== undefined) group.name = patch.name
    if (patch.note !== undefined) group.note = patch.note
    if (patch.problemIds !== undefined) group.problemIds = [...patch.problemIds]
    group.updatedAt = Date.now()
  }

  /** 删除组合 */
  function deleteGroup(id: string) {
    const idx = groups.value.findIndex((g) => g.id === id)
    if (idx >= 0) groups.value.splice(idx, 1)
  }

  /** 向组合中添加题目 */
  function addProblemToGroup(groupId: string, problemId: number) {
    const group = groups.value.find((g) => g.id === groupId)
    if (!group || group.problemIds.includes(problemId)) return
    group.problemIds.push(problemId)
    group.updatedAt = Date.now()
  }

  /** 从组合中移除题目 */
  function removeProblemFromGroup(groupId: string, problemId: number) {
    const group = groups.value.find((g) => g.id === groupId)
    if (!group) return
    const idx = group.problemIds.indexOf(problemId)
    if (idx >= 0) {
      group.problemIds.splice(idx, 1)
      group.updatedAt = Date.now()
    }
  }

  /** 清理不存在的题目 ID */
  function cleanupInvalidProblemIds(validIds: Set<number>) {
    for (const group of groups.value) {
      const before = group.problemIds.length
      group.problemIds = group.problemIds.filter((id) => validIds.has(id))
      if (group.problemIds.length !== before) {
        group.updatedAt = Date.now()
      }
    }
    // 删除空组合
    groups.value = groups.value.filter((g) => g.problemIds.length > 0)
  }

  return {
    groups,
    allGroups,
    getGroupsByProblemId,
    getGroupById,
    createGroup,
    updateGroup,
    deleteGroup,
    addProblemToGroup,
    removeProblemFromGroup,
    cleanupInvalidProblemIds,
  }
})
