import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import { AdminLayout } from '@/layouts/AdminLayout'
import { AuthGuard } from './AuthGuard'
import { ROUTE_PATHS } from './routePaths'

import LoginPage from '@/pages/login'

const DashboardPage = lazy(() => import('@/pages/dashboard'))
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
      ],
    }],
  },
  {
    path: '*',
    element: <LazyPage><NotFoundPage /></LazyPage>,
  },
])
