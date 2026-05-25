import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from 'antd'
import {
  ThunderboltOutlined,
  FileAddOutlined,
  SafetyOutlined,
  BarChartOutlined,
} from '@ant-design/icons'

const actions = [
  {
    key: 'ai-cards',
    label: 'AI 生成卡片',
    icon: <ThunderboltOutlined style={{ fontSize: 24, color: '#160C57' }} />,
    path: '/ai/cards',
  },
  {
    key: 'new-card',
    label: '新增卡片',
    icon: <FileAddOutlined style={{ fontSize: 24, color: '#6366F1' }} />,
    path: '/content/cards',
  },
  {
    key: 'review',
    label: '审核队列',
    icon: <SafetyOutlined style={{ fontSize: 24, color: '#10B981' }} />,
    path: '/ai/review',
  },
  {
    key: 'analytics',
    label: '数据看板',
    icon: <BarChartOutlined style={{ fontSize: 24, color: '#F97316' }} />,
    path: '/analytics/overview',
  },
]

export const QuickActions = memo(function QuickActions() {
  const navigate = useNavigate()

  return (
    <div className="grid grid-cols-4 gap-4">
      {actions.map((action) => (
        <Card
          key={action.key}
          hoverable
          className="[&>.ant-card-body]:!p-5"
          onClick={() => navigate(action.path)}
        >
          <div className="flex flex-col items-center justify-center gap-2 h-[68px]">
            {action.icon}
            <span className="text-sm font-medium text-text-primary">{action.label}</span>
          </div>
        </Card>
      ))}
    </div>
  )
})
