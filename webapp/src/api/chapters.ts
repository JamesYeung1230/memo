import apiClient from './client'
import { ApiResponse } from '@/types/api'
import type { ChapterData } from '@/types/chapter'

/** Map backend snake_case to frontend camelCase */
function mapChapter(raw: Record<string, unknown>): ChapterData {
  const status = raw.status as string
  return {
    id: raw.id as string,
    name: raw.name as string,
    domainId: (raw.domain_id as string) ?? '',
    domainName: (raw.domain_name as string) ?? '',
    enabled: status === 'published',
    sortOrder: (raw.sort_order as number) ?? 0,
    createdAt: (raw.created_at as string) ?? '',
  }
}

export const chapterApi = {
  /**
   * GET /admin/domains/{domainId}/chapters  (when domainId provided)
   * GET /admin/chapters                     (when domainId omitted)
   */
  async getList(params: { domainId?: string }): Promise<ApiResponse<ChapterData[]>> {
    let res
    if (params.domainId) {
      res = await apiClient.get(`/admin/domains/${params.domainId}/chapters`)
    } else {
      res = await apiClient.get('/admin/chapters')
    }
    const items = ((res.data as Record<string, unknown>[]) ?? []).map(mapChapter)
    return { data: items }
  },

  /** POST /admin/chapters */
  async create(params: { name: string; domainId: string }): Promise<ApiResponse<ChapterData>> {
    const res = await apiClient.post('/admin/chapters', {
      name: params.name,
      domain_id: params.domainId,
      status: 'published',
    })
    return { data: mapChapter(res.data as Record<string, unknown>) }
  },

  /** PUT /admin/chapters/{id} — partial update */
  async update(id: string, params: Partial<ChapterData>): Promise<ApiResponse<ChapterData>> {
    const body: Record<string, unknown> = {}
    if (params.name !== undefined) body.name = params.name
    if (params.domainId !== undefined) body.domain_id = params.domainId
    if (params.enabled !== undefined) body.status = params.enabled ? 'published' : 'draft'
    if (params.sortOrder !== undefined) body.sort_order = params.sortOrder

    const res = await apiClient.put(`/admin/chapters/${id}`, body)
    return { data: mapChapter(res.data as Record<string, unknown>) }
  },

  /** PUT /admin/chapters/{id} (toggle via status field — no dedicated toggle endpoint) */
  async toggle(id: string, enabled: boolean): Promise<ApiResponse<null>> {
    await apiClient.put(`/admin/chapters/${id}`, {
      status: enabled ? 'published' : 'draft',
    })
    return { data: null }
  },

  /** PUT /admin/chapters/reorder */
  async reorder(ids: string[]): Promise<ApiResponse<null>> {
    await apiClient.put('/admin/chapters/reorder', { order: ids })
    return { data: null }
  },

  /** DELETE /admin/chapters/{id} */
  async delete(id: string): Promise<ApiResponse<null>> {
    await apiClient.delete(`/admin/chapters/${id}`)
    return { data: null }
  },
}
