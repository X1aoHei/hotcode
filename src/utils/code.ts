import * as prettier from 'prettier/standalone'
import pluginJava from 'prettier-plugin-java'

const PRETTIER_OPTS = {
  parser: 'java',
  plugins: [pluginJava],
  tabWidth: 4,
}

/**
 * 格式化完整 Java 代码（类/文件级别）
 */
export async function formatJavaCode(code: string): Promise<string> {
  if (!code.trim()) return code
  try {
    return await prettier.format(code, PRETTIER_OPTS)
  } catch {
    // 降级：尝试包裹为临时类后格式化
    return tryFormatAsSnippet(code)
  }
}

/**
 * 格式化 Java 代码片段（方法体、表达式等非完整类代码）
 * 自动包裹为临时类 → 格式化 → 提取原始片段
 */
export async function formatJavaSnippet(snippet: string): Promise<string> {
  if (!snippet.trim()) return snippet
  const wrapped = `public class __Tmp {\n${indent(snippet, 4)}\n}`
  try {
    const formatted = await prettier.format(wrapped, PRETTIER_OPTS)
    return extractClassBody(formatted)
  } catch {
    return snippet
  }
}

/** 降级格式化：包裹为临时类尝试格式化 */
async function tryFormatAsSnippet(code: string): Promise<string> {
  const wrapped = `public class __Tmp {\n${indent(code, 4)}\n}`
  try {
    const formatted = await prettier.format(wrapped, PRETTIER_OPTS)
    return extractClassBody(formatted)
  } catch {
    return code
  }
}

/** 从格式化后的临时类中提取类体内容 */
function extractClassBody(formatted: string): string {
  const lines = formatted.split('\n')
  // 找到第一个 { 后面的内容和最后一个 } 前面的内容
  const start = lines.findIndex((l) => l.trim() === '{')
  const end = lines.length - 1 - [...lines].reverse().findIndex((l) => l.trim() === '}')
  if (start < 0 || end <= start) return formatted
  return lines
    .slice(start + 1, end)
    .map((l) => l.replace(/^ {4}/, '')) // 去掉一层缩进
    .join('\n')
    .replace(/^\n+/, '') // 去掉开头空行
    .replace(/\n+$/, '') // 去掉末尾空行
}

function indent(code: string, spaces: number): string {
  const pad = ' '.repeat(spaces)
  return code
    .split('\n')
    .map((l) => (l.trim() ? pad + l : l))
    .join('\n')
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
