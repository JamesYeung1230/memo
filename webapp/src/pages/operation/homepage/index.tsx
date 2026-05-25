import { useState, useCallback } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Table, Button, Space, Image, message, Modal } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { bannerApi } from '@/api/banner'
import type { BannerData } from '@/types/banner'
import { StatusBadge } from '@/components/common/StatusBadge'
import { BannerFormModal } from './BannerFormModal'

function HomepageBannerPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<BannerData | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletingBanner, setDeletingBanner] = useState<BannerData | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['banners'],
    queryFn: () => bannerApi.getList(),
    placeholderData: (prev) => prev,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => bannerApi.toggle(id, enabled),
    onSuccess: () => {
      message.success('操作成功')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bannerApi.delete(id),
    onSuccess: () => {
      message.success('删除成功')
      setDeleteModalOpen(false)
    },
  })

  const saveMutation = useMutation({
    mutationFn: (params: { id?: string; values: Omit<BannerData, 'id' | 'pv' | 'clickPv' | 'clickRate'> }) => {
      if (params.id) {
        return bannerApi.update(params.id, params.values)
      }
      return bannerApi.create(params.values)
    },
    onSuccess: () => {
      message.success('保存成功')
      setModalOpen(false)
      setEditingBanner(null)
    },
  })

  const handleAdd = useCallback(() => {
    setEditingBanner(null)
    setModalOpen(true)
  }, [])

  const handleEdit = useCallback((record: BannerData) => {
    setEditingBanner(record)
    setModalOpen(true)
  }, [])

  const handleDelete = useCallback((record: BannerData) => {
    setDeletingBanner(record)
    setDeleteModalOpen(true)
  }, [])

  const confirmDelete = useCallback(() => {
    if (deletingBanner) {
      deleteMutation.mutate(deletingBanner.id)
    }
  }, [deletingBanner, deleteMutation])

  const handleSave = useCallback(
    (values: Omit<BannerData, 'id' | 'pv' | 'clickPv' | 'clickRate'>) => {
      saveMutation.mutate({ id: editingBanner?.id, values })
    },
    [editingBanner?.id, saveMutation],
  )

  const banners = data?.data ?? []

  const columns: ColumnsType<BannerData> = [
    {
      title: '缩略图',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: '12%',
      render: (url: string) => (
        <Image
          src={url}
          width={80}
          height={45}
          className="rounded object-cover"
          style={{ objectFit: 'cover' }}
          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        />
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: '18%',
      ellipsis: true,
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: '8%',
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: '10%',
      render: (enabled: boolean) => <StatusBadge status={enabled ? 'enabled' : 'disabled'} />,
    },
    {
      title: '曝光(PV)',
      dataIndex: 'pv',
      key: 'pv',
      width: '10%',
      render: (v: number) => v.toLocaleString(),
    },
    {
      title: '点击',
      dataIndex: 'clickPv',
      key: 'clickPv',
      width: '10%',
      render: (v: number) => v.toLocaleString(),
    },
    {
      title: '点击率',
      dataIndex: 'clickRate',
      key: 'clickRate',
      width: '10%',
      render: (v: number) => `${v.toFixed(2)}%`,
    },
    {
      title: '操作',
      key: 'actions',
      width: '16%',
      render: (_: unknown, record: BannerData) => (
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
        <h1 className="m-0 text-[28px] font-bold text-text-primary leading-tight">首页运营(Banner)</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ background: '#160C57' }}>
          新增 Banner
        </Button>
      </div>

      <Table<BannerData>
        rowKey="id"
        columns={columns}
        dataSource={banners}
        loading={isLoading}
        pagination={false}
        locale={{ emptyText: '暂无 Banner 数据' }}
      />

      <BannerFormModal
        open={modalOpen}
        editingBanner={editingBanner}
        onClose={() => { setModalOpen(false); setEditingBanner(null) }}
        onSave={handleSave}
      />

      <Modal
        title="确认删除"
        open={deleteModalOpen}
        width={400}
        onCancel={() => { setDeleteModalOpen(false); setDeletingBanner(null) }}
        onOk={confirmDelete}
        okText="确认删除"
        okButtonProps={{ danger: true }}
        cancelText="取消"
      >
        <p className="text-sm text-gray-600">
          确定删除 Banner「<strong>{deletingBanner?.title}</strong>」？删除后不可恢复。
        </p>
      </Modal>
    </div>
  )
}

export default HomepageBannerPage
