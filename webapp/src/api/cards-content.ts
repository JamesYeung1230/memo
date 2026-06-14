import apiClient from './client'
import type { ApiResponse } from '@/types/api'
import type { CardData, Difficulty } from '@/types/card'

// ── Helpers ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCard(item: Record<string, any>): CardData {
  return {
    id: item.id as string,
    title: (item.title as string) ?? '',
    content: (item.detail as string) ?? '',
    chapterId: (item.chapter_id as string) ?? '',
    chapterName: (item.chapter_name as string) ?? '',
    domainId: (item.domain_id as string) ?? '',
    domainName: (item.domain_name as string) ?? '',
    difficulty: (item.difficulty as Difficulty) ?? 'easy',
    enabled: (item.status as string) === 'published',
    createdAt: (item.created_at as string) ?? '',
  }
}

function buildCardBody(params: Partial<CardData>): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  if (params.title !== undefined) body.title = params.title
  if (params.content !== undefined) body.detail = params.content
  if (params.chapterId !== undefined) body.chapter_id = params.chapterId
  if (params.difficulty !== undefined) body.difficulty = params.difficulty
  if (params.enabled !== undefined) body.status = params.enabled ? 'published' : 'draft'
  return body
}

// ── API ────────────────────────────────────────────────────────────

export const cardsContentApi = {
  /** GET /admin/cards — 卡片列表（分页+筛选） */
  async getList(params: {
    keyword?: string
    domainId?: string
    chapterId?: string
    difficulty?: Difficulty
    page?: number
    pageSize?: number
  }): Promise<ApiResponse<{ items: CardData[]; total: number }>> {
    const res = await apiClient.get('/admin/cards', {
      params: {
        page: params.page || 1,
        page_size: params.pageSize || 10,
        keyword: params.keyword || undefined,
        domain_id: params.domainId || undefined,
        chapter_id: params.chapterId || undefined,
        difficulty: params.difficulty || undefined,
      },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = res as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: CardData[] = ((body.data as any[]) ?? []).map(mapCard)

    const meta = body.meta as { total: number } | null
    return {
      data: {
        items,
        total: meta?.total ?? items.length,
      },
    }
  },

  /** POST /admin/cards (id='new') or PUT /admin/cards/{id} — 创建/更新卡片 */
  async update(id: string, params: Partial<CardData>): Promise<ApiResponse<CardData>> {
    if (id === 'new') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await apiClient.post('/admin/cards', buildCardBody(params))
      return { data: mapCard(res.data as Record<string, unknown>) }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = await apiClient.put(`/admin/cards/${id}`, buildCardBody(params))
    return { data: mapCard(res.data as Record<string, unknown>) }
  },

  /** PUT /admin/cards/{id}/toggle — 上架/下架 */
  async toggle(id: string, enabled: boolean): Promise<ApiResponse<null>> {
    await apiClient.put(`/admin/cards/${id}/toggle`, {
      status: enabled ? 'published' : 'draft',
    })
    return { data: null }
  },

  /** DELETE /admin/cards/{id} — 删除卡片 */
  async delete(id: string): Promise<ApiResponse<null>> {
    await apiClient.delete(`/admin/cards/${id}`)
    return { data: null }
  },
}
