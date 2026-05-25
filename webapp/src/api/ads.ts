import { ApiResponse } from '@/types/api'
import type { AdConfig } from '@/types/ad'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const mockConfig: AdConfig = {
  splashEnabled: true,
  splashImageUrl: 'https://picsum.photos/1125/2436?random=ads',
  splashLink: 'https://example.com/splash',
  incentivePoints: 30,
  updatedAt: '2026-05-20 10:00',
}

export const adApi = {
  async getConfig(): Promise<ApiResponse<AdConfig>> {
    await delay(300)
    return { data: { ...mockConfig } }
  },

  async updateConfig(params: Partial<Omit<AdConfig, 'incentivePoints' | 'updatedAt'>>): Promise<ApiResponse<AdConfig>> {
    await delay(400)
    Object.assign(mockConfig, params, { updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') })
    return { data: { ...mockConfig } }
  },
}
