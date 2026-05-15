/** 题目组合 */
export interface ProblemGroup {
  /** 唯一标识 */
  id: string
  /** 组合名称 */
  name: string
  /** 组合笔记 */
  note: string
  /** 关联的题目 ID 列表 */
  problemIds: number[]
  /** 创建时间戳 */
  createdAt: number
  /** 更新时间戳 */
  updatedAt: number
}
