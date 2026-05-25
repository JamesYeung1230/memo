import { useState, useCallback } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Table, Button, Space, message, Modal } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { badgeApi } from '@/api/badges'
import type { BadgeData } from '@/types/badge'
import { StatusBadge } from '@/components/common/StatusBadge'
import { BadgeFormModal } from './BadgeFormModal'

function BadgesPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBadge, setEditingBadge] = useState<BadgeData | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletingBadge, setDeletingBadge] = useState<BadgeData | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['badges'],
    queryFn: () => badgeApi.getList(),
    placeholderData: (prev) => prev,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => badgeApi.toggle(id, enabled),
    onSuccess: () => {
      message.success('操作成功')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => badgeApi.delete(id),
    onSuccess: () => {
      message.success('删除成功')
      setDeleteModalOpen(false)
    },
  })

  const saveMutation = useMutation({
    mutationFn: (params: { id?: string; values: Omit<BadgeData, 'id' | 'redeemCount' | 'createdAt'> }) => {
      if (params.id) {
        return badgeApi.update(params.id, params.values)
      }
      return badgeApi.create(params.values)
    },
    onSuccess: () => {
      message.success('保存成功')
      setModalOpen(false)
      setEditingBadge(null)
    },
  })

  const handleAdd = useCallback(() => {
    setEditingBadge(null)
    setModalOpen(true)
  }, [])

  const handleEdit = useCallback((record: BadgeData) => {
    setEditingBadge(record)
    setModalOpen(true)
  }, [])

  const handleDelete = useCallback((record: BadgeData) => {
    setDeletingBadge(record)
    setDeleteModalOpen(true)
  }, [])

  const confirmDelete = useCallback(() => {
    if (deletingBadge) {
      deleteMutation.mutate(deletingBadge.id)
    }
  }, [deletingBadge, deleteMutation])

  const handleSave = useCallback(
    (values: Omit<BadgeData, 'id' | 'redeemCount' | 'createdAt'>) => {
      saveMutation.mutate({ id: editingBadge?.id, values })
    },
    [editingBadge?.id, saveMutation],
  )

  const badges = data?.data ?? []

  const columns: ColumnsType<BadgeData> = [
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      width: '8%',
      render: (icon: string) => <span className="text-2xl">{icon}</span>,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: '15%',
    },
    {
      title: '获取条件',
      dataIndex: 'description',
      key: 'description',
      width: '25%',
      ellipsis: true,
    },
    {
      title: '兑换积分',
      dataIndex: 'requiredPoints',
      key: 'requiredPoints',
      width: '12%',
      render: (v: number) => (v === 0 ? <span className="text-gray-400">自动获得</span> : v.toLocaleString()),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: '10%',
      render: (enabled: boolean) => <StatusBadge status={enabled ? 'enabled' : 'disabled'} />,
    },
    {
      title: '兑换次数',
      dataIndex: 'redeemCount',
      key: 'redeemCount',
      width: '10%',
      render: (v: number) => v.toLocaleString(),
    },
    {
      title: '操作',
      key: 'actions',
      width: '16%',
      render: (_: unknown, record: BadgeData) => (
        <Space size={0}>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Button
            type="link"
            size="small"
            onClick={() => toggleMutation.mutate({ id: record.id, enabled: !record.enabled })}
          >
            {record.enabled ? '停用' : '启用'}
          </Button>
          <Button type="link" size="small" danger onClick={() => handleDelete(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="m-0 text-[28px] font-bold text-text-primary leading-tight">成就徽章</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ background: '#160C57' }}>
          新增徽章
        </Button>
      </div>

      <Table<BadgeData>
        rowKey="id"
        columns={columns}
        dataSource={badges}
        loading={isLoading}
        pagination={false}
        locale={{ emptyText: '暂无徽章数据' }}
      />

      <BadgeFormModal
        open={modalOpen}
        editingBadge={editingBadge}
        onClose={() => { setModalOpen(false); setEditingBadge(null) }}
        onSave={handleSave}
      />

      <Modal
        title="确认删除"
        open={deleteModalOpen}
        width={400}
        onCancel={() => { setDeleteModalOpen(false); setDeletingBadge(null) }}
        onOk={confirmDelete}
        okText="确认删除"
        okButtonProps={{ danger: true }}
        cancelText="取消"
      >
        <p className="text-sm text-gray-600">
          确定删除徽章「<strong>{deletingBadge?.name}</strong>」？删除后不可恢复。
        </p>
      </Modal>
    </div>
  )
}

export default BadgesPage
