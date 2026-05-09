/**
 * 导入 / 导出 — 通过 API 与 D1 数据库交互
 */

import { api } from '@/api/client'

export interface ExportPayload {
  version: 1
  exportedAt: string
  data: Record<string, unknown>
}

/** 导出：从 API 获取全部数据并下载为 JSON 文件 */
export async function exportData(): Promise<void> {
  const payload = await api.exportAll()

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `leetcode-hot100-backup-${date}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** 导入：从 JSON 文件读取并发送到 API */
export async function importData(file: File): Promise<{ count: number }> {
  const text = await file.text()
  const payload = JSON.parse(text) as ExportPayload

  if (payload.version !== 1 || !payload.data) {
    throw new Error('文件格式不正确，请确认是本工具导出的备份文件')
  }

  const result = await api.importAll(payload.data)
  return { count: result.count }
}

/** 从 localStorage 迁移到 D1（首次使用时调用） */
export async function migrateFromLocalStorage(): Promise<boolean> {
  const MIGRATE_FLAG = 'hot100-migrated-to-d1'
  if (localStorage.getItem(MIGRATE_FLAG)) return false

  // 收集 localStorage 中所有 hot100-* 的数据
  const data: Record<string, unknown> = {}
  const PREFIX = 'hot100-'
  let hasData = false

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(PREFIX) && key !== MIGRATE_FLAG) {
      hasData = true
      try {
        data[key] = JSON.parse(localStorage.getItem(key)!)
      } catch {
        data[key] = localStorage.getItem(key)
      }
    }
  }

  if (!hasData) {
    // 没有旧数据，直接标记已迁移
    localStorage.setItem(MIGRATE_FLAG, '1')
    return false
  }

  try {
    await api.migrateFromLocalStorage(data)
    localStorage.setItem(MIGRATE_FLAG, '1')
    // 清理旧数据
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(PREFIX) && key !== MIGRATE_FLAG) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k))
    return true
  } catch (e) {
    console.error('迁移失败:', e)
    throw new Error('数据迁移失败，请稍后重试')
  }
}
