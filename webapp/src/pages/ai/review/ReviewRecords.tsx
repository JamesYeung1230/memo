import { memo } from 'react'
import { Select, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { ReviewRecord } from '@/types/review'
import { StatusBadge } from '@/components/common/StatusBadge'

interface ReviewRecordsProps {
  dataSource: ReviewRecord[]
  loading: boolean
  statusFilter: string
  onStatusFilterChange: (status: string) => void
  pagination: {
    current: number
    pageSize: number
    total: number
    onChange: (page: number, pageSize: number) => void
  }
}

const columns: ColumnsType<ReviewRecord> = [
  { title: '笔记标题', dataIndex: 'noteTitle', key: 'noteTitle', ellipsis: true, width: 340 },
  { title: '作者', dataIndex: 'author', key: 'author', width: 130 },
  { title: '提交时间', dataIndex: 'submitTime', key: 'submitTime', width: 160 },
  {
    title: '审核状态',
    dataIndex: 'reviewStatus',
    key: 'reviewStatus',
    width: 110,
    render: (status: string) => <StatusBadge status={status} />,
  },
  { title: '审核人', dataIndex: 'reviewer', key: 'reviewer', width: 100 },
  { title: '审核时间', dataIndex: 'reviewTime', key: 'reviewTime', width: 160 },
]

export const ReviewRecords = memo(function ReviewRecords({
  dataSource,
  loading,
  statusFilter,
  onStatusFilterChange,
  pagination,
}: ReviewRecordsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">审核状态：</span>
        <Select
          value={statusFilter}
          onChange={onStatusFilterChange}
          className="w-32"
          options={[
            { value: 'all', label: '全部' },
            { value: 'approved', label: '已通过' },
            { value: 'rejected', label: '已驳回' },
            { value: 'auto_rejected', label: '自动驳回' },
          ]}
        />
      </div>

      <Table<ReviewRecord>
        rowKey="id"
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: pagination.onChange,
        }}
        locale={{ emptyText: '暂无审核记录' }}
      />
    </div>
  )
})
