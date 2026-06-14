import apiClient from './client'
import { ApiResponse } from '@/types/api'
import type { BadgeData } from '@/types/badge'

/** Map backend snake_case to frontend camelCase */
function mapBadge(raw: Record<string, unknown>): BadgeData {
  const status = raw.status as string
  return {
    id: raw.id as string,
    name: raw.name as string,
    icon: (raw.icon_url as string) ?? '',
    description: (raw.description as string) ?? '',
    requiredPoints: (raw.points_required as number) ?? 0,
    enabled: status === 'published',
    redeemCount: 0,
    createdAt: (raw.created_at as string) ?? '',
  }
}

/** Build backend request body from frontend BadgeData fields (enabled excluded — status set via toggle) */
function buildBadgeBody(params: Partial<BadgeData>): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  if (params.name !== undefined) body.name = params.name
  if (params.description !== undefined) body.description = params.description
  if (params.icon !== undefined) body.icon_url = params.icon
  if (params.requiredPoints !== undefined) body.points_required = params.requiredPoints
  // enabled is NOT included — backend status is managed via toggle endpoint
  return body
}

export const badgeApi = {
  /** GET /admin/badges — returns array directly, no pagination wrapper */
  async getList(): Promise<ApiResponse<BadgeData[]>> {
    const res = await apiClient.get('/admin/badges')
    const items = ((res.data as Record<string, unknown>[]) ?? []).map(mapBadge)
    return { data: items }
  },

  /** POST /admin/badges */
  async create(
    params: Omit<BadgeData, 'id' | 'redeemCount' | 'createdAt'>,
  ): Promise<ApiResponse<BadgeData>> {
    const res = await apiClient.post('/admin/badges', buildBadgeBody(params))
    return { data: mapBadge(res.data as Record<string, unknown>) }
  },

  /** PUT /admin/badges/{id} — partial update */
  async update(
    id: string,
    params: Partial<Omit<BadgeData, 'id' | 'redeemCount' | 'createdAt'>>,
  ): Promise<ApiResponse<BadgeData>> {
    const res = await apiClient.put(`/admin/badges/${id}`, buildBadgeBody(params))
    return { data: mapBadge(res.data as Record<string, unknown>) }
  },

  /** POST /admin/badges/{id}/toggle — backend flips status (enabled param ignored) */
  async toggle(id: string, _enabled: boolean): Promise<ApiResponse<null>> {
    await apiClient.post(`/admin/badges/${id}/toggle`)
    return { data: null }
  },

  /** DELETE /admin/badges/{id} */
  async delete(id: string): Promise<ApiResponse<null>> {
    await apiClient.delete(`/admin/badges/${id}`)
    return { data: null }
  },
}
