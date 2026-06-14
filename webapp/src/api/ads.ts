import apiClient from './client'
import { ApiResponse, BackendEnvelope } from '@/types/api'
import type { AdConfig } from '@/types/ad'

/** Raw backend ad config as returned from the Config table API */
interface AdConfigRaw {
  config_key: string
  config_value: Record<string, unknown>
  version: number
  description: string | null
  updated_by: string
  updated_at: string
}

/**
 * Map raw backend config envelope data to the frontend AdConfig type.
 * Extracts fields from config_value and maps snake_case → camelCase.
 */
function mapAdConfig(raw: AdConfigRaw): AdConfig {
  const cv = raw.config_value
  return {
    splashEnabled: (cv.splash_enabled as boolean) ?? true,
    splashImageUrl: (cv.splash_image_url as string) ?? '',
    splashLink: (cv.splash_link as string) ?? '',
    incentivePoints: (cv.incentive_points as number) ?? 30,
    updatedAt: raw.updated_at,
  }
}

/**
 * Build the request body for PUT /admin/ad-config.
 * Merges new frontend params into the existing config_value dict,
 * preserving backend-only fields (splash_ad_unit_id, reward_ad_unit_id, etc.).
 */
function buildAdConfigBody(
  params: Partial<Omit<AdConfig, 'incentivePoints' | 'updatedAt'>>,
  existing: AdConfigRaw,
): { config_value: Record<string, unknown> } {
  const merged = { ...existing.config_value }
  if (params.splashEnabled !== undefined) {
    merged.splash_enabled = params.splashEnabled
  }
  if (params.splashImageUrl !== undefined) {
    merged.splash_image_url = params.splashImageUrl
  }
  if (params.splashLink !== undefined) {
    merged.splash_link = params.splashLink
  }
  return { config_value: merged }
}

export const adApi = {
  /** Get current ad configuration */
  async getConfig(): Promise<ApiResponse<AdConfig>> {
    const res = (await apiClient.get('/admin/ad-config')) as unknown as BackendEnvelope<AdConfigRaw>
    return { data: mapAdConfig(res.data) }
  },

  /** Update ad configuration (partial update — merges with existing values) */
  async updateConfig(
    params: Partial<Omit<AdConfig, 'incentivePoints' | 'updatedAt'>>,
  ): Promise<ApiResponse<AdConfig>> {
    const currentRes = (await apiClient.get(
      '/admin/ad-config',
    )) as unknown as BackendEnvelope<AdConfigRaw>
    const body = buildAdConfigBody(params, currentRes.data)
    const updateRes = (await apiClient.put(
      '/admin/ad-config',
      body,
    )) as unknown as BackendEnvelope<AdConfigRaw>
    return { data: mapAdConfig(updateRes.data) }
  },
}
