import { useState, useCallback, memo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Select, DatePicker } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { DataTable } from '@/components/common/DataTable'
import { logApi } from '@/api/logs'
import type { OperationLog } from '@/types/log'
import { actionTypeOptions, actionTypeLabels } from '@/types/log'
import { formatDate } from '@/utils/format'

const { RangePicker } = DatePicker

const actionTypeColors: Record<string, string> = {
  create: 'bg-[#D1FAE5] text-[#065F46]',
  update: 'bg-[#DBEAFE] text-[#1E40AF]',
  delete: 'bg-[#FEE2E2] text-[#991B1B]',
  login: 'bg-[#F3E8FF] text-[#6B21A8]',
  export: 'bg-[#FEF3C7] text-[#92400E]',
}

interface ActionTypeTagProps {
  actionType: string
}

const ActionTypeTag = memo(function ActionTypeTag({ actionType }: ActionTypeTagProps) {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${actionTypeColors[actionType] || 'bg-[#F1F5F9] text-[#475569]'}`}
    >
      {actionTypeLabels[actionType] || actionType}
    </span>
  )
})

function LogsPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [actionType, setActionType] = useState<string | undefined>()
  const [timeRange, setTimeRange] = useState<[string, string] | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['logs', page, pageSize, actionType, timeRange],
    queryFn: () =>
      logApi.getList({
        page,
        pageSize,
        actionType,
        startTime: timeRange?.[0],
        endTime: timeRange?.[1],
      }),
  })

  const logList = data?.data ?? { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 }

  const handlePageChange = useCallback((newPage: number, newPageSize: number) => {
    setPage(newPage)
    setPageSize(newPageSize)
  }, [])

  const handleActionTypeChange = useCallback((value: string | undefined) => {
    setActionType(value)
    setPage(1)
  }, [])

  const handleTimeRangeChange = useCallback(
    (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
      if (dates && dates[0] && dates[1]) {
        setTimeRange([
          dates[0].format('YYYY-MM-DD 00:00:00'),
          dates[1].format('YYYY-MM-DD 23:59:59'),
        ])
      } else {
        setTimeRange(null)
      }
      setPage(1)
    },
    [],
  )

  const columns: ColumnsType<OperationLog> = [
    {
      title: '操作时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (time: string) => formatDate(time),
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      width: 120,
    },
    {
      title: '操作类型',
      dataIndex: 'action_type',
      key: 'action_type',
      width: 100,
      render: (type: string) => <ActionTypeTag actionType={type} />,
    },
    {
      title: '操作对象',
      dataIndex: 'target_type',
      key: 'target_type',
      width: 160,
      ellipsis: true,
    },
    {
      title: '详情',
      dataIndex: 'detail',
      key: 'detail',
      ellipsis: true,
      render: (detail: Record<string, unknown> | null) =>
        detail ? JSON.stringify(detail) : '-',
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="m-0 text-[28px] font-bold text-text-primary leading-tight">操作日志</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#475569] shrink-0">操作类型：</span>
          <Select
            placeholder="全部类型"
            allowClear
            className="w-36"
            value={actionType}
            onChange={handleActionTypeChange}
            options={actionTypeOptions}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#475569] shrink-0">时间范围：</span>
          <RangePicker
            onChange={handleTimeRangeChange}
            className="w-64"
          />
        </div>
      </div>

      <DataTable<OperationLog>
        columns={columns}
        dataSource={logList.items}
        loading={isLoading}
        pagination={{
          current: logList.page,
          pageSize: logList.pageSize,
          total: logList.total,
          onChange: handlePageChange,
        }}
        rowKey="id"
      />
    </div>
  )
}

export default LogsPage
