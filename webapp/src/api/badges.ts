import { ApiResponse } from '@/types/api'
import type { BadgeData } from '@/types/badge'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

let data: BadgeData[] = [
  { id: 'bg1', name: '学习之星', icon: '⭐', description: '累计学习 100 张卡片', requiredPoints: 0, enabled: true, redeemCount: 128, createdAt: '2026-05-01' },
  { id: 'bg2', name: '挑战达人', icon: '🏆', description: '完成 50 次挑战', requiredPoints: 0, enabled: true, redeemCount: 56, createdAt: '2026-05-01' },
  { id: 'bg3', name: '打卡王', icon: '📅', description: '连续打卡 30 天', requiredPoints: 0, enabled: true, redeemCount: 89, createdAt: '2026-05-01' },
  { id: 'bg4', name: '笔记大师', icon: '📝', description: '撰写 200 条笔记', requiredPoints: 500, enabled: true, redeemCount: 23, createdAt: '2026-05-01' },
  { id: 'bg5', name: '知识收藏家', icon: '📚', description: '收藏 50 张卡片', requiredPoints: 200, enabled: false, redeemCount: 12, createdAt: '2026-05-01' },
  { id: 'bg6', name: '学霸', icon: '🎓', description: '总积分达到 10000', requiredPoints: 1000, enabled: true, redeemCount: 7, createdAt: '2026-05-01' },
]

export const badgeApi = {
  async getList(): Promise<ApiResponse<BadgeData[]>> {
    await delay(300)
    return { data: [...data] }
  },

  async create(params: Omit<BadgeData, 'id' | 'redeemCount' | 'createdAt'>): Promise<ApiResponse<BadgeData>> {
    await delay(400)
    const item: BadgeData = {
      id: `bg${Date.now()}`,
      ...params,
      redeemCount: 0,
      createdAt: '2026-05-25',
    }
    data.push(item)
    return { data: item }
  },

  async update(id: string, params: Partial<Omit<BadgeData, 'id' | 'redeemCount' | 'createdAt'>>): Promise<ApiResponse<BadgeData>> {
    await delay(300)
    const idx = data.findIndex((d) => d.id === id)
    if (idx === -1) throw new Error('徽章不存在')
    data[idx] = { ...data[idx], ...params }
    return { data: data[idx] }
  },

  async toggle(id: string, enabled: boolean): Promise<ApiResponse<null>> {
    await delay(200)
    const idx = data.findIndex((d) => d.id === id)
    if (idx !== -1) data[idx].enabled = enabled
    return { data: null }
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    await delay(300)
    data = data.filter((d) => d.id !== id)
    return { data: null }
  },
}
