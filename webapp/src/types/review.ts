/** 审核状态 */
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'auto_rejected'

/** 审核记录项 */
export interface ReviewRecord {
  id: string
  noteTitle: string
  author: string
  submitTime: string
  reviewStatus: ReviewStatus
  reviewer?: string
  reviewTime?: string
  rejectReason?: string
}

/** 待审核笔记项 */
export interface PendingNote {
  id: string
  noteTitle: string
  author: string
  submitTime: string
  aiRiskScore: number
  aiRiskType: string
}

/** 审核统计 */
export interface ReviewStats {
  pendingCount: number
  todayReviewed: number
  passRate7d: number
  aiAccuracy: number
}
