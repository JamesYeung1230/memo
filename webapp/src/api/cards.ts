import type { ApiResponse, PaginatedResponse, PaginationMeta } from '@/types/api'
import apiClient from './client'

const DIFFICULTY_MAP: Record<string, string> = {
  beginner: '入门',
  intermediate: '基础',
  advanced: '进阶',
}

export interface AiGeneratedCard {
  title: string
  coreConcept: string
  detail: string
  lifeAnalogy: string
  tags: string[]
  difficulty: '入门' | '基础' | '进阶'
}

export interface AiCardGenerateHistory {
  id: string
  topic: string
  createdAt: string
  adopted: boolean
}

export interface ChapterOption {
  id: string
  name: string
  domainName: string
}

/**
 * Map backend card list item (snake_case) to frontend CardSearchItem.
 * Exported for reuse by ai.ts if needed.
 */
export function mapCardListItem(item: Record<string, unknown>) {
  return {
    id: item.id as string,
    title: item.title as string,
    chapterName: (item.chapter_name as string) ?? '',
    domainName: (item.domain_name as string) ?? '',
    difficulty: DIFFICULTY_MAP[item.difficulty as string] ?? (item.difficulty as string),
  }
}

export const cardApi = {
  /**
   * GET /api/v1/admin/cards — paginated card list with optional keyword search.
   */
  async getList(params: {
    keyword?: string
    page?: number
    pageSize?: number
  }): Promise<ApiResponse<PaginatedResponse<ReturnType<typeof mapCardListItem>>>> {
    const res = await apiClient.get('/admin/cards', {
      params: {
        keyword: params.keyword || undefined,
        page: params.page ?? 1,
        page_size: params.pageSize ?? 20,
      },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = res as any
    const items = ((body.data as Record<string, unknown>[]) ?? []).map(mapCardListItem)
    const meta = body.meta as PaginationMeta

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

  /**
   * GET /api/v1/admin/cards/{id} — single card detail.
   */
  async getDetail(id: string): Promise<ApiResponse<Record<string, unknown>>> {
    const res = await apiClient.get(`/admin/cards/${id}`)
    return { data: res.data as Record<string, unknown> }
  },

  /**
   * POST /api/v1/admin/ai/generate-cards — AI generate cards from existing card IDs.
   * Returns sync results (mode='sync' by default).
   */
  async generateCards(cardIds: string[]): Promise<ApiResponse<AiGeneratedCard[]>> {
    const res = await apiClient.post('/admin/ai/generate-cards', {
      card_ids: cardIds,
      mode: 'sync',
    })

    const data = res.data as Record<string, unknown>
    const results = (data.results as Record<string, unknown>[]) ?? []

    const cards: AiGeneratedCard[] = results.map((r: Record<string, unknown>) => ({
      title: r.title as string,
      coreConcept: r.core_concept as string,
      detail: r.detail as string,
      lifeAnalogy: r.life_analogy as string,
      tags: (r.tags as string[]) ?? [],
      difficulty: (DIFFICULTY_MAP[r.difficulty as string] ?? '入门') as AiGeneratedCard['difficulty'],
    }))

    return { data: cards }
  },

  /**
   * POST /api/v1/admin/ai/generate-cards (async mode) — start async generation.
   * Returns { task_id, status }.
   */
  async generateCardsAsync(cardIds: string[]): Promise<ApiResponse<{ task_id: string; status: string }>> {
    const res = await apiClient.post('/admin/ai/generate-cards', {
      card_ids: cardIds,
      mode: 'async',
    })

    return { data: res.data as { task_id: string; status: string } }
  },

  /**
   * GET /api/v1/admin/ai/generate-cards/{task_id}/result — poll async task result.
   */
  async getGenerateCardsResult(taskId: string): Promise<ApiResponse<AiGeneratedCard[]>> {
    const res = await apiClient.get(`/admin/ai/generate-cards/${taskId}/result`)

    const data = res.data as Record<string, unknown>
    const results = (data.results as Record<string, unknown>[]) ?? []

    const cards: AiGeneratedCard[] = results.map((r: Record<string, unknown>) => ({
      title: r.title as string,
      coreConcept: r.core_concept as string,
      detail: r.detail as string,
      lifeAnalogy: r.life_analogy as string,
      tags: (r.tags as string[]) ?? [],
      difficulty: (DIFFICULTY_MAP[r.difficulty as string] ?? '入门') as AiGeneratedCard['difficulty'],
    }))

    return { data: cards }
  },

  /**
   * GET /api/v1/admin/ai/generation-history — list AI generation history records.
   */
  async getHistory(): Promise<ApiResponse<AiCardGenerateHistory[]>> {
    const res = await apiClient.get('/admin/ai/generation-history')

    const items: AiCardGenerateHistory[] = ((res.data as Record<string, unknown>[]) ?? []).map(
      (item: Record<string, unknown>) => ({
        id: item.id as string,
        topic: item.topic as string,
        createdAt: (item.created_at as string) ?? '',
        adopted: (item.adopted as boolean) ?? false,
      }),
    )

    return { data: items }
  },

  /**
   * GET /api/v1/admin/chapters — list all chapters with domain names.
   */
  async getChapters(): Promise<ApiResponse<ChapterOption[]>> {
    const res = await apiClient.get('/admin/chapters')

    const items: ChapterOption[] = ((res.data as Record<string, unknown>[]) ?? []).map(
      (ch: Record<string, unknown>) => ({
        id: ch.id as string,
        name: ch.name as string,
        domainName: (ch.domain_name as string) ?? '',
      }),
    )

    return { data: items }
  },
}
