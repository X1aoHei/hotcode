/** 复习轮次 */
export interface ReviewRound {
  /** 唯一标识 */
  id: string
  /** 轮次名称 */
  name: string
  /** 轮次笔记 */
  note: string
  /** 关联的题目 ID 列表 */
  problemIds: number[]
  /** 创建时间戳 */
  createdAt: number
  /** 更新时间戳 */
  updatedAt: number
}
