/**
 * 前端 API 客户端 — 封装所有与 Worker 的 HTTP 通信
 */

import type { Problem } from '@/types/problem'
import type { MasteryStatus } from '@/stores/progress'

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    throw new Error(`API 请求失败: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

// ── 用户题目数据 ──

export interface UserDataResponse {
  added: Problem[]
  modified: Record<number, Problem>
  deleted: number[]
}

export const api = {
  getUserProblems(): Promise<UserDataResponse> {
    return request('/problems/user')
  },

  createProblem(p: Problem): Promise<{ ok: boolean }> {
    return request('/problems/user', {
      method: 'POST',
      body: JSON.stringify(p),
    })
  },

  updateProblem(id: number, p: Problem, isCustom: boolean): Promise<{ ok: boolean }> {
    return request(`/problems/user/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...p, _isCustom: isCustom }),
    })
  },

  deleteProblem(id: number): Promise<{ ok: boolean }> {
    return request(`/problems/user/${id}`, { method: 'DELETE' })
  },

  resetProblem(id: number): Promise<{ ok: boolean }> {
    return request(`/problems/user/${id}/reset`, { method: 'POST' })
  },

  // ── 进度 ──

  getProgress(): Promise<Record<number, { status: MasteryStatus; lastViewed: number }>> {
    return request('/progress')
  },

  updateProgress(id: number, data: { status?: MasteryStatus; lastViewed?: number }): Promise<{ ok: boolean }> {
    return request(`/progress/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  resetProgress(): Promise<{ ok: boolean }> {
    return request('/progress', { method: 'DELETE' })
  },

  // ── 错题集 ──

  getWrongSet(): Promise<number[]> {
    return request('/wrong-set')
  },

  toggleWrong(id: number): Promise<{ ok: boolean; isWrong: boolean }> {
    return request(`/wrong-set/${id}`, { method: 'POST' })
  },

  removeWrong(id: number): Promise<{ ok: boolean }> {
    return request(`/wrong-set/${id}`, { method: 'DELETE' })
  },

  // ── 笔记 + 草稿 ──

  getContent(id: number): Promise<{ note: string; draft: string }> {
    return request(`/content/${id}`)
  },

  updateContent(id: number, data: { note?: string; draft?: string }): Promise<{ ok: boolean }> {
    return request(`/content/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  deleteContent(id: number): Promise<{ ok: boolean }> {
    return request(`/content/${id}`, { method: 'DELETE' })
  },

  // ── 导入导出 ──

  exportAll(): Promise<{ version: number; exportedAt: string; data: Record<string, unknown> }> {
    return request('/export')
  },

  importAll(payload: Record<string, unknown>): Promise<{ ok: boolean; count: number }> {
    return request('/import', {
      method: 'POST',
      body: JSON.stringify({ data: payload }),
    })
  },

  migrateFromLocalStorage(data: Record<string, unknown>): Promise<{ ok: boolean; count: number }> {
    return request('/migrate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}
