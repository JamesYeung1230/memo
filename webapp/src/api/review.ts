import apiClient from './client'
import type { ApiResponse, PaginatedResponse } from '@/types/api'
import type { ReviewStats, PendingNote, ReviewRecord } from '@/types/review'

function getRiskType(score: number): string {
  if (score >= 61) return '高风险'
  if (score >= 31) return '中风险'
  return '低风险'
}

export const reviewApi = {
  /** GET /admin/review/statistics — 审核统计 */
  async getStats(): Promise<ApiResponse<ReviewStats>> {
    const res = await apiClient.get('/admin/review/statistics')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = res as any

    return {
      data: {
        pendingCount: (body.data?.today_pending as number) ?? 0,
        todayReviewed: (body.data?.today_reviewed as number) ?? 0,
        passRate7d: (body.data?.weekly_approval_rate as number) ?? 0,
        aiAccuracy: (body.data?.ai_accuracy as number) ?? 0,
      },
    }
  },

  /** GET /admin/review/queue — 待审核队列（分页） */
  async getPendingList(params: {
    page: number
    pageSize: number
  }): Promise<ApiResponse<PaginatedResponse<PendingNote>>> {
    const res = await apiClient.get('/admin/review/queue', {
      params: {
        page: params.page,
        page_size: params.pageSize,
      },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = res as any

    const items: PendingNote[] = ((body.data as Record<string, unknown>[]) ?? []).map(
      (item: Record<string, unknown>) => ({
        id: (item.note_id as string) ?? (item.id as string),
        noteTitle: (item.note_title as string) ?? '',
        author: (item.author_id as string) ?? '',
        submitTime: (item.created_at as string) ?? '',
        aiRiskScore: (item.risk_score as number) ?? 0,
        aiRiskType: getRiskType((item.risk_score as number) ?? 0),
      }),
    )

    const meta = body.meta as { total: number; page: number; page_size: number } | null
    return {
      data: {
        items,
        total: meta?.total ?? items.length,
        page: meta?.page ?? 1,
        pageSize: meta?.page_size ?? 20,
        totalPages: meta ? Math.ceil(meta.total / meta.page_size) : 1,
      },
    }
  },

  /** GET /admin/review/records — 审核记录（分页+筛选） */
  async getReviewRecords(params: {
    page: number
    pageSize: number
    status?: string
  }): Promise<ApiResponse<PaginatedResponse<ReviewRecord>>> {
    const res = await apiClient.get('/admin/review/records', {
      params: {
        page: params.page,
        page_size: params.pageSize,
        status: params.status && params.status !== 'all' ? params.status : undefined,
      },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = res as any

    const items: ReviewRecord[] = ((body.data as Record<string, unknown>[]) ?? []).map(
      (item: Record<string, unknown>) => ({
        id: item.id as string,
        noteTitle: (item.note_title as string) ?? '',
        author: (item.author_id as string) ?? '',
        submitTime: (item.created_at as string) ?? '',
        reviewStatus: item.status as ReviewRecord['reviewStatus'],
        reviewer: (item.manual_reviewer as string) ?? '-',
        reviewTime: (item.reviewed_at as string) ?? '',
        rejectReason: (item.manual_reason as string) ?? undefined,
      }),
    )

    const meta = body.meta as { total: number; page: number; page_size: number } | null
    return {
      data: {
        items,
        total: meta?.total ?? items.length,
        page: meta?.page ?? 1,
        pageSize: meta?.page_size ?? 20,
        totalPages: meta ? Math.ceil(meta.total / meta.page_size) : 1,
      },
    }
  },

  /** POST /admin/review/queue/batch-approve — 批量通过 */
  async batchApprove(noteIds: string[]): Promise<ApiResponse<null>> {
    await apiClient.post('/admin/review/queue/batch-approve', { note_ids: noteIds })
    return { data: null }
  },

  /** POST /admin/review/queue/batch-reject — 批量驳回 */
  async batchReject(params: { noteIds: string[]; reason?: string }): Promise<ApiResponse<null>> {
    await apiClient.post('/admin/review/queue/batch-reject', {
      note_ids: params.noteIds,
      reason: params.reason || undefined,
    })
    return { data: null }
  },

  /** GET /admin/review/queue/{noteId} — 审核详情 */
  async getReviewDetail(
    noteId: string,
  ): Promise<ApiResponse<{ noteContent: string; aiReason: string; sensitiveWords: string[] }>> {
    const res = await apiClient.get(`/admin/review/queue/${noteId}`)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = res as any

    return {
      data: {
        noteContent: (body.data?.note_content as string) ?? '',
        aiReason: (body.data?.ai_reasoning as string) ?? '',
        sensitiveWords: (body.data?.sensitive_words_hit as string[]) ?? [],
      },
    }
  },
}
