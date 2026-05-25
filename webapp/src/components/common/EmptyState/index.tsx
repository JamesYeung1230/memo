import { Button, Empty } from 'antd'

interface EmptyStateProps {
  description: string
  actionText?: string
  onAction?: () => void
}

export function EmptyState({ description, actionText, onAction }: EmptyStateProps) {
  return (
    <Empty
      description={description}
      className="py-16"
    >
      {actionText && onAction && (
        <Button type="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </Empty>
  )
}
