import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Skeleton } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { RecentOperation } from '@/api/analytics'

interface RecentOperationsProps {
  data?: RecentOperation[]
  loading: boolean
}

const columns: ColumnsType<RecentOperation> = [
  {
    title: '操作类型',
    dataIndex: 'action',
    key: 'action',
    width: 120,
  },
  {
    title: '操作对象',
    dataIndex: 'target',
    key: 'target',
  },
  {
    title: '操作时间',
    dataIndex: 'time',
    key: 'time',
    width: 180,
  },
]

export const RecentOperations = memo(function RecentOperations({
  data,
  loading,
}: RecentOperationsProps) {
  const navigate = useNavigate()

  return (
    <div>
      {loading ? (
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : (
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={false}
          className="[&_.ant-table-thead>tr>th]:bg-bg-page [&_.ant-table-thead>tr>th]:text-sm [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:text-text-secondary [&_.ant-table-thead>tr>th]:h-11 [&_.ant-table-tbody>tr>td]:h-11 [&_.ant-table-tbody>tr>td]:px-4 [&_.ant-table-container]:!rounded-lg [&_.ant-table-container]:overflow-hidden"
        />
      )}
      <div
        className="flex items-center justify-center h-11 text-sm font-medium text-secondary cursor-pointer select-none hover:text-brand-primary-light transition-colors"
        onClick={() => navigate('/system/logs')}
      >
        查看全部 →
      </div>
    </div>
  )
})
