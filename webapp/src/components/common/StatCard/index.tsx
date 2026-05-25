import { memo } from 'react'
import { Card, Skeleton, Typography } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'

const { Text, Title } = Typography

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
      className="cursor-pointer"
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 1 }} />
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Text type="secondary" className="text-sm">{title}</Text>
            {icon && <span className="text-brand-primary">{icon}</span>}
          </div>
          <div className="flex items-baseline gap-1">
            {prefix && <Text type="secondary" className="text-sm">{prefix}</Text>}
            <Title level={3} style={{ margin: 0 }}>{value}</Title>
            {suffix && <Text type="secondary" className="text-sm">{suffix}</Text>}
          </div>
          {trend && (
            <div className="flex items-center gap-1">
              {trend.isUp ? (
                <ArrowUpOutlined className="text-success text-xs" />
              ) : (
                <ArrowDownOutlined className="text-danger text-xs" />
              )}
              <Text className={trend.isUp ? 'text-success text-xs' : 'text-danger text-xs'}>
                {trend.value}%
              </Text>
              <Text type="secondary" className="text-xs">较昨日</Text>
            </div>
          )}
        </div>
      )}
    </Card>
  )
})
