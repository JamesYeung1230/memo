export interface QuestionOption {
  label: string
  content: string
}

export interface QuestionBankData {
  id: string
  question: string
  options: QuestionOption[]
  answer: string
  explanation: string
  cardId: string
  cardTitle: string
  domainId: string
  domainName: string
  enabled: boolean
  createdAt: string
}
