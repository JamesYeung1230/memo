export const MAX_BANNER_COUNT = 5

export const MATCH_MODE = {
  EXACT: 'exact',
  PINYIN: 'pinyin',
  HOMOPHONE: 'homophone',
  REGEX: 'regex',
} as const

export const DIFFICULTY_LEVEL = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
} as const

export const STATUS_MAP = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DRAFT: 'draft',
  REVIEWING: 'reviewing',
} as const
