import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { ROUTE_PATHS } from './routePaths'

export function AuthGuard() {
  const [ready, setReady] = useState(false)
  const token = useAuthStore((s) => s.token)

  // Zustand persist 是异步恢复的，等待 rehydrate 完成后再做判断
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setReady(true)
    })
    // 如果已经完成恢复，立即标记 ready
    if (useAuthStore.persist.hasHydrated()) {
      setReady(true)
    }
    return () => unsub()
  }, [])

  if (!ready) {
    return null // 或返回一个 loading spinner
  }

  if (!token) {
    return <Navigate to={ROUTE_PATHS.LOGIN} replace />
  }

  return <Outlet />
}
