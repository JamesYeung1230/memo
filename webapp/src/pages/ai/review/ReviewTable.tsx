import { memo } from 'react'
import { Button, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { PendingNote } from '@/types/review'
import { RiskScoreBadge } from '@/components/common/RiskScoreBadge'

interface ReviewTableProps {
  dataSource: PendingNote[]
  loading: boolean
  selectedIds: string[]
  onSelectChange: (ids: string[]) => void
  onReview: (note: PendingNote) => void
}

const columns: ColumnsType<PendingNote> = [
  {
    title: '笔记标题',
    dataIndex: 'noteTitle',
    key: 'noteTitle',
    ellipsis: true,
    width: 340,
  },
  {
    title: '作者',
    dataIndex: 'author',
    key: 'author',
    width: 130,
  },
  {
    title: '提交时间',
    dataIndex: 'submitTime',
    key: 'submitTime',
    width: 160,
  },
  {
    title: 'AI风险评分',
    dataIndex: 'aiRiskScore',
    key: 'aiRiskScore',
    width: 130,
    render: (score: number, record) => <RiskScoreBadge score={score} type={record.aiRiskType} />,
  },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    render: () => (
      <Button type="link" className="text-indigo-500 hover:text-indigo-700" style={{ padding: 0 }}>
        审核
      </Button>
    ),
  },
]

export const ReviewTable = memo(function ReviewTable({
  dataSource,
  loading,
  selectedIds,
  onSelectChange,
  onReview,
}: ReviewTableProps) {
  return (
    <Table<PendingNote>
      rowKey="id"
      columns={columns.map((col) =>
        col.key === 'actions'
          ? {
              ...col,
              render: (_: unknown, record: PendingNote) => (
                <span onClick={() => onReview(record)}>
                  <Button type="link" className="text-indigo-500 hover:text-indigo-700" style={{ padding: 0 }}>
                    审核
                  </Button>
                </span>
              ),
            }
          : col,
      )}
      dataSource={dataSource}
      loading={loading}
      rowSelection={{
        selectedRowKeys: selectedIds,
        onChange: (keys) => onSelectChange(keys as string[]),
      }}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `共 ${total} 条`,
      }}
      locale={{ emptyText: '暂无待审核笔记' }}
    />
  )
})
