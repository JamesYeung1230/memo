import { useState, useCallback } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Tabs, message } from 'antd'
import { reviewApi } from '@/api/review'
import type { PendingNote } from '@/types/review'
import { ReviewStats } from './ReviewStats'
import { ReviewTable } from './ReviewTable'
import { ReviewRecords } from './ReviewRecords'
import { ReviewDetailModal } from './ReviewDetailModal'
import { BatchActionBar } from './BatchActionBar'

function AiReviewPage() {
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [reviewingNote, setReviewingNote] = useState<PendingNote | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['review', 'stats'],
    queryFn: () => reviewApi.getStats(),
  })

  const { data: pendingList, isLoading: pendingLoading } = useQuery({
    queryKey: ['review', 'pending'],
    queryFn: () => reviewApi.getPendingList(),
  })

  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ['review', 'records', statusFilter],
    queryFn: () => reviewApi.getReviewRecords(statusFilter),
    enabled: activeTab === 'records',
  })

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['review', 'detail', reviewingNote?.id],
    queryFn: () => reviewApi.getReviewDetail(reviewingNote?.id ?? ''),
    enabled: !!reviewingNote,
  })

  const batchMutation = useMutation({
    mutationFn: reviewApi.batchReview,
    onSuccess: () => {
      message.success('操作成功')
      setSelectedIds([])
    },
  })

  const handleReview = useCallback((note: PendingNote) => {
    setReviewingNote(note)
    setDetailOpen(true)
  }, [])

  const handleApprove = useCallback(() => {
    message.success('审核通过')
    setDetailOpen(false)
    setReviewingNote(null)
  }, [])

  const handleReject = useCallback(() => {
    message.success('已驳回')
    setDetailOpen(false)
    setReviewingNote(null)
  }, [])

  const handleBatchApprove = useCallback(() => {
    if (selectedIds.length > 0) {
      batchMutation.mutate({ ids: selectedIds, action: 'approve' })
    }
  }, [selectedIds, batchMutation])

  const handleBatchReject = useCallback(
    (reason: string) => {
      if (selectedIds.length > 0) {
        batchMutation.mutate({ ids: selectedIds, action: 'reject', reason })
      }
    },
    [selectedIds, batchMutation],
  )

  return (
    <div className="flex flex-col gap-6">
      <h1 className="m-0 text-[28px] font-bold text-text-primary leading-tight">笔记审核</h1>

      <ReviewStats data={stats?.data} loading={statsLoading} />

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
        items={[
          {
            key: 'pending',
            label: '待审核',
            children: (
              <div className="flex flex-col gap-4">
                <BatchActionBar
                  selectedCount={selectedIds.length}
                  onApprove={handleBatchApprove}
                  onReject={handleBatchReject}
                  onClear={() => setSelectedIds([])}
                />
                <ReviewTable
                  dataSource={pendingList?.data ?? []}
                  loading={pendingLoading}
                  selectedIds={selectedIds}
                  onSelectChange={setSelectedIds}
                  onReview={handleReview}
                />
              </div>
            ),
          },
          {
            key: 'records',
            label: '审核记录',
            children: (
              <ReviewRecords
                dataSource={recordsData?.data ?? []}
                loading={recordsLoading}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
              />
            ),
          },
        ]}
      />

      <ReviewDetailModal
        open={detailOpen}
        note={reviewingNote}
        detail={detailData?.data ?? null}
        loading={detailLoading}
        onApprove={handleApprove}
        onReject={handleReject}
        onClose={() => {
          setDetailOpen(false)
          setReviewingNote(null)
        }}
      />
    </div>
  )
}

export default AiReviewPage
