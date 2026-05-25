import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/api/analytics'
import { DashboardStats } from './DashboardStats'
import { QuickActions } from './QuickActions'
import { RecentOperations } from './RecentOperations'

function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => analyticsApi.getDashboardStats(),
  })

  const { data: recentOps, isLoading: recentLoading } = useQuery({
    queryKey: ['dashboard', 'recent-operations'],
    queryFn: () => analyticsApi.getRecentOperations(),
  })

  return (
    <div className="flex flex-col gap-6">
      <h1 className="m-0 text-[28px] font-bold text-text-primary leading-tight">工作台</h1>

      <DashboardStats data={stats?.data} loading={statsLoading} />

      <h2 className="m-0 text-lg font-semibold text-text-primary">快捷操作</h2>

      <QuickActions />

      <h2 className="m-0 text-lg font-semibold text-text-primary">最近操作</h2>

      <RecentOperations data={recentOps?.data} loading={recentLoading} />
    </div>
  )
}

export default DashboardPage
