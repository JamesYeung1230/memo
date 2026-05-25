import { ApiResponse } from '@/types/api'
import type { PointConfig, PointChangeLog } from '@/types/point'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const mockConfigs: PointConfig[] = [
  { id: 'pt1', actionType: 'learning', pointsValue: 10, dailyLimit: 100, description: '每学习一张卡片获得积分', updatedAt: '2026-05-20 10:00' },
  { id: 'pt2', actionType: 'challenge', pointsValue: 50, dailyLimit: 200, description: '完成一次挑战获得积分', updatedAt: '2026-05-20 10:00' },
  { id: 'pt3', actionType: 'checkin', pointsValue: 5, dailyLimit: 5, description: '每日签到获得积分', updatedAt: '2026-05-20 10:00' },
  { id: 'pt4', actionType: 'note', pointsValue: 20, dailyLimit: 100, description: '撰写一条笔记获得积分', updatedAt: '2026-05-20 10:00' },
  { id: 'pt5', actionType: 'ad', pointsValue: 30, dailyLimit: 150, description: '观看一条激励广告获得积分', updatedAt: '2026-05-20 10:00' },
]

const mockChangeLogs: PointChangeLog[] = [
  { id: 'cl1', actionType: 'learning', oldValue: 5, newValue: 10, oldLimit: 50, newLimit: 100, operator: 'admin', changedAt: '2026-05-20 10:00' },
  { id: 'cl2', actionType: 'challenge', oldValue: 30, newValue: 50, oldLimit: 150, newLimit: 200, operator: 'admin', changedAt: '2026-05-18 14:30' },
]

export const pointApi = {
  async getList(): Promise<ApiResponse<PointConfig[]>> {
    await delay(300)
    return { data: [...mockConfigs] }
  },

  async update(id: string, params: { pointsValue: number; dailyLimit: number }): Promise<ApiResponse<PointConfig>> {
    await delay(400)
    const config = mockConfigs.find((c) => c.id === id)
    if (!config) throw new Error('配置项不存在')
    config.pointsValue = params.pointsValue
    config.dailyLimit = params.dailyLimit
    config.updatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
    return { data: config }
  },

  async getChangeLogs(): Promise<ApiResponse<PointChangeLog[]>> {
    await delay(200)
    return { data: [...mockChangeLogs] }
  },
}
