import apiClient from './client'
import { ApiResponse } from '@/types/api'
import type { ReviewPlan, ReviewDefaultConfig } from '@/types/review-config'
import { presetReviewPlans } from '@/types/review-config'

/** Backend config_value shape */
interface BackendConfigValue {
  review_nodes: number[]
  daily_limit: number
  forgotten_alert_days: number
  reminder_time: string
  weekend_quiet: boolean
}

interface BackendConfigData {
  config_key: string
  config_value: BackendConfigValue
  version: number
  updated_at: string
}

/** Default config_value for reset */
const DEFAULT_CONFIG_VALUE: BackendConfigValue = {
  review_nodes: [0.04, 1, 3, 7],
  daily_limit: 50,
  forgotten_alert_days: 3,
  reminder_time: '20:00',
  weekend_quiet: true,
}

/** Map backend config_value (snake_case) to frontend ReviewDefaultConfig (camelCase) */
function mapToFrontend(raw: BackendConfigValue): ReviewDefaultConfig {
  return {
    dailyLimit: raw.daily_limit,
    remindTime: raw.reminder_time,
    weekendSilent: raw.weekend_quiet,
  }
}

/** Map frontend fields to backend snake_case fields (partial) */
function mapToBackend(params: Partial<ReviewDefaultConfig>): Partial<BackendConfigValue> {
  const result: Partial<BackendConfigValue> = {}
  if (params.dailyLimit !== undefined) result.daily_limit = params.dailyLimit
  if (params.remindTime !== undefined) result.reminder_time = params.remindTime
  if (params.weekendSilent !== undefined) result.weekend_quiet = params.weekendSilent
  return result
}

/** Compare two interval arrays with tolerance (1/24 ≈ 0.04) */
function intervalsMatch(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false
  return a.every((val, i) => Math.abs(val - b[i]) < 0.01)
}

/** Fetch current config from the backend */
async function fetchConfig(): Promise<BackendConfigData> {
  const res = await apiClient.get('/admin/review-default-config')
  return res.data as BackendConfigData
}

export const reviewConfigApi = {
  /**
   * Return preset review plans with the correct isDefault marking.
   * Compares each plan's intervals against the backend's current review_nodes.
   */
  async getPlans(): Promise<ApiResponse<ReviewPlan[]>> {
    const config = await fetchConfig()
    const defaultNodes = config.config_value.review_nodes
    const plans = presetReviewPlans.map((plan) => ({
      ...plan,
      isDefault: intervalsMatch(plan.intervals, defaultNodes),
    }))
    return { data: plans }
  },

  /** GET /admin/review-default-config → map config_value → ReviewDefaultConfig */
  async getDefaultConfig(): Promise<ApiResponse<ReviewDefaultConfig>> {
    const config = await fetchConfig()
    return { data: mapToFrontend(config.config_value) }
  },

  /** GET current config → merge new params → PUT /admin/review-default-config */
  async updateDefaultConfig(
    params: Partial<ReviewDefaultConfig>,
  ): Promise<ApiResponse<ReviewDefaultConfig>> {
    const current = await fetchConfig()
    const merged: BackendConfigValue = {
      ...current.config_value,
      ...mapToBackend(params),
    }
    const res = await apiClient.put('/admin/review-default-config', {
      config_value: merged,
    })
    const updated = res.data as BackendConfigData
    return { data: mapToFrontend(updated.config_value) }
  },

  /** PUT /admin/review-default-config with hardcoded defaults */
  async resetDefaultConfig(): Promise<ApiResponse<ReviewDefaultConfig>> {
    const res = await apiClient.put('/admin/review-default-config', {
      config_value: DEFAULT_CONFIG_VALUE,
    })
    const updated = res.data as BackendConfigData
    return { data: mapToFrontend(updated.config_value) }
  },

  /**
   * Find the preset plan by id, update the backend's review_nodes to match.
   * Throws if planId is not found in presetReviewPlans.
   */
  async setDefaultPlan(planId: string): Promise<ApiResponse<null>> {
    const plan = presetReviewPlans.find((p) => p.id === planId)
    if (!plan) throw new Error(`预设方案未找到: ${planId}`)
    const current = await fetchConfig()
    const updated: BackendConfigValue = {
      ...current.config_value,
      review_nodes: plan.intervals,
    }
    await apiClient.put('/admin/review-default-config', {
      config_value: updated,
    })
    return { data: null }
  },
}
