export type MatchMode = 'exact' | 'pinyin' | 'homophone' | 'regex'

export interface SensitiveWordData {
  id: string
  word: string
  match_mode: MatchMode
  enabled: boolean
  created_at: string
  updated_at?: string
}

export const matchModeLabels: Record<MatchMode, string> = {
  exact: '精确',
  pinyin: '拼音',
  homophone: '谐音',
  regex: '正则',
}
