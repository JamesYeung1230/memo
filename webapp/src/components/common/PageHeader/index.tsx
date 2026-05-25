import { Button, Typography } from 'antd'
import { PlusOutlined } from '@ant-design/icons'

const { Title } = Typography

interface PageHeaderProps {
  title: string
  onAdd?: () => void
  extra?: React.ReactNode
}

export function PageHeader({ title, onAdd, extra }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <Title level={4} style={{ margin: 0 }}>{title}</Title>
      <div className="flex items-center gap-2">
        {extra}
        {onAdd && (
          <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
            新建
          </Button>
        )}
      </div>
    </div>
  )
}
