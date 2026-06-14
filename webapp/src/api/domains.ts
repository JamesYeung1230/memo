import apiClient from './client'
import { ApiResponse } from '@/types/api'
import type { DomainData } from '@/types/domain'

/** Map backend snake_case to frontend camelCase */
function mapDomain(raw: Record<string, unknown>): DomainData {
  const status = raw.status as string
  return {
    id: raw.id as string,
    name: raw.name as string,
    icon: raw.icon as string,
    isFree: (raw.is_free as boolean) ?? false,
    unlockPoints: (raw.unlock_points as number) ?? 0,
    enabled: status === 'published',
    sortOrder: (raw.sort_order as number) ?? 0,
    createdAt: (raw.created_at as string) ?? '',
  }
}

export const domainApi = {
  /** GET /admin/domains?page=1&page_size=100&status=all */
  async getList(): Promise<ApiResponse<DomainData[]>> {
    const res = await apiClient.get('/admin/domains', {
      params: { page: 1, page_size: 100, status: 'all' },
    })
    const items = ((res.data as Record<string, unknown>[]) ?? []).map(mapDomain)
    return { data: items }
  },

  /** POST /admin/domains */
  async create(params: {
    name: string
    icon: string
    isFree: boolean
    unlockPoints: number
    enabled: boolean
  }): Promise<ApiResponse<DomainData>> {
    const res = await apiClient.post('/admin/domains', {
      name: params.name,
      icon: params.icon,
      is_free: params.isFree,
      unlock_points: params.unlockPoints,
      status: params.enabled ? 'published' : 'draft',
    })
    return { data: mapDomain(res.data as Record<string, unknown>) }
  },

  /** PUT /admin/domains/{id} — partial update */
  async update(id: string, params: Partial<DomainData>): Promise<ApiResponse<DomainData>> {
    const body: Record<string, unknown> = {}
    if (params.name !== undefined) body.name = params.name
    if (params.icon !== undefined) body.icon = params.icon
    if (params.isFree !== undefined) body.is_free = params.isFree
    if (params.unlockPoints !== undefined) body.unlock_points = params.unlockPoints
    if (params.enabled !== undefined) body.status = params.enabled ? 'published' : 'draft'
    if (params.sortOrder !== undefined) body.sort_order = params.sortOrder

    const res = await apiClient.put(`/admin/domains/${id}`, body)
    return { data: mapDomain(res.data as Record<string, unknown>) }
  },

  /** PUT /admin/domains/{id}/toggle */
  async toggle(id: string, _enabled: boolean): Promise<ApiResponse<null>> {
    await apiClient.put(`/admin/domains/${id}/toggle`)
    return { data: null }
  },

  /** PUT /admin/domains/reorder */
  async reorder(ids: string[]): Promise<ApiResponse<null>> {
    await apiClient.put('/admin/domains/reorder', { order: ids })
    return { data: null }
  },

  /** DELETE /admin/domains/{id} */
  async delete(id: string): Promise<ApiResponse<null>> {
    await apiClient.delete(`/admin/domains/${id}`)
    return { data: null }
  },
}
