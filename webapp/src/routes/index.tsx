import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import { AdminLayout } from '@/layouts/AdminLayout'
import { AuthGuard } from './AuthGuard'
import { ROUTE_PATHS } from './routePaths'

import LoginPage from '@/pages/login'

const DashboardPage = lazy(() => import('@/pages/dashboard'))
const AiQuestionsPage = lazy(() => import('@/pages/ai/questions'))
const AiReviewPage = lazy(() => import('@/pages/ai/review'))
const SensitiveWordsPage = lazy(() => import('@/pages/ai/sensitive-words'))
const AiCardsPage = lazy(() => import('@/pages/ai/cards'))
const DomainsPage = lazy(() => import('@/pages/content/domains'))
const ChaptersPage = lazy(() => import('@/pages/content/chapters'))
const CardsPage = lazy(() => import('@/pages/content/cards'))
const QuestionsPage = lazy(() => import('@/pages/content/questions'))
const PointsPage = lazy(() => import('@/pages/operation/points'))
const UnlockPage = lazy(() => import('@/pages/operation/unlock'))
const HomepageBannerPage = lazy(() => import('@/pages/operation/homepage'))
const BadgesPage = lazy(() => import('@/pages/operation/badges'))
const AdsConfigPage = lazy(() => import('@/pages/operation/ads-config'))
const ReviewConfigPage = lazy(() => import('@/pages/operation/review'))
const AnalyticsOverviewPage = lazy(() => import('@/pages/analytics/overview'))
const UsersPage = lazy(() => import('@/pages/users'))
const UserDetailPage = lazy(() => import('@/pages/users/detail/UserDetailPage'))
const PasswordPage = lazy(() => import('@/pages/system/password'))
const LogsPage = lazy(() => import('@/pages/system/logs'))
const NotFoundPage = lazy(() => import('@/pages/not-found'))

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Spin size="large" className="flex justify-center mt-32" />}>{children}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: ROUTE_PATHS.LOGIN,
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AuthGuard />,
    children: [{
      element: <AdminLayout />,
      children: [
        { index: true, element: <Navigate to={ROUTE_PATHS.DASHBOARD} replace /> },
        {
          path: ROUTE_PATHS.DASHBOARD,
          element: <LazyPage><DashboardPage /></LazyPage>,
        },
        {
          path: ROUTE_PATHS.AI_QUESTIONS,
          element: <LazyPage><AiQuestionsPage /></LazyPage>,
        },
        {
          path: ROUTE_PATHS.AI_REVIEW,
          element: <LazyPage><AiReviewPage /></LazyPage>,
        },
        {
          path: ROUTE_PATHS.AI_SENSITIVE_WORDS,
          element: <LazyPage><SensitiveWordsPage /></LazyPage>,
        },
        {
          path: ROUTE_PATHS.AI_CARDS,
          element: <LazyPage><AiCardsPage /></LazyPage>,
        },
        {
          path: ROUTE_PATHS.CONTENT_DOMAINS,
          element: <LazyPage><DomainsPage /></LazyPage>,
        },
        {
          path: ROUTE_PATHS.CONTENT_CHAPTERS,
          element: <LazyPage><ChaptersPage /></LazyPage>,
        },
        {
          path: ROUTE_PATHS.CONTENT_CARDS,
          element: <LazyPage><CardsPage /></LazyPage>,
        },
        {
          path: ROUTE_PATHS.CONTENT_QUESTIONS,
          element: <LazyPage><QuestionsPage /></LazyPage>,
        },
        {
          path: ROUTE_PATHS.OPERATION_POINTS,
          element: <LazyPage><PointsPage /></LazyPage>,
        },
        {
          path: ROUTE_PATHS.OPERATION_UNLOCK,
          element: <LazyPage><UnlockPage /></LazyPage>,
        },
        {
          path: ROUTE_PATHS.OPERATION_HOMEPAGE,
          element: <LazyPage><HomepageBannerPage /></LazyPage>,
        },
        {
          path: ROUTE_PATHS.OPERATION_BADGES,
          element: <LazyPage><BadgesPage /></LazyPage>,
        },
        {
          path: ROUTE_PATHS.OPERATION_ADS,
          element: <LazyPage><AdsConfigPage /></LazyPage>,
        },
        {
          path: ROUTE_PATHS.OPERATION_REVIEW,
          element: <LazyPage><ReviewConfigPage /></LazyPage>,
        },
        {
          path: ROUTE_PATHS.ANALYTICS_OVERVIEW,
          element: <LazyPage><AnalyticsOverviewPage /></LazyPage>,
        },
        // 数据看板子页面 — 重定向到统一Tab版首页
        { path: '/analytics/content', element: <Navigate to={ROUTE_PATHS.ANALYTICS_OVERVIEW} replace /> },
        { path: '/analytics/users', element: <Navigate to={ROUTE_PATHS.ANALYTICS_OVERVIEW} replace /> },
        { path: '/analytics/revenue', element: <Navigate to={ROUTE_PATHS.ANALYTICS_OVERVIEW} replace /> },
        {
          path: ROUTE_PATHS.USERS,
          element: <LazyPage><UsersPage /></LazyPage>,
        },
        {
          path: ROUTE_PATHS.USER_DETAIL,
          element: <LazyPage><UserDetailPage /></LazyPage>,
        },
        {
          path: ROUTE_PATHS.SYSTEM_PASSWORD,
          element: <LazyPage><PasswordPage /></LazyPage>,
        },
        {
          path: ROUTE_PATHS.SYSTEM_LOGS,
          element: <LazyPage><LogsPage /></LazyPage>,
        },
      ],
    }],
  },
  {
    path: '*',
    element: <LazyPage><NotFoundPage /></LazyPage>,
  },
])
