import { ApiResponse } from '@/types/api'
import type { ReviewPlan, ReviewDefaultConfig } from '@/types/review-config'
import { presetReviewPlans } from '@/types/review-config'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const mockDefaultConfig: ReviewDefaultConfig = {
  dailyLimit: 50,
  remindTime: '20:00',
  weekendSilent: true,
}

export const reviewConfigApi = {
  async getPlans(): Promise<ApiResponse<ReviewPlan[]>> {
    await delay(300)
    return { data: [...presetReviewPlans] }
  },

  async getDefaultConfig(): Promise<ApiResponse<ReviewDefaultConfig>> {
    await delay(300)
    return { data: { ...mockDefaultConfig } }
  },

  async updateDefaultConfig(params: Partial<ReviewDefaultConfig>): Promise<ApiResponse<ReviewDefaultConfig>> {
    await delay(400)
    Object.assign(mockDefaultConfig, params)
    return { data: { ...mockDefaultConfig } }
  },

  async resetDefaultConfig(): Promise<ApiResponse<ReviewDefaultConfig>> {
    await delay(500)
    mockDefaultConfig.dailyLimit = 50
    mockDefaultConfig.remindTime = '20:00'
    mockDefaultConfig.weekendSilent = true
    return { data: { ...mockDefaultConfig } }
  },

  async setDefaultPlan(_planId: string): Promise<ApiResponse<null>> {
    await delay(300)
    return { data: null }
  },
}
