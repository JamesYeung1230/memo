import { memo } from 'react'
import { Card, Skeleton } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'

interface StatCardProps {
  title: string
  value: number | string
  prefix?: string
  suffix?: string
  trend?: { value: number; isUp: boolean }
  icon?: React.ReactNode
  loading?: boolean
  onClick?: () => void
}

export const StatCard = memo(function StatCard({
  title,
  value,
  prefix,
  suffix,
  trend,
  icon,
  loading,
  onClick,
}: StatCardProps) {
  return (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      className="cursor-pointer [&>.ant-card-body]:!p-4"
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 1 }} />
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#475569]">{title}</span>
            {icon && <span className="text-brand-primary">{icon}</span>}
          </div>
          <div className="flex items-baseline gap-1">
            {prefix && <span className="text-[13px] text-[#475569]">{prefix}</span>}
            <span className="text-[36px] font-bold text-[#0F172A] leading-none">{value}</span>
            {suffix && <span className="text-[13px] text-[#475569]">{suffix}</span>}
          </div>
          {trend && (
            <div className="flex items-center gap-1">
              {trend.isUp ? (
                <ArrowUpOutlined className="text-[#10B981] text-xs" />
              ) : (
                <ArrowDownOutlined className="text-[#EF4444] text-xs" />
              )}
              <span className={trend.isUp ? 'text-[#10B981] text-xs' : 'text-[#EF4444] text-xs'}>
                {trend.value}%
              </span>
              <span className="text-xs text-[#94A3B8]">较昨日</span>
            </div>
          )}
        </div>
      )}
    </Card>
  )
})
