import { memo } from 'react'
import { Card, Skeleton } from 'antd'
import { DashboardStats as StatsData } from '@/api/analytics'

interface DashboardStatsProps {
  data?: StatsData
  loading: boolean
}

const statCards = [
  {
    key: 'pendingReview' as const,
    title: '今日待审核',
    valueColor: 'text-brand-primary',
  },
  {
    key: 'totalCards' as const,
    title: '总卡片数',
    valueColor: 'text-secondary',
  },
  {
    key: 'totalUsers' as const,
    title: '总用户数',
    valueColor: 'text-cta',
  },
  {
    key: 'activeUsers7d' as const,
    title: '7日活跃',
    valueColor: 'text-success',
  },
]

export const DashboardStats = memo(function DashboardStats({
  data,
  loading,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {statCards.map((card) => (
        <Card key={card.key} className="[&>.ant-card-body]:!p-5">
          {loading ? (
            <Skeleton active paragraph={{ rows: 1 }} />
          ) : (
            <div className="flex flex-col gap-3">
              <span className="text-[13px] font-medium text-text-secondary">
                {card.title}
              </span>
              <span className={`text-[32px] font-bold leading-none ${card.valueColor}`}>
                {data?.[card.key]?.toLocaleString() ?? '-'}
              </span>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
})
