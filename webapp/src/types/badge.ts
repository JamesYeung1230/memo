/** 成就徽章数据 */
export interface BadgeData {
  id: string
  name: string
  icon: string
  description: string
  requiredPoints: number
  enabled: boolean
  redeemCount: number
  createdAt: string
}
