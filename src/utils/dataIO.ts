/**
 * 导入 / 导出
 *
 * 通过 D1 API 导出全部数据为 JSON 文件下载；
 * 也可从 JSON 文件恢复，通过 API 写入 D1。
 */

import { api } from './api'

export interface ExportPayload {
  version: number
  exportedAt: string
  data: Record<string, unknown>
}

/** 导出：调用 API 获取全部数据并下载 */
export async function exportData(): Promise<void> {
  const payload = await api.get<ExportPayload>('/export')

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

/** 导入：读取 JSON 文件并通过 API 写入 D1 */
export function importData(file: File): Promise<{ count: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => reject(new Error('文件读取失败'))

    reader.onload = async () => {
      try {
        const payload = JSON.parse(reader.result as string)

        if (!payload.data) {
          return reject(new Error('文件格式不正确，请确认是本工具导出的备份文件'))
        }

        await api.post('/import', payload)
        resolve({ count: Object.keys(payload.data).length })
      } catch (e) {
        reject(new Error('文件解析失败：' + (e as Error).message))
      }
    }

    reader.readAsText(file)
  })
}
