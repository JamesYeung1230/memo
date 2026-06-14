import type { ApiResponse, PaginatedResponse, PaginationMeta } from '@/types/api'
import type { SensitiveWordData } from '@/types/sensitive-word'
import apiClient from './client'

export const sensitiveWordApi = {
  /**
   * GET /api/v1/admin/sensitive-words — paginated, filterable sensitive word list
   */
  async getList(params: {
    page: number
    pageSize: number
    keyword?: string
    matchMode?: string
    isActive?: boolean
  }): Promise<ApiResponse<PaginatedResponse<SensitiveWordData>>> {
    const res = await apiClient.get('/admin/sensitive-words', {
      params: {
        page: params.page,
        page_size: params.pageSize,
        keyword: params.keyword || undefined,
        match_mode: params.matchMode || undefined,
        is_active: params.isActive,
      },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = res as any

    const items: SensitiveWordData[] = (body.data as Record<string, unknown>[]).map(
      (item: Record<string, unknown>) => ({
        id: item.id as string,
        word: item.word as string,
        match_mode: item.match_mode as SensitiveWordData['match_mode'],
        enabled: (item.enabled as boolean) ?? true,
        created_at: (item.created_at as string) ?? '',
        updated_at: (item.updated_at as string) ?? undefined,
      }),
    )

    const meta = body.meta as PaginationMeta

    return {
      data: {
        items,
        total: meta.total,
        page: meta.page,
        pageSize: meta.page_size,
        totalPages: Math.ceil(meta.total / meta.page_size),
      },
    }
  },

  /**
   * POST /api/v1/admin/sensitive-words — create a single sensitive word
   */
  async create(data: { word: string; matchMode: string; enabled?: boolean }): Promise<ApiResponse<SensitiveWordData>> {
    const res = await apiClient.post('/admin/sensitive-words', {
      word: data.word,
      match_mode: data.matchMode,
      enabled: data.enabled,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const item = (res as any).data as Record<string, unknown>

    return {
      data: {
        id: item.id as string,
        word: item.word as string,
        match_mode: item.match_mode as SensitiveWordData['match_mode'],
        enabled: (item.enabled as boolean) ?? true,
        created_at: (item.created_at as string) ?? '',
        updated_at: (item.updated_at as string) ?? undefined,
      },
    }
  },

  /**
   * PUT /api/v1/admin/sensitive-words/{id} — update a sensitive word
   */
  async update(id: string, data: { word?: string; matchMode?: string; enabled?: boolean }): Promise<ApiResponse<SensitiveWordData>> {
    const res = await apiClient.put(`/admin/sensitive-words/${id}`, {
      word: data.word,
      match_mode: data.matchMode,
      enabled: data.enabled,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const item = (res as any).data as Record<string, unknown>

    return {
      data: {
        id: item.id as string,
        word: item.word as string,
        match_mode: item.match_mode as SensitiveWordData['match_mode'],
        enabled: (item.enabled as boolean) ?? true,
        created_at: (item.created_at as string) ?? '',
        updated_at: (item.updated_at as string) ?? undefined,
      },
    }
  },

  /**
   * PUT /api/v1/admin/sensitive-words/{id}/toggle — enable/disable a word
   */
  async toggle(id: string, enabled: boolean): Promise<ApiResponse<SensitiveWordData>> {
    const res = await apiClient.put(`/admin/sensitive-words/${id}/toggle`, {
      is_active: enabled,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const item = (res as any).data as Record<string, unknown>

    return {
      data: {
        id: item.id as string,
        word: (item.word as string) ?? '',
        match_mode: (item.match_mode as SensitiveWordData['match_mode']) ?? 'exact',
        enabled: (item.enabled as boolean) ?? false,
        created_at: (item.created_at as string) ?? '',
        updated_at: (item.updated_at as string) ?? undefined,
      },
    }
  },

  /**
   * DELETE /api/v1/admin/sensitive-words/{id} — soft delete a word
   */
  async delete(id: string): Promise<ApiResponse<null>> {
    await apiClient.delete(`/admin/sensitive-words/${id}`)
    return { data: null }
  },

  /**
   * POST /api/v1/admin/sensitive-words/batch-delete — batch delete words
   */
  async batchDelete(ids: string[]): Promise<ApiResponse<null>> {
    await apiClient.post('/admin/sensitive-words/batch-delete', { ids })
    return { data: null }
  },
}
