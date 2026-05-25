import { ApiResponse } from '@/types/api'
import type { DomainData } from '@/types/domain'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const mockData: DomainData[] = [
  { id: 'd1', name: '计算机科学', icon: '💻', isFree: true, unlockPoints: 0, enabled: true, sortOrder: 1, createdAt: '2026-05-01' },
  { id: 'd2', name: '数学基础', icon: '📐', isFree: true, unlockPoints: 0, enabled: true, sortOrder: 2, createdAt: '2026-05-02' },
  { id: 'd3', name: '英语学习', icon: '🇬🇧', isFree: false, unlockPoints: 200, enabled: true, sortOrder: 3, createdAt: '2026-05-03' },
  { id: 'd4', name: '历史文化', icon: '🏛️', isFree: true, unlockPoints: 0, enabled: true, sortOrder: 4, createdAt: '2026-05-04' },
  { id: 'd5', name: '物理科学', icon: '⚛️', isFree: false, unlockPoints: 300, enabled: false, sortOrder: 5, createdAt: '2026-05-05' },
  { id: 'd6', name: '生物医学', icon: '🧬', isFree: false, unlockPoints: 500, enabled: true, sortOrder: 6, createdAt: '2026-05-06' },
  { id: 'd7', name: '经济学', icon: '📊', isFree: true, unlockPoints: 0, enabled: false, sortOrder: 7, createdAt: '2026-05-07' },
  { id: 'd8', name: '哲学思考', icon: '🧠', isFree: true, unlockPoints: 0, enabled: true, sortOrder: 8, createdAt: '2026-05-08' },
]

let data = [...mockData]

export const domainApi = {
  async getList(): Promise<ApiResponse<DomainData[]>> {
    await delay(300)
    return { data: [...data].sort((a, b) => a.sortOrder - b.sortOrder) }
  },

  async create(params: { name: string; icon: string; isFree: boolean; unlockPoints: number; enabled: boolean }): Promise<ApiResponse<DomainData>> {
    await delay(400)
    const maxSort = data.reduce((max, d) => Math.max(max, d.sortOrder), 0)
    const item: DomainData = {
      id: `d${Date.now()}`,
      name: params.name,
      icon: params.icon,
      isFree: params.isFree,
      unlockPoints: params.unlockPoints,
      enabled: params.enabled,
      sortOrder: maxSort + 1,
      createdAt: '2026-05-25',
    }
    data.push(item)
    return { data: item }
  },

  async update(id: string, params: Partial<DomainData>): Promise<ApiResponse<DomainData>> {
    await delay(300)
    const idx = data.findIndex((d) => d.id === id)
    if (idx === -1) throw new Error('领域不存在')
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
