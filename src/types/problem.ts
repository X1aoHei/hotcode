export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export interface Problem {
  /** LeetCode 题号 */
  id: number
  /** 中文标题 */
  title: string
  /** 英文 slug，用于跳转 leetcode.cn */
  slug: string
  difficulty: Difficulty
  /** 算法/数据结构标签 */
  tags: string[]
  /** 题目描述（Markdown / 纯文本） */
  description: string
  /** 核心解题思路（关键步骤要点） */
  approach: string
  /** 参考代码（默认 TypeScript / JS） */
  code: string
  /** 时间复杂度 */
  timeComplexity?: string
  /** 空间复杂度 */
  spaceComplexity?: string
  /** 默写区默认内容（方法签名骨架） */
  draft?: string
}
