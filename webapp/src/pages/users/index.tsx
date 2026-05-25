import { useState, useCallback, memo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, Space, Avatar } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { DataTable } from '@/components/common/DataTable'
import { userApi } from '@/api/users'
import type { UserData } from '@/types/user'
import { formatDate } from '@/utils/format'
import { UserDetailModal } from './detail/index'

interface ActionButtonsProps {
  record: UserData
  onView: (record: UserData) => void
}

const ActionButtons = memo(function ActionButtons({ record, onView }: ActionButtonsProps) {
  return (
    <Space size={0}>
      <Button
        type="link"
        size="small"
        icon={<EyeOutlined />}
        onClick={() => onView(record)}
      >
        查看详情
      </Button>
    </Space>
  )
})

function UsersPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, pageSize, keyword],
    queryFn: () => userApi.getList({ page, pageSize, keyword }),
  })

  const userList = data?.data ?? { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 }

  const handleSearch = useCallback((value: string) => {
    setKeyword(value)
    setPage(1)
  }, [])

  const handlePageChange = useCallback((newPage: number, newPageSize: number) => {
    setPage(newPage)
    setPageSize(newPageSize)
  }, [])

  const handleView = useCallback((record: UserData) => {
    setSelectedUserId(record.id)
  }, [])

  const handleCloseDetail = useCallback(() => {
    setSelectedUserId(null)
  }, [])

  const columns: ColumnsType<UserData> = [
    {
      title: '头像',
      dataIndex: 'avatarUrl',
      key: 'avatarUrl',
      width: 70,
      render: (_: string, record: UserData) => (
        <Avatar
          size={32}
          className="bg-brand-primary text-white text-xs shrink-0"
        >
          {record.nickname.charAt(0)}
        </Avatar>
      ),
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
      width: 160,
      ellipsis: true,
    },
    {
      title: 'OpenID',
      dataIndex: 'openId',
      key: 'openId',
      width: 220,
      ellipsis: true,
    },
    {
      title: '积分余额',
      dataIndex: 'pointsBalance',
      key: 'pointsBalance',
      width: 100,
      sorter: (a, b) => a.pointsBalance - b.pointsBalance,
      render: (points: number) => (
        <span className="font-medium text-[#160C57]">{points.toLocaleString()}</span>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'registerTime',
      key: 'registerTime',
      width: 180,
      render: (time: string) => formatDate(time),
    },
    {
      title: '最近活跃',
      dataIndex: 'lastActiveTime',
      key: 'lastActiveTime',
      width: 180,
      render: (time: string) => formatDate(time),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: UserData) => (
        <ActionButtons record={record} onView={handleView} />
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="m-0 text-[28px] font-bold text-text-primary leading-tight">用户列表</h1>
      </div>

      <DataTable<UserData>
        columns={columns}
        dataSource={userList.items}
        loading={isLoading}
        pagination={{
          current: userList.page,
          pageSize: userList.pageSize,
          total: userList.total,
          onChange: handlePageChange,
        }}
        searchPlaceholder="搜索昵称 / OpenID"
        onSearch={handleSearch}
        rowKey="id"
      />

      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          open={!!selectedUserId}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  )
}

export default UsersPage
