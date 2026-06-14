import apiClient from './client'
import { ApiResponse } from '@/types/api'
import type { BannerData, JumpType } from '@/types/banner'

/** Map backend snake_case to frontend BannerData (camelCase + computed clickRate) */
function mapBanner(raw: Record<string, unknown>): BannerData {
  const status = raw.status as string
  const impressionPv = (raw.impression_pv as number) ?? 0
  const clickCount = (raw.click_count as number) ?? 0
  return {
    id: raw.id as string,
    imageUrl: raw.image_url as string,
    title: raw.title as string,
    jumpType: (raw.link_type as JumpType) ?? 'none',
    jumpPath: (raw.link_param as string) ?? '',
    sortOrder: (raw.sort_order as number) ?? 0,
    enabled: status === 'enabled',
    startTime: (raw.start_date as string) ?? '',
    endTime: (raw.end_date as string) ?? '',
    pv: impressionPv,
    clickPv: clickCount,
    clickRate: impressionPv > 0 ? (clickCount / impressionPv) * 100 : 0,
  }
}

/** Build backend request body from frontend BannerData fields (snake_case) */
function buildBannerBody(
  params: Partial<Omit<BannerData, 'id' | 'pv' | 'clickPv' | 'clickRate'>>,
): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  if (params.title !== undefined) body.title = params.title
  if (params.imageUrl !== undefined) body.image_url = params.imageUrl
  if (params.jumpType !== undefined) body.link_type = params.jumpType
  if (params.jumpPath !== undefined) body.link_param = params.jumpPath
  if (params.sortOrder !== undefined) body.sort_order = params.sortOrder
  if (params.enabled !== undefined) body.status = params.enabled ? 'enabled' : 'disabled'
  if (params.startTime !== undefined) body.start_date = params.startTime || null
  if (params.endTime !== undefined) body.end_date = params.endTime || null
  return body
}

export const bannerApi = {
  /** GET /admin/banners — returns array directly, no pagination wrapper */
  async getList(): Promise<ApiResponse<BannerData[]>> {
    const res = await apiClient.get('/admin/banners')
    const items = ((res.data as Record<string, unknown>[]) ?? []).map(mapBanner)
    return { data: items }
  },

  /** POST /admin/banners */
  async create(
    params: Omit<BannerData, 'id' | 'pv' | 'clickPv' | 'clickRate'>,
  ): Promise<ApiResponse<BannerData>> {
    const res = await apiClient.post('/admin/banners', buildBannerBody(params))
    return { data: mapBanner(res.data as Record<string, unknown>) }
  },

  /** PUT /admin/banners/{id} — partial update */
  async update(
    id: string,
    params: Partial<Omit<BannerData, 'id' | 'pv' | 'clickPv' | 'clickRate'>>,
  ): Promise<ApiResponse<BannerData>> {
    const res = await apiClient.put(`/admin/banners/${id}`, buildBannerBody(params))
    return { data: mapBanner(res.data as Record<string, unknown>) }
  },

  /** POST /admin/banners/{id}/toggle — backend ignores enabled param, just flips status */
  async toggle(id: string, _enabled: boolean): Promise<ApiResponse<null>> {
    await apiClient.post(`/admin/banners/${id}/toggle`)
    return { data: null }
  },

  /** PUT /admin/banners/reorder — convert ids to {items: [{id, sort_order}]} format */
  async reorder(ids: string[]): Promise<ApiResponse<null>> {
    const items = ids.map((id, i) => ({ id, sort_order: i + 1 }))
    await apiClient.put('/admin/banners/reorder', { items })
    return { data: null }
  },

  /** DELETE /admin/banners/{id} */
  async delete(id: string): Promise<ApiResponse<null>> {
    await apiClient.delete(`/admin/banners/${id}`)
    return { data: null }
  },
}
