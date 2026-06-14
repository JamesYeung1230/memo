import apiClient from './client'
import { ApiResponse } from '@/types/api'
import type { CardSearchItem, AiGeneratedQuestion, OptionItem } from '@/types/question'

const DIFFICULTY_MAP: Record<string, string> = {
  beginner: '入门',
  intermediate: '基础',
  advanced: '进阶',
}

export const aiApi = {
  /**
   * Search knowledge cards — GET /api/v1/admin/cards
   * Backend returns paginated data. We extract the items and map to CardSearchItem.
   */
  async searchCards(keyword: string): Promise<ApiResponse<CardSearchItem[]>> {
    const res = await apiClient.get('/admin/cards', {
      params: {
        keyword: keyword || undefined,
        page: 1,
        page_size: 20,
      },
    })

    const rawData = res.data as Record<string, unknown>[]
    const items: CardSearchItem[] = rawData.map((item: Record<string, unknown>) => ({
      id: item.id as string,
      title: item.title as string,
      chapterName: (item.chapter_name as string) ?? '',
      domainName: (item.domain_name as string) ?? '',
      difficulty: DIFFICULTY_MAP[item.difficulty as string] ?? (item.difficulty as string),
    }))

    return { data: items }
  },

  /**
   * AI generate a question for a card — POST /api/v1/admin/ai/generate-questions/{card_id}
   * Maps backend snake_case fields to frontend AiGeneratedQuestion type.
   */
  async generateQuestion(cardId: string): Promise<ApiResponse<AiGeneratedQuestion>> {
    const res = await apiClient.post(`/admin/ai/generate-questions/${cardId}`, {})

    const data = res.data as Record<string, unknown>
    const options = (data.options as Record<string, string>) ?? {}

    return {
      data: {
        stem: data.question_text as string,
        options: [
          { label: 'A', text: options.A ?? '' },
          { label: 'B', text: options.B ?? '' },
          { label: 'C', text: options.C ?? '' },
          { label: 'D', text: options.D ?? '' },
        ] as [OptionItem, OptionItem, OptionItem, OptionItem],
        correctAnswer: (data.correct_option as 'A' | 'B' | 'C' | 'D') ?? 'A',
        analysis: data.explanation as string,
      },
    }
  },
}
