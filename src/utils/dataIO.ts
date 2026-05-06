/**
 * 导入 / 导出本地配置
 *
 * 收集 localStorage 中所有 hot100 相关 key，打包为 JSON 文件供下载；
 * 也可从 JSON 文件恢复，写回 localStorage 后刷新页面生效。
 */

export interface ExportPayload {
  version: 1
  exportedAt: string
  data: Record<string, unknown>
}

const PREFIX = 'hot100-'

/** 收集 localStorage 中所有 hot100-* 的 key-value */
function collectData(): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(PREFIX)) {
      try {
        data[key] = JSON.parse(localStorage.getItem(key)!)
      } catch {
        data[key] = localStorage.getItem(key)
      }
    }
  }
  return data
}

/** 导出：生成 JSON 文件并下载 */
export function exportData(): void {
  const payload: ExportPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: collectData(),
  }

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

/** 导入：从 JSON 文件读取并写入 localStorage，然后刷新页面 */
export function importData(file: File): Promise<{ count: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => reject(new Error('文件读取失败'))

    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result as string) as ExportPayload

        if (payload.version !== 1 || !payload.data) {
          return reject(new Error('文件格式不正确，请确认是本工具导出的备份文件'))
        }

        // 先清除旧数据
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith(PREFIX)) keysToRemove.push(key)
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k))

        // 写入新数据
        let count = 0
        for (const [key, value] of Object.entries(payload.data)) {
          localStorage.setItem(
            key,
            typeof value === 'string' ? value : JSON.stringify(value)
          )
          count++
        }

        resolve({ count })
      } catch (e) {
        reject(new Error('文件解析失败：' + (e as Error).message))
      }
    }

    reader.readAsText(file)
  })
}
