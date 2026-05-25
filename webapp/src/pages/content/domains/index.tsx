import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Table, Space, message } from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { DragEndEvent } from '@dnd-kit/core'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { domainApi } from '@/api/domains'
import type { DomainData } from '@/types/domain'
import { StatusBadge } from '@/components/common/StatusBadge'
import { DomainFormModal } from './DomainFormModal'
import { DomainDeleteConfirm } from './DomainDeleteConfirm'

interface SortableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  'data-row-key': string
}

function SortableRow({ 'data-row-key': rowKey, ...rest }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: rowKey })
  const style: React.CSSProperties = {
    ...rest.style,
    transform: CSS.Transform.toString(transform && { ...transform, scaleY: 1 }),
    transition,
    ...(isDragging ? { position: 'relative', zIndex: 9999, background: '#FAFAFA' } : {}),
  }

  return (
    <tr {...rest} ref={setNodeRef} style={style} {...attributes} {...listeners} />
  )
}

function DomainsPage() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDomain, setEditingDomain] = useState<DomainData | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DomainData | null>(null)

  const { data: domainList, isLoading } = useQuery({
    queryKey: ['content', 'domains'],
    queryFn: () => domainApi.getList(),
  })

  const domains = domainList?.data ?? []

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => domainApi.toggle(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', 'domains'] })
      message.success('操作成功')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => domainApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', 'domains'] })
      message.success('删除成功')
      setDeleteTarget(null)
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (ids: string[]) => domainApi.reorder(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', 'domains'] })
    },
  })

  const saveMutation = useMutation({
    mutationFn: (values: { name: string; icon: string; isFree: boolean; unlockPoints: number; enabled: boolean; id?: string }) => {
      if (values.id) {
        return domainApi.update(values.id, values)
      }
      return domainApi.create(values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', 'domains'] })
      message.success('保存成功')
      setModalOpen(false)
      setEditingDomain(null)
    },
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = domains.findIndex((d) => d.id === active.id)
    const newIndex = domains.findIndex((d) => d.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const newOrder = [...domains]
    const [moved] = newOrder.splice(oldIndex, 1)
    newOrder.splice(newIndex, 0, moved)
    reorderMutation.mutate(newOrder.map((d) => d.id))
  }, [domains, reorderMutation])

  const handleAdd = useCallback(() => {
    setEditingDomain(null)
    setModalOpen(true)
  }, [])

  const handleEdit = useCallback((record: DomainData) => {
    setEditingDomain(record)
    setModalOpen(true)
  }, [])

  const handleDelete = useCallback((record: DomainData) => {
    setDeleteTarget(record)
  }, [])

  const handleSave = useCallback((values: { name: string; icon: string; isFree: boolean; unlockPoints: number; enabled: boolean }) => {
    if (editingDomain) {
      saveMutation.mutate({ ...values, id: editingDomain.id })
    } else {
      saveMutation.mutate(values)
    }
  }, [editingDomain, saveMutation])

  const columns: ColumnsType<DomainData> = [
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 60,
      render: () => (
        <span className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 select-none">
          ⠿
        </span>
      ),
    },
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      width: 80,
      render: (icon: string) => <span className="text-xl">{icon}</span>,
    },
    {
      title: '领域名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: '解锁积分',
      dataIndex: 'unlockPoints',
      key: 'unlockPoints',
      width: 120,
      render: (points: number, record: DomainData) => (
        record.isFree
          ? <StatusBadge status="free" />
          : <span className="font-medium">{points} 积分</span>
      ),
    },
    {
      title: '免费标识',
      dataIndex: 'isFree',
      key: 'isFree',
      width: 100,
      render: (isFree: boolean) => (
        <span className={isFree ? 'text-[#065F46]' : 'text-[#991B1B]'}>
          {isFree ? '免费' : '付费'}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled: boolean) => <StatusBadge status={enabled ? 'enabled' : 'disabled'} />,
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      render: (_: unknown, record: DomainData) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button
            type="link"
            size="small"
            onClick={() => toggleMutation.mutate({ id: record.id, enabled: !record.enabled })}
          >
            {record.enabled ? '下架' : '上架'}
          </Button>
          <Button type="link" size="small" danger onClick={() => handleDelete(record)}>删除</Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="m-0 text-[28px] font-bold text-text-primary leading-tight">知识领域管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ background: '#160C57' }}>
          新增领域
        </Button>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={domains.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          <Table<DomainData>
            rowKey="id"
            columns={columns}
            dataSource={domains}
            loading={isLoading}
            components={{
              body: {
                row: SortableRow,
              },
            }}
            pagination={false}
            locale={{ emptyText: '暂无领域数据' }}
            rowClassName={(_, index) => (index % 2 === 1 ? 'bg-[#F4F2FA]' : '')}
            className="[&_.ant-table-thead>tr>th]:bg-[#F8FAFC] [&_.ant-table-thead>tr>th]:text-sm [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:h-12 [&_.ant-table-thead>tr>th]:px-5 [&_.ant-table-tbody>tr>td]:h-[52px] [&_.ant-table-tbody>tr>td]:px-5 [&_.ant-table-tbody>tr:hover>td]:!bg-[#F4F2FA] [&_.ant-table-row-selected>td]:!bg-[#EEF2FF]"
          />
        </SortableContext>
      </DndContext>

      <DomainFormModal
        open={modalOpen}
        editingDomain={editingDomain}
        onClose={() => { setModalOpen(false); setEditingDomain(null) }}
        onSave={handleSave}
      />

      {deleteTarget && (
        <DomainDeleteConfirm
          domainName={deleteTarget.name}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

export default DomainsPage
