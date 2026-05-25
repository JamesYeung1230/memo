import { Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'

interface PageHeaderProps {
  title: string
  onAdd?: () => void
  extra?: React.ReactNode
}

export function PageHeader({ title, onAdd, extra }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="m-0 text-[28px] font-bold text-[#0F172A] leading-tight">{title}</h1>
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
