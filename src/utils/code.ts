import * as prettier from 'prettier/standalone'
import pluginJava from 'prettier-plugin-java'

/**
 * 格式化 Java 代码
 */
export async function formatJavaCode(code: string): Promise<string> {
  if (!code.trim()) return code
  try {
    return await prettier.format(code, {
      parser: 'java',
      plugins: [pluginJava],
      tabWidth: 4,
    })
  } catch {
    return code
  }
}

/**
 * 从 Java 参考代码中提取方法定义（签名 + 空方法体）
 * 用于默写区的默认内容填充
 */
export function extractMethodSignatures(code: string): string {
  if (!code) return ''
  const lines = code.split('\n')
  let inBody = false
  const signatures: string[] = []
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim()
    // 跳过 class 声明
    if (/^(public\s+)?(class|interface|enum)\s/.test(t)) { inBody = true; continue }
    if (!inBody) continue
    // 匹配方法定义：必须以 public/private/protected 开头
    if (/^(public|private|protected)\s/.test(t)) {
      const clean = t.replace(/\{.*$/, '').trim()
      // 同一行带 { 的方法签名
      if (t.includes('{') && clean.includes('(')) {
        signatures.push(clean + ' {')
        signatures.push('}')
        signatures.push('')
      }
      // 跨行签名：签名在本行，{ 在下一行
      else if (clean.includes('(') && i + 1 < lines.length && lines[i + 1].trim() === '{') {
        signatures.push(clean + ' {')
        signatures.push('}')
        signatures.push('')
      }
    }
  }
  return signatures.join('\n').trimEnd()
}
