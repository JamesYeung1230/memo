import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

  // Pagination state
  const [queuePage, setQueuePage] = useState(1)
  const [queuePageSize, setQueuePageSize] = useState(10)
  const [recordsPage, setRecordsPage] = useState(1)
  const [recordsPageSize, setRecordsPageSize] = useState(10)

  const queryClient = useQueryClient()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['review', 'stats'],
    queryFn: () => reviewApi.getStats(),
  })

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['review', 'pending', queuePage, queuePageSize],
    queryFn: () => reviewApi.getPendingList({ page: queuePage, pageSize: queuePageSize }),
  })

  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ['review', 'records', recordsPage, recordsPageSize, statusFilter],
    queryFn: () =>
      reviewApi.getReviewRecords({
        page: recordsPage,
        pageSize: recordsPageSize,
        status: statusFilter,
      }),
    enabled: activeTab === 'records',
  })

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['review', 'detail', reviewingNote?.id],
    queryFn: () => reviewApi.getReviewDetail(reviewingNote?.id ?? ''),
    enabled: !!reviewingNote,
  })

  const approveMutation = useMutation({
    mutationFn: (ids: string[]) => reviewApi.batchApprove(ids),
    onSuccess: () => {
      message.success('批量通过成功')
      setSelectedIds([])
      queryClient.invalidateQueries({ queryKey: ['review', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['review', 'stats'] })
    },
    onError: (err: Error) => {
      message.error(err.message || '操作失败')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (params: { ids: string[]; reason: string }) =>
      reviewApi.batchReject({ noteIds: params.ids, reason: params.reason }),
    onSuccess: () => {
      message.success('批量驳回成功')
      setSelectedIds([])
      queryClient.invalidateQueries({ queryKey: ['review', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['review', 'stats'] })
    },
    onError: (err: Error) => {
      message.error(err.message || '操作失败')
    },
  })

  const handleReview = useCallback((note: PendingNote) => {
    setReviewingNote(note)
    setDetailOpen(true)
  }, [])

  const handleApprove = useCallback(async () => {
    if (!reviewingNote) return
    try {
      await reviewApi.batchApprove([reviewingNote.id])
      message.success('审核通过')
      setDetailOpen(false)
      setReviewingNote(null)
      queryClient.invalidateQueries({ queryKey: ['review'] })
    } catch (err) {
      message.error((err as Error).message || '操作失败')
    }
  }, [reviewingNote, queryClient])

  const handleReject = useCallback(async () => {
    if (!reviewingNote) return
    try {
      await reviewApi.batchReject({ noteIds: [reviewingNote.id], reason: '管理员驳回' })
      message.success('已驳回')
      setDetailOpen(false)
      setReviewingNote(null)
      queryClient.invalidateQueries({ queryKey: ['review'] })
    } catch (err) {
      message.error((err as Error).message || '操作失败')
    }
  }, [reviewingNote, queryClient])

  const handleBatchApprove = useCallback(() => {
    if (selectedIds.length > 0) {
      approveMutation.mutate(selectedIds)
    }
  }, [selectedIds, approveMutation])

  const handleBatchReject = useCallback(
    (reason: string) => {
      if (selectedIds.length > 0) {
        rejectMutation.mutate({ ids: selectedIds, reason })
      }
    },
    [selectedIds, rejectMutation],
  )

  const handleQueuePageChange = useCallback((newPage: number, newPageSize: number) => {
    setQueuePage(newPage)
    setQueuePageSize(newPageSize)
  }, [])

  const handleRecordsPageChange = useCallback((newPage: number, newPageSize: number) => {
    setRecordsPage(newPage)
    setRecordsPageSize(newPageSize)
  }, [])

  const handleStatusFilterChange = useCallback((status: string) => {
    setStatusFilter(status)
    setRecordsPage(1)
  }, [])

  const pendingList = pendingData?.data ?? { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 }
  const recordsList = recordsData?.data ?? { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="m-0 text-[28px] font-bold text-text-primary leading-tight">笔记审核</h1>

      <ReviewStats data={stats?.data} loading={statsLoading} />

      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key)
          setSelectedIds([])
        }}
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
                  dataSource={pendingList.items}
                  loading={pendingLoading}
                  selectedIds={selectedIds}
                  onSelectChange={setSelectedIds}
                  onReview={handleReview}
                  pagination={{
                    current: pendingList.page,
                    pageSize: pendingList.pageSize,
                    total: pendingList.total,
                    onChange: handleQueuePageChange,
                  }}
                />
              </div>
            ),
          },
          {
            key: 'records',
            label: '审核记录',
            children: (
              <ReviewRecords
                dataSource={recordsList.items}
                loading={recordsLoading}
                statusFilter={statusFilter}
                onStatusFilterChange={handleStatusFilterChange}
                pagination={{
                  current: recordsList.page,
                  pageSize: recordsList.pageSize,
                  total: recordsList.total,
                  onChange: handleRecordsPageChange,
                }}
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
