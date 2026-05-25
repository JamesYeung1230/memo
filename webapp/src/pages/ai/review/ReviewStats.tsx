import { memo } from 'react'
import type { ReviewStats as Stats } from '@/types/review'

interface ReviewStatsProps {
  data: Stats | undefined
  loading: boolean
}

const statItems = [
  { key: 'pendingCount' as const, label: '今日待审核', suffix: '条' },
  { key: 'todayReviewed' as const, label: '今日已审核', suffix: '条' },
  { key: 'passRate7d' as const, label: '近7日通过率', suffix: '%' },
  { key: 'aiAccuracy' as const, label: 'AI准确率参考', suffix: '%' },
] as const

export const ReviewStats = memo(function ReviewStats({ data, loading }: ReviewStatsProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {statItems.map((item) => (
        <div key={item.key} className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-xs text-gray-500 mb-1">{item.label}</div>
          {loading ? (
            <div className="h-8 w-20 bg-gray-100 rounded animate-pulse" />
          ) : (
            <div className="text-2xl font-bold text-gray-900">
              {data?.[item.key] ?? '-'}
              <span className="text-xs font-normal text-gray-400 ml-0.5">{item.suffix}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
})
