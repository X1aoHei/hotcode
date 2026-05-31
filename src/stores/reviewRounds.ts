import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { ReviewRound } from '@/types/reviewRound'
import { api } from '@/utils/api'

export const useReviewRoundsStore = defineStore('reviewRounds', () => {
  const reviewRounds = ref<ReviewRound[]>([])
  let synced = false

  /** 从 D1 加载数据 */
  async function sync() {
    try {
      const data = await api.get<ReviewRound[]>('/review-rounds')
      reviewRounds.value = data ?? []
      synced = true
    } catch {
      // API 不可用时使用空数据
    }
  }

  // 保存到 D1
  watch(
    reviewRounds,
    () => {
      if (synced) {
        api.post('/review-rounds', reviewRounds.value).catch(() => {})
      }
    },
    { deep: true }
  )

  // 启动时从 D1 同步
  sync()

  const allRounds = computed(() =>
    [...reviewRounds.value].sort((a, b) => b.updatedAt - a.updatedAt)
  )

  function getRoundsByProblemId(problemId: number): ReviewRound[] {
    return reviewRounds.value.filter((r) => r.problemIds.includes(problemId))
  }

  function getRoundById(id: string): ReviewRound | undefined {
    return reviewRounds.value.find((r) => r.id === id)
  }

  function createRound(name: string, problemIds: number[], note = ''): string {
    const now = Date.now()
    const id = now.toString(36)
    reviewRounds.value.push({
      id,
      name,
      note,
      problemIds: [...problemIds],
      createdAt: now,
      updatedAt: now,
    })
    return id
  }

  function updateRound(
    id: string,
    patch: Partial<Pick<ReviewRound, 'name' | 'note' | 'problemIds'>>
  ) {
    const round = reviewRounds.value.find((r) => r.id === id)
    if (!round) return
    if (patch.name !== undefined) round.name = patch.name
    if (patch.note !== undefined) round.note = patch.note
    if (patch.problemIds !== undefined) round.problemIds = [...patch.problemIds]
    round.updatedAt = Date.now()
  }

  function deleteRound(id: string) {
    const idx = reviewRounds.value.findIndex((r) => r.id === id)
    if (idx >= 0) reviewRounds.value.splice(idx, 1)
  }

  function addProblemToRound(roundId: string, problemId: number) {
    const round = reviewRounds.value.find((r) => r.id === roundId)
    if (!round || round.problemIds.includes(problemId)) return
    round.problemIds.push(problemId)
    round.updatedAt = Date.now()
  }

  function removeProblemFromRound(roundId: string, problemId: number) {
    const round = reviewRounds.value.find((r) => r.id === roundId)
    if (!round) return
    const idx = round.problemIds.indexOf(problemId)
    if (idx >= 0) {
      round.problemIds.splice(idx, 1)
      round.updatedAt = Date.now()
    }
  }

  return {
    reviewRounds,
    allRounds,
    getRoundsByProblemId,
    getRoundById,
    createRound,
    updateRound,
    deleteRound,
    addProblemToRound,
    removeProblemFromRound,
    sync,
  }
})
