import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Select, Table, Space, message } from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { DragEndEvent } from '@dnd-kit/core'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { chapterApi } from '@/api/chapters'
import { domainApi } from '@/api/domains'
import type { ChapterData } from '@/types/chapter'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ChapterFormModal } from './ChapterFormModal'

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

function ChaptersPage() {
  const queryClient = useQueryClient()
  const [selectedDomainId, setSelectedDomainId] = useState<string | undefined>()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingChapter, setEditingChapter] = useState<ChapterData | null>(null)
  const [deleteConfirming, setDeleteConfirming] = useState<ChapterData | null>(null)

  const { data: domainList } = useQuery({
    queryKey: ['content', 'domains'],
    queryFn: () => domainApi.getList(),
  })
  const domains = domainList?.data ?? []

  const { data: chapterList, isLoading } = useQuery({
    queryKey: ['content', 'chapters', selectedDomainId],
    queryFn: () => chapterApi.getList({ domainId: selectedDomainId }),
  })
  const chapters = chapterList?.data ?? []

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => chapterApi.toggle(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', 'chapters'] })
      message.success('操作成功')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => chapterApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', 'chapters'] })
      message.success('删除成功')
      setDeleteConfirming(null)
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (ids: string[]) => chapterApi.reorder(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', 'chapters'] })
    },
  })

  const saveMutation = useMutation({
    mutationFn: (values: { name: string; domainId: string; id?: string }) => {
      if (values.id) {
        return chapterApi.update(values.id, { name: values.name })
      }
      return chapterApi.create(values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', 'chapters'] })
      message.success('保存成功')
      setModalOpen(false)
      setEditingChapter(null)
    },
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = chapters.findIndex((c) => c.id === active.id)
    const newIndex = chapters.findIndex((c) => c.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const newOrder = [...chapters]
    const [moved] = newOrder.splice(oldIndex, 1)
    newOrder.splice(newIndex, 0, moved)
    reorderMutation.mutate(newOrder.map((c) => c.id))
  }, [chapters, reorderMutation])

  const handleAdd = useCallback(() => {
    setEditingChapter(null)
    setModalOpen(true)
  }, [])

  const handleEdit = useCallback((record: ChapterData) => {
    setEditingChapter(record)
    setModalOpen(true)
  }, [])

  const handleDelete = useCallback((record: ChapterData) => {
    setDeleteConfirming(record)
  }, [])

  const handleSave = useCallback((values: { name: string; domainId: string }) => {
    if (editingChapter) {
      saveMutation.mutate({ ...values, id: editingChapter.id })
    } else {
      saveMutation.mutate(values)
    }
  }, [editingChapter, saveMutation])

  const columns: ColumnsType<ChapterData> = [
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
      title: '章节名称',
      dataIndex: 'name',
      key: 'name',
      width: 300,
      ellipsis: true,
    },
    {
      title: '所属领域',
      dataIndex: 'domainName',
      key: 'domainName',
      width: 180,
      ellipsis: true,
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
      render: (_: unknown, record: ChapterData) => (
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
        <h1 className="m-0 text-[28px] font-bold text-text-primary leading-tight">知识章节管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ background: '#160C57' }}>
          新增章节
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-600 shrink-0">选择领域：</span>
        <Select
          placeholder="全部领域"
          allowClear
          className="w-64"
          value={selectedDomainId}
          onChange={(val) => setSelectedDomainId(val)}
          options={domains.map((d) => ({ value: d.id, label: `${d.icon} ${d.name}` }))}
        />
      </div>

      <div style={{ isolation: 'isolate' }}>
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext items={chapters.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <Table<ChapterData>
            rowKey="id"
            columns={columns}
            dataSource={chapters}
            loading={isLoading}
            components={{
              body: {
                row: SortableRow,
              },
            }}
            pagination={false}
            locale={{ emptyText: '暂无章节数据' }}
            rowClassName={(_, index) => (index % 2 === 1 ? 'bg-[#F4F2FA]' : '')}
            className="[&_.ant-table-thead>tr>th]:bg-[#F8FAFC] [&_.ant-table-thead>tr>th]:text-sm [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:h-12 [&_.ant-table-thead>tr>th]:px-5 [&_.ant-table-tbody>tr>td]:h-[52px] [&_.ant-table-tbody>tr>td]:px-5 [&_.ant-table-tbody>tr:hover>td]:!bg-[#F4F2FA] [&_.ant-table-row-selected>td]:!bg-[#EEF2FF]"
          />
        </SortableContext>
      </DndContext>
      </div>

      <ChapterFormModal
        open={modalOpen}
        editingChapter={editingChapter}
        domains={domains}
        domainId={selectedDomainId}
        onClose={() => { setModalOpen(false); setEditingChapter(null) }}
        onSave={handleSave}
      />

      {/* Delete confirmation modal */}
      {deleteConfirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setDeleteConfirming(null)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-[420px]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">确认删除</h3>
            <p className="text-sm text-gray-600 mb-6">
              确定删除章节「<strong>{deleteConfirming.name}</strong>」？删除后不可恢复。
            </p>
            <div className="flex justify-end gap-3">
              <Button onClick={() => setDeleteConfirming(null)}>取消</Button>
              <Button danger type="primary" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleteConfirming.id)}>确认删除</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChaptersPage
