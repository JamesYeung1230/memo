export type Difficulty = 'easy' | 'medium' | 'hard'

export interface CardData {
  id: string
  title: string
  content: string
  chapterId: string
  chapterName: string
  domainId: string
  domainName: string
  difficulty: Difficulty
  enabled: boolean
  createdAt: string
}

export const difficultyLabels: Record<Difficulty, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

export const difficultyColors: Record<Difficulty, string> = {
  easy: 'bg-[#D1FAE5] text-[#065F46]',
  medium: 'bg-[#FEF3C7] text-[#92400E]',
  hard: 'bg-[#FEE2E2] text-[#991B1B]',
}
