import apiClient from './client'
import type { ApiResponse } from '@/types/api'
import type { QuestionBankData, QuestionOption } from '@/types/question-bank'

// ── Helpers ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapQuestion(item: Record<string, any>): QuestionBankData {
  const optionsObj = (item.options as Record<string, string>) ?? {}
  const options: QuestionOption[] = Object.entries(optionsObj).map(([label, content]) => ({
    label,
    content,
  }))

  return {
    id: item.id as string,
    question: (item.question_text as string) ?? '',
    options,
    answer: (item.correct_option as string) ?? '',
    explanation: (item.explanation as string) ?? '',
    cardId: (item.card_id as string) ?? '',
    cardTitle: (item.card_title as string) ?? '',
    domainId: (item.domain_id as string) ?? '',
    domainName: (item.domain_name as string) ?? '',
    enabled: (item.status as string) === 'published',
    createdAt: (item.created_at as string) ?? '',
  }
}

function buildQuestionBody(params: Partial<QuestionBankData>): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  if (params.question !== undefined) body.question_text = params.question
  if (params.options !== undefined) {
    body.options = Object.fromEntries(params.options.map((o) => [o.label, o.content]))
  }
  if (params.answer !== undefined) body.correct_option = params.answer
  if (params.explanation !== undefined) body.explanation = params.explanation
  if (params.cardId !== undefined) body.card_id = params.cardId
  if (params.enabled !== undefined) body.status = params.enabled ? 'published' : 'draft'
  return body
}

// ── API ────────────────────────────────────────────────────────────

export const questionApi = {
  /** GET /admin/questions — 题库列表（分页+筛选） */
  async getList(params: {
    keyword?: string
    domainId?: string
    page?: number
    pageSize?: number
  }): Promise<ApiResponse<{ items: QuestionBankData[]; total: number }>> {
    const res = await apiClient.get('/admin/questions', {
      params: {
        page: params.page || 1,
        page_size: params.pageSize || 10,
        keyword: params.keyword || undefined,
        domain_id: params.domainId || undefined,
      },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = res as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: QuestionBankData[] = ((body.data as any[]) ?? []).map(mapQuestion)

    const meta = body.meta as { total: number } | null
    return {
      data: {
        items,
        total: meta?.total ?? items.length,
      },
    }
  },

  /** POST /admin/questions (id='new') or PUT /admin/questions/{id} — 创建/更新题目 */
  async update(id: string, params: Partial<QuestionBankData>): Promise<ApiResponse<QuestionBankData>> {
    if (id === 'new') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await apiClient.post('/admin/questions', buildQuestionBody(params))
      return { data: mapQuestion(res.data as Record<string, unknown>) }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = await apiClient.put(`/admin/questions/${id}`, buildQuestionBody(params))
    return { data: mapQuestion(res.data as Record<string, unknown>) }
  },

  /** PUT /admin/questions/{id} — 启用/停用（通过 status 字段） */
  async toggle(id: string, enabled: boolean): Promise<ApiResponse<null>> {
    await apiClient.put(`/admin/questions/${id}`, {
      status: enabled ? 'published' : 'draft',
    })
    return { data: null }
  },

  /** DELETE /admin/questions/{id} — 删除题目 */
  async delete(id: string): Promise<ApiResponse<null>> {
    await apiClient.delete(`/admin/questions/${id}`)
    return { data: null }
  },
}
