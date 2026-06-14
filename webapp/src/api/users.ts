import apiClient from './client'
import { ApiResponse, PaginatedResponse } from '@/types/api'
import type { UserData, UserDetail, UserLearningRecord, UserPointRecord, UserStats } from '@/types/user'

// --- Raw backend types (snake_case) ---

interface RawUser {
  id: string
  nickname: string
  avatar_url: string
  openid: string
  points_balance: number
  created_at: string
  last_active_time: string
}

interface RawUserStats {
  card_count: number
  answer_count: number
  points_balance: number
  note_count: number
}

interface RawLearningRecord {
  id: string
  card_title: string
  status: string
  created_at: string
}

interface RawPointRecord {
  id: string
  points: number
  action_type: string
  description: string
  created_at: string
}

interface RawUserDetail {
  user: RawUser & {
    violation_count: number
    review_ban_until: string | null
    share_ban_until: string | null
    last_login_at: string | null
  }
  stats: RawUserStats
  learning_records: RawLearningRecord[]
  point_records: RawPointRecord[]
}

// --- Field mappers (snake_case → camelCase) ---

function mapUser(raw: RawUser): UserData {
  return {
    id: raw.id,
    nickname: raw.nickname,
    avatarUrl: raw.avatar_url,
    openId: raw.openid,
    pointsBalance: raw.points_balance,
    registerTime: raw.created_at,
    lastActiveTime: raw.last_active_time,
  }
}

function mapStats(raw: RawUserStats): UserStats {
  return {
    cardCount: raw.card_count,
    answerCount: raw.answer_count,
    pointsBalance: raw.points_balance,
    noteCount: raw.note_count,
  }
}

function mapLearningRecord(raw: RawLearningRecord): UserLearningRecord {
  return {
    id: raw.id,
    cardTitle: raw.card_title,
    learnedAt: raw.created_at,
  }
}

function mapPointRecord(raw: RawPointRecord): UserPointRecord {
  return {
    id: raw.id,
    changeAmount: raw.points,
    reason: raw.description,
    createdAt: raw.created_at,
  }
}

export const userApi = {
  /** GET /admin/users?page=&page_size=&keyword= */
  async getList(params: {
    page: number
    pageSize: number
    keyword?: string
  }): Promise<ApiResponse<PaginatedResponse<UserData>>> {
    const query: Record<string, string | number> = {
      page: params.page,
      page_size: params.pageSize,
    }
    if (params.keyword) {
      query.keyword = params.keyword
    }

    const res = await apiClient.get('/admin/users', { params: query })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = res as any
    const rawItems = (body.data as RawUser[]) ?? []
    const items = rawItems.map(mapUser)
    const meta = body.meta as { total: number; page: number; page_size: number }

    return {
      data: {
        items,
        total: meta.total,
        page: meta.page,
        pageSize: meta.page_size,
        totalPages: Math.ceil(meta.total / meta.page_size),
      },
    }
  },

  /** GET /admin/users/{user_id} */
  async getDetail(id: string): Promise<ApiResponse<UserDetail>> {
    const res = await apiClient.get(`/admin/users/${id}`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = res as any
    const raw = body.data as RawUserDetail

    return {
      data: {
        user: mapUser(raw.user),
        stats: mapStats(raw.stats),
        learningRecords: raw.learning_records.map(mapLearningRecord),
        pointRecords: raw.point_records.map(mapPointRecord),
      },
    }
  },
}
