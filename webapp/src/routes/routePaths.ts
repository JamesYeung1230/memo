export const ROUTE_PATHS = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',

  AI_CARDS: '/ai/cards',
  AI_QUESTIONS: '/ai/questions',
  AI_REVIEW: '/ai/review',
  AI_SENSITIVE_WORDS: '/ai/sensitive-words',

  CONTENT_DOMAINS: '/content/domains',
  CONTENT_CHAPTERS: '/content/domains/:id/chapters',
  CONTENT_CARDS: '/content/chapters/:id/cards',
  CONTENT_QUESTIONS: '/content/questions',

  OPERATION_POINTS: '/operation/points',
  OPERATION_UNLOCK: '/operation/unlock',
  OPERATION_HOMEPAGE: '/operation/homepage',
  OPERATION_ADS: '/operation/ads',
  OPERATION_BADGES: '/operation/badges',
  OPERATION_REVIEW: '/operation/review',

  ANALYTICS_OVERVIEW: '/analytics/overview',
  ANALYTICS_CONTENT: '/analytics/content',
  ANALYTICS_USERS: '/analytics/users',
  ANALYTICS_REVENUE: '/analytics/revenue',

  USERS: '/users',
  USER_DETAIL: '/users/:id',

  SYSTEM_PASSWORD: '/system/password',
  SYSTEM_LOGS: '/system/logs',
} as const
