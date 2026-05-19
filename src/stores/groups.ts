import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { ProblemGroup } from '@/types/group'
import { api } from '@/utils/api'

const STORAGE_KEY = 'hot100-groups-v1'

function loadLocal(): ProblemGroup[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export const useGroupsStore = defineStore('groups', () => {
  const groups = ref<ProblemGroup[]>(loadLocal())
  let synced = false

  /** 从 D1 加载数据 */
  async function sync() {
    try {
      const data = await api.get<ProblemGroup[]>('/groups')
      groups.value = data ?? []
      localStorage.setItem(STORAGE_KEY, JSON.stringify(groups.value))
      synced = true
    } catch {
      // API 不可用时使用 localStorage
    }
  }

  // 保存到 localStorage + D1
  watch(
    groups,
    () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(groups.value))
      if (synced) {
        api.post('/groups', groups.value).catch(() => {})
      }
    },
    { deep: true }
  )

  // 启动时从 D1 同步
  sync()

  const allGroups = computed(() =>
    [...groups.value].sort((a, b) => b.updatedAt - a.updatedAt)
  )

  function getGroupsByProblemId(problemId: number): ProblemGroup[] {
    return groups.value.filter((g) => g.problemIds.includes(problemId))
  }

  function getGroupById(id: string): ProblemGroup | undefined {
    return groups.value.find((g) => g.id === id)
  }

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

  function deleteGroup(id: string) {
    const idx = groups.value.findIndex((g) => g.id === id)
    if (idx >= 0) groups.value.splice(idx, 1)
  }

  function addProblemToGroup(groupId: string, problemId: number) {
    const group = groups.value.find((g) => g.id === groupId)
    if (!group || group.problemIds.includes(problemId)) return
    group.problemIds.push(problemId)
    group.updatedAt = Date.now()
  }

  function removeProblemFromGroup(groupId: string, problemId: number) {
    const group = groups.value.find((g) => g.id === groupId)
    if (!group) return
    const idx = group.problemIds.indexOf(problemId)
    if (idx >= 0) {
      group.problemIds.splice(idx, 1)
      group.updatedAt = Date.now()
    }
  }

  function cleanupInvalidProblemIds(validIds: Set<number>) {
    for (const group of groups.value) {
      const before = group.problemIds.length
      group.problemIds = group.problemIds.filter((id) => validIds.has(id))
      if (group.problemIds.length !== before) {
        group.updatedAt = Date.now()
      }
    }
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
    sync,
  }
})
