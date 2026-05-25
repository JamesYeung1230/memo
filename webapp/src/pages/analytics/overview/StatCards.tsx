import { memo } from 'react'
import { Card, Skeleton } from 'antd'
import { CaretUpOutlined, CaretDownOutlined } from '@ant-design/icons'
import type { OverviewStats } from '@/types/analytics'

interface StatCardsProps {
  data?: OverviewStats
  loading: boolean
}

interface CardConfig {
  key: keyof OverviewStats
  label: string
  prefix?: string
  suffix?: string
  precision?: number
  trend?: number
}

const statCards: CardConfig[] = [
  { key: 'totalUsers', label: '累计用户数', trend: 12.5 },
  { key: 'todayDau', label: '今日DAU', trend: -3.2 },
  { key: 'todayCards', label: '今日学习卡片数', trend: 8.7 },
  { key: 'todayQuestions', label: '今日答题数', trend: 5.1 },
  { key: 'todayPointsIssued', label: '今日积分发放', prefix: '¥', trend: 2.4 },
  { key: 'todayPointsConsumed', label: '今日积分消耗', prefix: '¥', trend: -1.8 },
  { key: 'retention7d', label: '7日留存率', suffix: '%', precision: 1, trend: 0.6 },
]

function formatValue(value: number, config: CardConfig): string {
  const v = config.precision != null ? value.toFixed(config.precision) : Math.round(value).toLocaleString()
  return `${config.prefix ?? ''}${v}${config.suffix ?? ''}`
}

export const StatCards = memo(function StatCards({ data, loading }: StatCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
      {statCards.map((card) => {
        const value = data?.[card.key]
        const trend = card.trend
        const isUp = trend != null && trend >= 0

        return (
          <Card key={card.key} className="[&>.ant-card-body]:!p-4" size="small">
            {loading ? (
              <Skeleton active paragraph={{ rows: 1 }} title={{ width: '60%' }} />
            ) : (
              <div className="flex flex-col gap-2">
                <span className="text-[12px] font-medium text-text-secondary truncate">
                  {card.label}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-[26px] font-bold leading-none text-text-primary">
                    {value != null ? formatValue(value, card) : '-'}
                  </span>
                  {trend != null && (
                    <span
                      className={`flex items-center text-[12px] font-medium ${
                        isUp ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {isUp ? (
                        <CaretUpOutlined className="text-[10px]" />
                      ) : (
                        <CaretDownOutlined className="text-[10px]" />
                      )}
                      {Math.abs(trend)}%
                    </span>
                  )}
                </div>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
})
