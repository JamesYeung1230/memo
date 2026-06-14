import { ApiResponse } from '@/types/api'
import type {
  OverviewStats,
  UserGrowthPoint,
  DomainHeatItem,
  CardRankItem,
  QuestionAccuracyItem,
  UserGrowthItem,
  ActivityDistributionItem,
  FunnelStep,
  PointsTrendItem,
  AdStatItem,
  PointsDistributionItem,
} from '@/types/analytics'
import apiClient from './client'

export interface DashboardStats {
  pendingReview: number
  totalCards: number
  totalUsers: number
  activeUsers7d: number
}

export interface RecentOperation {
  id: string
  action: string
  target: string
  time: string
}

export const analyticsApi = {
  /**
   * Dashboard workbench stats.
   * Combines /admin/dashboard/review + /admin/dashboard/overview in parallel.
   * Note: totalCards and activeUsers7d are NOT available from backend — always 0.
   */
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    const [reviewRes, overviewRes] = await Promise.all([
      apiClient.get('/admin/dashboard/review'),
      apiClient.get('/admin/dashboard/overview'),
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reviewData = (reviewRes as any).data ?? {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const overviewData = (overviewRes as any).data ?? {}

    return {
      data: {
        pendingReview: reviewData.today_pending ?? 0,
        // Backend does not provide total cards count
        totalCards: 0,
        totalUsers: overviewData.total_users ?? 0,
        // Backend does not provide 7-day active users count
        activeUsers7d: 0,
      },
    }
  },

  /**
   * Recent operations list (last 5).
   * GET /admin/logs?page=1&page_size=5
   */
  async getRecentOperations(): Promise<ApiResponse<RecentOperation[]>> {
    const res = await apiClient.get('/admin/logs', {
      params: { page: 1, page_size: 5 },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = res as any

    const items: RecentOperation[] = ((body.data as Record<string, unknown>[]) ?? []).map(
      (item: Record<string, unknown>) => ({
        id: item.id as string,
        action: (item.action_type as string) ?? '',
        target: (item.target_type as string) ?? '',
        time: (item.created_at as string) ?? '',
      }),
    )

    return { data: items }
  },

  // ========== Tab1: 核心指标概览 ==========

  /**
   * Core overview metrics (7 stat cards).
   * Combines /admin/dashboard/overview + /admin/dashboard/points in parallel.
   * Note: todayDau and retention7d are NOT available from backend — always 0.
   */
  async getOverviewStats(): Promise<ApiResponse<OverviewStats>> {
    const [overviewRes, pointsRes] = await Promise.all([
      apiClient.get('/admin/dashboard/overview'),
      apiClient.get('/admin/dashboard/points'),
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const overviewData = (overviewRes as any).data ?? {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pointsData = (pointsRes as any).data ?? {}

    return {
      data: {
        totalUsers: overviewData.total_users ?? 0,
        // Backend does not provide daily active users (DAU)
        todayDau: 0,
        todayCards: overviewData.today_learning ?? 0,
        todayQuestions: overviewData.today_answers ?? 0,
        todayPointsIssued: pointsData.today_issued ?? 0,
        todayPointsConsumed: pointsData.today_consumed ?? 0,
        // Backend does not provide 7-day retention rate
        retention7d: 0,
      },
    }
  },

  /**
   * User growth trend (single line: daily new users).
   * No backend endpoint — returns empty array.
   */
  async getUserGrowthTrend(_days: 7 | 30): Promise<ApiResponse<UserGrowthPoint[]>> {
    // Backend does not provide user growth trend data
    return { data: [] }
  },

  // ========== Tab2: 内容数据 ==========

  /**
   * Domain learning heat (horizontal bar chart).
   * No backend endpoint — returns empty array.
   */
  async getDomainHeat(): Promise<ApiResponse<DomainHeatItem[]>> {
    // Backend does not provide domain heat/learning distribution data
    return { data: [] }
  },

  /**
   * Card learning ranking TOP10.
   * No backend endpoint — returns empty array.
   */
  async getCardLearningRank(): Promise<ApiResponse<CardRankItem[]>> {
    // Backend does not provide card learning ranking data
    return { data: [] }
  },

  /**
   * Question accuracy by domain.
   * No backend endpoint — returns empty array.
   */
  async getQuestionAccuracy(): Promise<ApiResponse<QuestionAccuracyItem[]>> {
    // Backend does not provide question accuracy by domain data
    return { data: [] }
  },

  // ========== Tab3: 用户数据 ==========

  /**
   * User growth trend (dual-line: cumulative + new users).
   * No backend endpoint — returns empty array.
   */
  async getUserGrowth(): Promise<ApiResponse<UserGrowthItem[]>> {
    // Backend does not provide user growth trend over time
    return { data: [] }
  },

  /**
   * Activity distribution (donut chart).
   * No backend endpoint — returns empty array.
   */
  async getActivityDistribution(): Promise<ApiResponse<ActivityDistributionItem[]>> {
    // Backend does not provide user activity distribution data
    return { data: [] }
  },

  /**
   * Learning behavior funnel.
   * No backend endpoint — returns empty array.
   */
  async getLearningFunnel(): Promise<ApiResponse<FunnelStep[]>> {
    // Backend does not provide learning funnel data
    return { data: [] }
  },

  // ========== Tab4: 积分与广告数据 ==========

  /**
   * Points issued/consumed trend (30-day).
   * No backend endpoint — returns empty array.
   */
  async getPointsTrend(): Promise<ApiResponse<PointsTrendItem[]>> {
    // Backend does not provide points trend over time
    return { data: [] }
  },

  /**
   * Ad impressions/clicks (7-day).
   * No backend endpoint — returns empty array.
   */
  async getAdStats(): Promise<ApiResponse<AdStatItem[]>> {
    // Backend does not provide ad stats trend over time
    return { data: [] }
  },

  /**
   * Points acquisition distribution.
   * No backend endpoint — returns empty array.
   */
  async getPointsDistribution(): Promise<ApiResponse<PointsDistributionItem[]>> {
    // Backend does not provide points distribution breakdown
    return { data: [] }
  },
}
