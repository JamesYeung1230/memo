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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

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

/** 生成最近 N 天的日期数组 */
function generateDates(days: number): string[] {
  const dates: string[] = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

export const analyticsApi = {
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    await delay(300)
    return {
      data: {
        pendingReview: 12,
        totalCards: 186,
        totalUsers: 3482,
        activeUsers7d: 856,
      },
    }
  },

  async getRecentOperations(): Promise<ApiResponse<RecentOperation[]>> {
    await delay(200)
    return {
      data: [
        { id: '1', action: '新增', target: '知识卡片 - 什么是变量', time: '2026-05-07 14:32' },
        { id: '2', action: '编辑', target: '积分规则配置', time: '2026-05-07 11:15' },
        { id: '3', action: '审核通过', target: '用户笔记 - React Hooks 入门指南', time: '2026-05-07 09:08' },
        { id: '4', action: '删除', target: '敏感词 - 违规词汇', time: '2026-05-06 17:45' },
        { id: '5', action: '新增', target: 'Banner - 暑期活动推广', time: '2026-05-06 15:20' },
        { id: '6', action: '编辑', target: '知识领域 - 前端开发', time: '2026-05-06 11:00' },
        { id: '7', action: '审核驳回', target: '用户笔记 - JavaScript 进阶', time: '2026-05-06 09:30' },
      ],
    }
  },

  // ========== Tab1: 核心指标概览 ==========

  /** 获取7个核心指标 */
  async getOverviewStats(): Promise<ApiResponse<OverviewStats>> {
    await delay(300)
    return {
      data: {
        totalUsers: 34826,
        todayDau: 1843,
        todayCards: 567,
        todayQuestions: 1238,
        todayPointsIssued: 45200,
        todayPointsConsumed: 12800,
        retention7d: 37.5,
      },
    }
  },

  /** 获取用户增长趋势（单条线） */
  async getUserGrowthTrend(days: 7 | 30): Promise<ApiResponse<UserGrowthPoint[]>> {
    await delay(300)
    const dates = generateDates(days)
    const baseGrowth = days === 7 ? 150 : 120
    const data: UserGrowthPoint[] = dates.map((date, i) => ({
      date,
      count: Math.floor(baseGrowth + Math.sin(i * 0.8) * (days === 7 ? 40 : 30) + Math.random() * 30),
    }))
    return { data }
  },

  // ========== Tab2: 内容数据 ==========

  /** 领域学习热度（水平条形图） */
  async getDomainHeat(): Promise<ApiResponse<DomainHeatItem[]>> {
    await delay(300)
    return {
      data: [
        { domain: '前端开发', heat: 2860 },
        { domain: '后端开发', heat: 2240 },
        { domain: '人工智能', heat: 1980 },
        { domain: '数据结构与算法', heat: 1750 },
        { domain: '云计算与运维', heat: 1420 },
        { domain: '产品与设计', heat: 980 },
        { domain: '软技能与职场', heat: 650 },
      ],
    }
  },

  /** 卡片学习排行 TOP10 */
  async getCardLearningRank(): Promise<ApiResponse<CardRankItem[]>> {
    await delay(300)
    return {
      data: [
        { cardTitle: 'React Hooks 入门指南', studyCount: 486 },
        { cardTitle: 'JavaScript 闭包详解', studyCount: 423 },
        { cardTitle: 'HTTP 状态码速查表', studyCount: 390 },
        { cardTitle: 'CSS Grid 布局教程', studyCount: 352 },
        { cardTitle: 'Python 列表推导式', studyCount: 318 },
        { cardTitle: 'Git 常用命令手册', studyCount: 287 },
        { cardTitle: 'SQL 查询优化技巧', studyCount: 254 },
        { cardTitle: 'Docker 基础入门', studyCount: 226 },
        { cardTitle: 'TypeScript 类型系统', studyCount: 198 },
        { cardTitle: '设计模式之观察者模式', studyCount: 165 },
      ],
    }
  },

  /** 题目正确率（按领域分组） */
  async getQuestionAccuracy(): Promise<ApiResponse<QuestionAccuracyItem[]>> {
    await delay(300)
    return {
      data: [
        { domain: '前端开发', correctRate: 72, wrongRate: 28 },
        { domain: '后端开发', correctRate: 68, wrongRate: 32 },
        { domain: '人工智能', correctRate: 58, wrongRate: 42 },
        { domain: '数据结构与算法', correctRate: 45, wrongRate: 55 },
        { domain: '云计算与运维', correctRate: 63, wrongRate: 37 },
        { domain: '产品与设计', correctRate: 78, wrongRate: 22 },
        { domain: '软技能与职场', correctRate: 85, wrongRate: 15 },
      ],
    }
  },

  // ========== Tab3: 用户数据 ==========

  /** 用户增长趋势（双折线：累计+新增） */
  async getUserGrowth(): Promise<ApiResponse<UserGrowthItem[]>> {
    await delay(300)
    const dates = generateDates(30)
    let cumulative = 34000
    const data: UserGrowthItem[] = dates.map((date, i) => {
      const newUsers = Math.floor(80 + Math.sin(i * 0.5) * 30 + Math.random() * 40)
      cumulative += newUsers
      return { date, cumulative, newUsers }
    })
    return { data }
  },

  /** 活跃度分布 */
  async getActivityDistribution(): Promise<ApiResponse<ActivityDistributionItem[]>> {
    await delay(300)
    return {
      data: [
        { name: '高活跃', value: 5842 },
        { name: '中活跃', value: 8923 },
        { name: '低活跃', value: 12086 },
        { name: '沉默用户', value: 7975 },
      ],
    }
  },

  /** 学习行为漏斗 */
  async getLearningFunnel(): Promise<ApiResponse<FunnelStep[]>> {
    await delay(300)
    return {
      data: [
        { name: '访问首页', value: 10000 },
        { name: '浏览卡片', value: 7200 },
        { name: '开始学习', value: 5100 },
        { name: '完成学习', value: 3800 },
        { name: '答题练习', value: 2100 },
        { name: '分享笔记', value: 850 },
      ],
    }
  },

  // ========== Tab4: 积分与广告数据 ==========

  /** 积分发放/消耗趋势 */
  async getPointsTrend(): Promise<ApiResponse<PointsTrendItem[]>> {
    await delay(300)
    const dates = generateDates(30)
    const data: PointsTrendItem[] = dates.map((date, i) => ({
      date,
      issued: Math.floor(40000 + Math.sin(i * 0.4) * 8000 + Math.random() * 5000),
      consumed: Math.floor(12000 + Math.cos(i * 0.3) * 3000 + Math.random() * 2000),
    }))
    return { data }
  },

  /** 广告展示/点击 */
  async getAdStats(): Promise<ApiResponse<AdStatItem[]>> {
    await delay(300)
    const dates = generateDates(7)
    const data: AdStatItem[] = dates.map((date, i) => ({
      date,
      impressions: Math.floor(5000 + Math.sin(i * 0.7) * 1000 + Math.random() * 800),
      clicks: Math.floor(350 + Math.sin(i * 0.5) * 80 + Math.random() * 60),
    }))
    return { data }
  },

  /** 积分获取占比 */
  async getPointsDistribution(): Promise<ApiResponse<PointsDistributionItem[]>> {
    await delay(300)
    return {
      data: [
        { name: '学习行为', value: 45 },
        { name: '挑战行为', value: 20 },
        { name: '打卡行为', value: 15 },
        { name: '笔记行为', value: 12 },
        { name: '广告行为', value: 8 },
      ],
    }
  },
}
