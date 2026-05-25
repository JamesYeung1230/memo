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
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 h-12 px-5">
          <div className="h-4 w-4 rounded animate-pulse bg-gray-200" />
          <div className="h-3 flex-1 rounded animate-pulse bg-gray-200" />
          <div className="h-3 w-24 rounded animate-pulse bg-gray-200" />
          <div className="h-3 w-20 rounded animate-pulse bg-gray-200" />
          <div className="h-6 w-16 rounded-full animate-pulse bg-gray-200" />
          <div className="h-3 w-24 rounded animate-pulse bg-gray-200" />
        </div>
      ))}
    </div>
  )
}
