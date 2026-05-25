import { ApiResponse } from '@/types/api'
import type { BannerData } from '@/types/banner'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

let data: BannerData[] = [
  {
    id: 'b1', imageUrl: 'https://picsum.photos/800/300?random=1', title: '暑期特惠学习季',
    jumpType: 'h5', jumpPath: 'https://example.com/promotion', sortOrder: 1, enabled: true,
    startTime: '2026-06-01', endTime: '2026-08-31', pv: 12580, clickPv: 3200, clickRate: 25.44,
  },
  {
    id: 'b2', imageUrl: 'https://picsum.photos/800/300?random=2', title: '新用户专享福利',
    jumpType: 'miniapp', jumpPath: 'pages/promotion/new-user', sortOrder: 2, enabled: true,
    startTime: '2026-05-01', endTime: '2026-12-31', pv: 8900, clickPv: 4100, clickRate: 46.07,
  },
  {
    id: 'b3', imageUrl: 'https://picsum.photos/800/300?random=3', title: '每日打卡挑战',
    jumpType: 'none', jumpPath: '', sortOrder: 3, enabled: false,
    startTime: '2026-05-15', endTime: '2026-06-15', pv: 0, clickPv: 0, clickRate: 0,
  },
]

export const bannerApi = {
  async getList(): Promise<ApiResponse<BannerData[]>> {
    await delay(300)
    return { data: [...data].sort((a, b) => a.sortOrder - b.sortOrder) }
  },

  async create(params: Omit<BannerData, 'id' | 'pv' | 'clickPv' | 'clickRate'>): Promise<ApiResponse<BannerData>> {
    await delay(400)
    const item: BannerData = {
      id: `b${Date.now()}`,
      ...params,
      pv: 0,
      clickPv: 0,
      clickRate: 0,
    }
    data.push(item)
    return { data: item }
  },

  async update(id: string, params: Partial<Omit<BannerData, 'id' | 'pv' | 'clickPv' | 'clickRate'>>): Promise<ApiResponse<BannerData>> {
    await delay(300)
    const idx = data.findIndex((d) => d.id === id)
    if (idx === -1) throw new Error('Banner 不存在')
    data[idx] = { ...data[idx], ...params }
    return { data: data[idx] }
  },

  async toggle(id: string, enabled: boolean): Promise<ApiResponse<null>> {
    await delay(200)
    const idx = data.findIndex((d) => d.id === id)
    if (idx !== -1) data[idx].enabled = enabled
    return { data: null }
  },

  async reorder(ids: string[]): Promise<ApiResponse<null>> {
    await delay(200)
    const orderMap: Record<string, number> = {}
    ids.forEach((id, i) => { orderMap[id] = i + 1 })
    data.forEach((d) => {
      if (orderMap[d.id] !== undefined) d.sortOrder = orderMap[d.id]
    })
    return { data: null }
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    await delay(300)
    data = data.filter((d) => d.id !== id)
    return { data: null }
  },
}
