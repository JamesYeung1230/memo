import { Card, Skeleton } from 'antd'

interface LoadingSkeletonProps {
  type?: 'table' | 'card' | 'detail'
}

export function LoadingSkeleton({ type = 'table' }: LoadingSkeletonProps) {
  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <Skeleton active paragraph={{ rows: 2 }} />
          </Card>
        ))}
      </div>
    )
  }

  if (type === 'detail') {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    )
  }

  return (
    <Card>
      <Skeleton active paragraph={{ rows: 8 }} />
    </Card>
  )
}
