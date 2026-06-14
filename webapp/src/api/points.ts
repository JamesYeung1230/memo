import apiClient from './client'
import { ApiResponse } from '@/types/api'
import type { PointConfig, PointChangeLog, ActionType } from '@/types/point'

// ── Backend keys ↔ Frontend actionType mapping ──

interface ActionTypeMapping {
  pointsKey: string | null
  limitKey: string | null
  description: string
  configSource: 'points_rules' | 'checkin_milestones'
}

const ACTION_TYPE_MAP: Record<ActionType, ActionTypeMapping> = {
  learning: {
    pointsKey: 'learn_card',
    limitKey: 'daily_learn_card_limit',
    description: '每学习一张卡片获得积分',
    configSource: 'points_rules',
  },
  challenge: {
    pointsKey: 'daily_challenge',
    limitKey: 'daily_challenge_limit',
    description: '完成一次挑战获得积分',
    configSource: 'points_rules',
  },
  checkin: {
    pointsKey: null,
    limitKey: null,
    description: '每日签到获得积分',
    configSource: 'checkin_milestones',
  },
  note: {
    pointsKey: 'create_note',
    limitKey: 'daily_create_note_limit',
    description: '撰写一条笔记获得积分',
    configSource: 'points_rules',
  },
  ad: {
    pointsKey: 'ad_watch',
    limitKey: 'daily_ad_watch_limit',
    description: '观看一条激励广告获得积分',
    configSource: 'points_rules',
  },
}

const ACTION_TYPES: ActionType[] = ['learning', 'challenge', 'checkin', 'note', 'ad']

// ── Raw backend response shapes ──

interface SystemConfigEntry {
  config_key: string
  config_value: Record<string, number>
  version: number
  updated_at: string
}

interface PointsRulesRawData {
  points_rules: SystemConfigEntry
  checkin_milestones: SystemConfigEntry
}

// ── Mapper: backend nested config → PointConfig[] ──

function mapPointConfigs(rawData: PointsRulesRawData): PointConfig[] {
  const rules = rawData.points_rules.config_value
  const milestones = rawData.checkin_milestones.config_value

  // Checkin: use the first milestone value as the default points value
  const milestoneValues = Object.values(milestones)
  const firstMilestoneValue = milestoneValues.length > 0 ? milestoneValues[0] : 15

  return ACTION_TYPES.map((actionType) => {
    const mapping = ACTION_TYPE_MAP[actionType]

    let pointsValue: number
    let dailyLimit: number
    let updatedAt: string

    if (mapping.configSource === 'checkin_milestones') {
      pointsValue = firstMilestoneValue
      dailyLimit = 1
      updatedAt = rawData.checkin_milestones.updated_at
    } else {
      pointsValue = rules[mapping.pointsKey!] ?? 0
      dailyLimit = rules[mapping.limitKey!] ?? 0
      updatedAt = rawData.points_rules.updated_at
    }

    return {
      id: `pt-${actionType}`,
      actionType,
      pointsValue,
      dailyLimit,
      description: mapping.description,
      updatedAt,
    }
  })
}

// ── API ──

export const pointApi = {
  /**
   * Fetch all points rules from the backend and map them to PointConfig[].
   */
  async getList(): Promise<ApiResponse<PointConfig[]>> {
    const res = await apiClient.get('/admin/points-rules')
    const rawData = res.data as PointsRulesRawData
    return { data: mapPointConfigs(rawData) }
  },

  /**
   * Update a single point config entry.
   * Uses read-modify-write: GET current config → update specific keys → PUT full config.
   */
  async update(
    id: string,
    params: { pointsValue: number; dailyLimit: number },
  ): Promise<ApiResponse<PointConfig>> {
    const actionType = id.replace('pt-', '') as ActionType
    const mapping = ACTION_TYPE_MAP[actionType]
    if (!mapping) {
      throw new Error('配置项不存在')
    }

    // Step 1: GET current config
    const getRes = await apiClient.get('/admin/points-rules')
    const rawData = getRes.data as PointsRulesRawData

    if (mapping.configSource === 'checkin_milestones') {
      // Checkin lives in checkin_milestones, not points_rules
      const currentMilestones = rawData.checkin_milestones.config_value
      const milestoneValues = Object.values(currentMilestones)
      const oldFirst = milestoneValues.length > 0 ? milestoneValues[0] : 15
      const ratio = params.pointsValue / oldFirst

      const newMilestones: Record<string, number> = {}
      for (const [day, val] of Object.entries(currentMilestones)) {
        newMilestones[day] = Math.round(val * ratio)
      }

      // Step 2: PUT updated milestones
      await apiClient.put('/admin/points-rules', {
        checkin_milestones: newMilestones,
      })
    } else {
      // All other action types live in points_rules
      const updatedRules = { ...rawData.points_rules.config_value }
      updatedRules[mapping.pointsKey!] = params.pointsValue
      updatedRules[mapping.limitKey!] = params.dailyLimit

      // Step 2: PUT updated rules
      await apiClient.put('/admin/points-rules', {
        points_rules: updatedRules,
      })
    }

    // Step 3: Return updated PointConfig
    return {
      data: {
        id,
        actionType,
        pointsValue: params.pointsValue,
        dailyLimit: mapping.configSource === 'checkin_milestones' ? 1 : params.dailyLimit,
        description: mapping.description,
        updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      },
    }
  },

  /**
   * Fetch points config change logs.
   * Note: Backend history_entries is currently a placeholder (always empty).
   */
  async getChangeLogs(): Promise<ApiResponse<PointChangeLog[]>> {
    await apiClient.get('/admin/points-rules/history')
    // Backend history_entries is always empty for now.
    // When populated, map each entry to a PointChangeLog:
    //   entry → { id, actionType, oldValue, newValue, oldLimit, newLimit, operator, changedAt }
    return { data: [] }
  },
}
