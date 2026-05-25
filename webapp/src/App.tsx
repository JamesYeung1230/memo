import { useEffect } from 'react'
import { ConfigProvider, App as AntApp, theme } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { useThemeStore } from '@/stores/themeStore'
import { antdTheme } from '@/styles/antd-theme'
import { router } from '@/routes'
import zhCN from 'antd/locale/zh_CN'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  const mode = useThemeStore((s) => s.mode)

  useEffect(() => {
    document.documentElement.dataset.theme = mode
  }, [mode])

  return (
    <ErrorBoundary>
      <ConfigProvider
        theme={{
          ...antdTheme,
          algorithm: mode === 'dark' ? theme.darkAlgorithm : undefined,
        }}
        locale={zhCN}
      >
        <AntApp>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
          </QueryClientProvider>
        </AntApp>
      </ConfigProvider>
    </ErrorBoundary>
  )
}
