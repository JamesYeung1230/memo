/** 积分行为类型 */
export type ActionType = 'learning' | 'challenge' | 'checkin' | 'note' | 'ad'

/** 积分行为类型中文标签 */
export const actionTypeLabels: Record<ActionType, string> = {
  learning: '学习行为',
  challenge: '挑战行为',
  checkin: '打卡行为',
  note: '笔记行为',
  ad: '广告行为',
}

/** 积分行为分组 */
export const actionTypeGroups: { key: ActionType; label: string; description: string }[] = [
  { key: 'learning', label: '学习行为', description: '每日学习内容获得的积分奖励' },
  { key: 'challenge', label: '挑战行为', description: '完成挑战任务获得的积分奖励' },
  { key: 'checkin', label: '打卡行为', description: '每日签到/打卡获得的积分奖励' },
  { key: 'note', label: '笔记行为', description: '撰写/分享笔记获得的积分奖励' },
  { key: 'ad', label: '广告行为', description: '观看广告获得的积分奖励' },
]

/** 积分规则配置项 */
export interface PointConfig {
  id: string
  actionType: ActionType
  pointsValue: number
  dailyLimit: number
  description: string
  updatedAt: string
}

/** 配置变更历史 */
export interface PointChangeLog {
  id: string
  actionType: ActionType
  oldValue: number
  newValue: number
  oldLimit: number
  newLimit: number
  operator: string
  changedAt: string
}
