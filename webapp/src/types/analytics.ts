/** 核心指标概览 - 7个指标卡片 */
export interface OverviewStats {
  totalUsers: number
  todayDau: number
  todayCards: number
  todayQuestions: number
  todayPointsIssued: number
  todayPointsConsumed: number
  retention7d: number
}

/** 指标卡片数据（含趋势） */
export interface StatCardItem {
  key: keyof OverviewStats
  label: string
  prefix?: string
  suffix?: string
  trend?: number
  precision?: number
}

/** 用户增长趋势（单条线） */
export interface UserGrowthPoint {
  date: string
  count: number
}

/** 领域学习热度 */
export interface DomainHeatItem {
  domain: string
  heat: number
}

/** 卡片学习排行 */
export interface CardRankItem {
  cardTitle: string
  studyCount: number
}

/** 题目正确率（按领域分组） */
export interface QuestionAccuracyItem {
  domain: string
  correctRate: number
  wrongRate: number
}

/** 用户增长趋势（双折线：累计+新增） */
export interface UserGrowthItem {
  date: string
  cumulative: number
  newUsers: number
}

/** 活跃度分布 */
export interface ActivityDistributionItem {
  name: string
  value: number
}

/** 学习行为漏斗 */
export interface FunnelStep {
  name: string
  value: number
}

/** 积分发放/消耗趋势 */
export interface PointsTrendItem {
  date: string
  issued: number
  consumed: number
}

/** 广告展示/点击 */
export interface AdStatItem {
  date: string
  impressions: number
  clicks: number
}

/** 积分获取占比 */
export interface PointsDistributionItem {
  name: string
  value: number
}

/** Tab键 */
export type AnalyticsTab = 'overview' | 'content' | 'users' | 'points'
