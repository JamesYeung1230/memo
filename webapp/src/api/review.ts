import { ApiResponse } from '@/types/api'
import type { ReviewStats, PendingNote, ReviewRecord } from '@/types/review'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const mockPendingNotes: PendingNote[] = [
  { id: 'r1', noteTitle: 'React Hooks 入门指南：useState 与 useEffect 详解', author: 'wx_user_001', submitTime: '2026-05-07 14:32', aiRiskScore: 25, aiRiskType: '低风险' },
  { id: 'r2', noteTitle: 'JavaScript 闭包深入理解与实践技巧', author: 'wx_user_023', submitTime: '2026-05-07 13:15', aiRiskScore: 55, aiRiskType: '中风险' },
  { id: 'r3', noteTitle: 'Python 异步编程终极指南', author: 'wx_user_045', submitTime: '2026-05-07 11:08', aiRiskScore: 78, aiRiskType: '高风险' },
  { id: 'r4', noteTitle: 'Git 工作流最佳实践分享', author: 'wx_user_012', submitTime: '2026-05-07 09:45', aiRiskScore: 15, aiRiskType: '低风险' },
  { id: 'r5', noteTitle: '数据库索引优化策略总结', author: 'wx_user_067', submitTime: '2026-05-06 22:30', aiRiskScore: 42, aiRiskType: '中风险' },
  { id: 'r6', noteTitle: 'Docker 容器化部署实战笔记', author: 'wx_user_034', submitTime: '2026-05-06 20:18', aiRiskScore: 30, aiRiskType: '低风险' },
  { id: 'r7', noteTitle: 'Mac 配置前端开发环境的坑与解决', author: 'wx_user_089', submitTime: '2026-05-06 18:05', aiRiskScore: 65, aiRiskType: '高风险' },
]

const mockReviewRecords: ReviewRecord[] = [
  { id: 'h1', noteTitle: 'React 组件设计模式', author: 'wx_user_015', submitTime: '2026-05-06 16:00', reviewStatus: 'approved', reviewer: '管理员', reviewTime: '2026-05-06 17:30' },
  { id: 'h2', noteTitle: 'TypeScript 高级类型使用技巧', author: 'wx_user_032', submitTime: '2026-05-06 14:20', reviewStatus: 'rejected', reviewer: '管理员', reviewTime: '2026-05-06 16:00', rejectReason: '涉及敏感内容' },
  { id: 'h3', noteTitle: 'Node.js 事件循环深度解析', author: 'wx_user_056', submitTime: '2026-05-05 10:30', reviewStatus: 'approved', reviewer: '管理员', reviewTime: '2026-05-05 14:00' },
  { id: 'h4', noteTitle: 'CSS Grid 布局完全指南', author: 'wx_user_078', submitTime: '2026-05-04 09:00', reviewStatus: 'auto_rejected', reviewer: '-', reviewTime: '2026-05-04 09:01' },
]

export const reviewApi = {
  /** 获取审核统计 */
  async getStats(): Promise<ApiResponse<ReviewStats>> {
    await delay(200)
    return {
      data: {
        pendingCount: 7,
        todayReviewed: 3,
        passRate7d: 72.5,
        aiAccuracy: 85.0,
      },
    }
  },

  /** 获取待审核列表 */
  async getPendingList(): Promise<ApiResponse<PendingNote[]>> {
    await delay(300)
    return { data: mockPendingNotes }
  },

  /** 获取审核记录列表 */
  async getReviewRecords(status?: string): Promise<ApiResponse<ReviewRecord[]>> {
    await delay(300)
    const filtered = status && status !== 'all' ? mockReviewRecords.filter((r) => r.reviewStatus === status) : mockReviewRecords
    return { data: filtered }
  },

  /** 批量审核 */
  async batchReview(_params: { ids: string[]; action: 'approve' | 'reject'; reason?: string }): Promise<ApiResponse<null>> {
    await delay(500)
    return { data: null }
  },

  /** 审核详情 */
  async getReviewDetail(_id: string): Promise<ApiResponse<{ noteContent: string; aiReason: string; sensitiveWords: string[] }>> {
    await delay(200)
    return {
      data: {
        noteContent: '这是一篇用户的笔记内容，包含了关于学习编程的一些心得和总结。笔记中提到了多种编程语言的特性和使用场景。',
        aiReason: '笔记内容包含可能的敏感词汇，经AI模型判定为中风险。',
        sensitiveWords: ['违规词A', '违规词B'],
      },
    }
  },
}
