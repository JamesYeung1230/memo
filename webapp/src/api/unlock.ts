import { ApiResponse } from '@/types/api'
import type { UnlockConfig } from '@/types/unlock'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const mockData: UnlockConfig[] = [
  { domainId: 'd1', domainName: '计算机科学', isFree: true, unlockPoints: 0 },
  { domainId: 'd2', domainName: '数学基础', isFree: true, unlockPoints: 0 },
  { domainId: 'd3', domainName: '英语学习', isFree: false, unlockPoints: 200 },
  { domainId: 'd4', domainName: '历史文化', isFree: true, unlockPoints: 0 },
  { domainId: 'd5', domainName: '物理科学', isFree: false, unlockPoints: 300 },
  { domainId: 'd6', domainName: '生物医学', isFree: false, unlockPoints: 500 },
  { domainId: 'd7', domainName: '经济学', isFree: true, unlockPoints: 0 },
  { domainId: 'd8', domainName: '哲学思考', isFree: true, unlockPoints: 0 },
]

export const unlockApi = {
  async getList(): Promise<ApiResponse<UnlockConfig[]>> {
    await delay(300)
    return { data: [...mockData].sort((a, b) => a.domainName.localeCompare(b.domainName)) }
  },

  async update(domainId: string, params: { unlockPoints: number }): Promise<ApiResponse<UnlockConfig>> {
    await delay(400)
    const idx = mockData.findIndex((d) => d.domainId === domainId)
    if (idx === -1) throw new Error('领域不存在')
    mockData[idx].unlockPoints = params.unlockPoints
    return { data: mockData[idx] }
  },

  async batchUpdate(updates: { domainId: string; unlockPoints: number }[]): Promise<ApiResponse<null>> {
    await delay(500)
    for (const u of updates) {
      const idx = mockData.findIndex((d) => d.domainId === u.domainId)
      if (idx !== -1) mockData[idx].unlockPoints = u.unlockPoints
    }
    return { data: null }
  },
}
