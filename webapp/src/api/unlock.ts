import apiClient from './client'
import { ApiResponse } from '@/types/api'
import type { UnlockConfig } from '@/types/unlock'

/** Backend unlock config shape inside config_value */
interface BackendUnlockConfigValue {
  domain_unlock_ranges: Record<string, number>
  premium_card_unlock: number
}

/** Backend domain list item (minimal fields we need) */
interface BackendDomain {
  id: string
  name: string
}

/** Helper: GET /admin/unlock-config → extract config_value */
async function getUnlockConfigValue(): Promise<BackendUnlockConfigValue> {
  const res = await apiClient.get('/admin/unlock-config')
  const data = res.data as {
    config_key: string
    config_value: BackendUnlockConfigValue
    version: number
    updated_at: string
  }
  return data.config_value
}

/** Helper: PUT /admin/unlock-config with updated config_value */
async function putUnlockConfigValue(configValue: BackendUnlockConfigValue): Promise<void> {
  await apiClient.put('/admin/unlock-config', { config_value: configValue })
}

/** Map a domain + its unlock points → frontend UnlockConfig */
function toUnlockConfig(
  domain: BackendDomain,
  unlockPoints: number | undefined,
): UnlockConfig {
  const points = unlockPoints ?? 0
  return {
    domainId: domain.id,
    domainName: domain.name,
    isFree: points === 0,
    unlockPoints: points,
  }
}

export const unlockApi = {
  /**
   * Fetch all domains + unlock config, merge into UnlockConfig[] sorted by domain name.
   * A domain is free when its unlock_points is 0 or not present in the config.
   */
  async getList(): Promise<ApiResponse<UnlockConfig[]>> {
    const [domainsRes, configValue] = await Promise.all([
      apiClient.get('/admin/domains', { params: { page: 1, page_size: 100 } }),
      getUnlockConfigValue(),
    ])

    const domains = (domainsRes.data as BackendDomain[]) ?? []
    const ranges = configValue.domain_unlock_ranges ?? {}

    const list: UnlockConfig[] = domains.map((d) => toUnlockConfig(d, ranges[d.id]))
    list.sort((a, b) => a.domainName.localeCompare(b.domainName))

    return { data: list }
  },

  /**
   * Update a single domain's unlock points via read-modify-write on the config.
   * Returns the updated UnlockConfig with the domain name resolved from /admin/domains.
   */
  async update(
    domainId: string,
    params: { unlockPoints: number },
  ): Promise<ApiResponse<UnlockConfig>> {
    // Read current config
    const configValue = await getUnlockConfigValue()

    // Modify
    configValue.domain_unlock_ranges[domainId] = params.unlockPoints

    // Write back
    await putUnlockConfigValue(configValue)

    // Resolve domain name for the response
    const domainsRes = await apiClient.get('/admin/domains', {
      params: { page: 1, page_size: 100 },
    })
    const domains = (domainsRes.data as BackendDomain[]) ?? []
    const domain = domains.find((d) => d.id === domainId)

    return {
      data: toUnlockConfig(
        domain ?? { id: domainId, name: '' },
        params.unlockPoints,
      ),
    }
  },

  /**
   * Batch update multiple domains' unlock points via read-modify-write on the config.
   */
  async batchUpdate(
    updates: { domainId: string; unlockPoints: number }[],
  ): Promise<ApiResponse<null>> {
    // Read current config
    const configValue = await getUnlockConfigValue()

    // Modify each entry
    for (const u of updates) {
      configValue.domain_unlock_ranges[u.domainId] = u.unlockPoints
    }

    // Write back
    await putUnlockConfigValue(configValue)

    return { data: null }
  },
}
