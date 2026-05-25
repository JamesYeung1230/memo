/** 复习节点方案 */
export interface ReviewPlan {
  id: string
  name: string
  intervals: number[]
  isDefault: boolean
}

/** 复习默认配置 */
export interface ReviewDefaultConfig {
  /** 每日复习上限 */
  dailyLimit: number
  /** 默认提醒时间 (HH:mm) */
  remindTime: string
  /** 周末免打扰 */
  weekendSilent: boolean
}

/** 预设复习方案 */
export const presetReviewPlans: ReviewPlan[] = [
  { id: 'plan-1h-1d-3d-7d', name: '1小时-1天-3天-7天', intervals: [1 / 24, 1, 3, 7], isDefault: true },
  { id: 'plan-1d-3d-7d-15d', name: '1天-3天-7天-15天', intervals: [1, 3, 7, 15], isDefault: false },
  { id: 'plan-1d-2d-4d-7d-15d-30d', name: '1天-2天-4天-7天-15天-30天', intervals: [1, 2, 4, 7, 15, 30], isDefault: false },
  { id: 'plan-custom', name: '自定义方案', intervals: [1, 3, 7], isDefault: false },
]
