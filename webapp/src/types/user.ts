export interface UserData {
  id: string
  nickname: string
  avatarUrl: string
  openId: string
  pointsBalance: number
  registerTime: string
  lastActiveTime: string
}

export interface UserLearningRecord {
  id: string
  cardTitle: string
  learnedAt: string
}

export interface UserPointRecord {
  id: string
  changeAmount: number
  reason: string
  createdAt: string
}

export interface UserStats {
  cardCount: number
  answerCount: number
  pointsBalance: number
  noteCount: number
}

export interface UserDetail {
  user: UserData
  stats: UserStats
  learningRecords: UserLearningRecord[]
  pointRecords: UserPointRecord[]
}
