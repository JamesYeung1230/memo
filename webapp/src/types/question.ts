/** 题目实体 */
export interface QuestionData {
  id: string
  cardId: string
  cardTitle: string
  domainName: string
  stem: string
  options: [OptionItem, OptionItem, OptionItem, OptionItem]
  correctAnswer: 'A' | 'B' | 'C' | 'D'
  analysis: string
  status: 'enabled' | 'disabled'
  createdAt: string
}

export interface OptionItem {
  label: 'A' | 'B' | 'C' | 'D'
  text: string
}

/** AI 卡片搜索项 */
export interface CardSearchItem {
  id: string
  title: string
  chapterName: string
  domainName: string
  difficulty: string
}

/** AI 生成的题目结果 */
export interface AiGeneratedQuestion {
  stem: string
  options: [OptionItem, OptionItem, OptionItem, OptionItem]
  correctAnswer: 'A' | 'B' | 'C' | 'D'
  analysis: string
}
