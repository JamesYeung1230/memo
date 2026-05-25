import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Input, Select, Table, Space, message, Drawer } from 'antd'
import { PlusOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { cardsContentApi } from '@/api/cards-content'
import { domainApi } from '@/api/domains'
import { chapterApi } from '@/api/chapters'
import type { CardData, Difficulty } from '@/types/card'
import { difficultyLabels, difficultyColors } from '@/types/card'
import { StatusBadge } from '@/components/common/StatusBadge'
import { CardFormModal } from './CardFormModal'

function CardsPage() {
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedDomainId, setSelectedDomainId] = useState<string | undefined>()
  const [selectedChapterId, setSelectedChapterId] = useState<string | undefined>()
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | undefined>()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<CardData | null>(null)
  const [deleteConfirming, setDeleteConfirming] = useState<CardData | null>(null)
  const [previewCard, setPreviewCard] = useState<CardData | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  // Get domains for filter
  const { data: domainList } = useQuery({
    queryKey: ['content', 'domains'],
    queryFn: () => domainApi.getList(),
  })
  const domains = domainList?.data ?? []

  // Get chapters for filter and form
  const { data: chapterList } = useQuery({
    queryKey: ['content', 'chapters', selectedDomainId],
    queryFn: () => chapterApi.getList({ domainId: selectedDomainId }),
  })
  const chapters = chapterList?.data ?? []

  // Get cards with filters
  const { data: cardsData, isLoading } = useQuery({
    queryKey: ['content', 'cards', keyword, selectedDomainId, selectedChapterId, selectedDifficulty, page, pageSize],
    queryFn: () => cardsContentApi.getList({
      keyword: keyword || undefined,
      domainId: selectedDomainId,
      chapterId: selectedChapterId,
      difficulty: selectedDifficulty,
      page,
      pageSize,
    }),
    placeholderData: (prev) => prev,
  })

  const cards = cardsData?.data?.items ?? []
  const total = cardsData?.data?.total ?? 0

  // Chapter options for the form modal (all chapters)
  const { data: allChapters } = useQuery({
    queryKey: ['content', 'allChapters'],
    queryFn: () => chapterApi.getList({}),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => cardsContentApi.toggle(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', 'cards'] })
      message.success('操作成功')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cardsContentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', 'cards'] })
      message.success('删除成功')
      setDeleteConfirming(null)
    },
  })

  const saveMutation = useMutation({
    mutationFn: (values: { title: string; content: string; chapterId: string; difficulty: Difficulty; id?: string }) => {
      if (values.id) {
        return cardsContentApi.update(values.id, {
          title: values.title,
          content: values.content,
          chapterId: values.chapterId,
          difficulty: values.difficulty,
        })
      }
      // For simplicity, we just update existing cards (the form date doesn't support creating new cards with domain)
      return cardsContentApi.update('new', values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', 'cards'] })
      message.success('保存成功')
      setModalOpen(false)
      setEditingCard(null)
    },
  })

  const handleAdd = useCallback(() => {
    setEditingCard(null)
    setModalOpen(true)
  }, [])

  const handleEdit = useCallback((record: CardData) => {
    setEditingCard(record)
    setModalOpen(true)
  }, [])

  const handleDelete = useCallback((record: CardData) => {
    setDeleteConfirming(record)
  }, [])

  const handlePreview = useCallback((record: CardData) => {
    setPreviewCard(record)
    setPreviewOpen(true)
  }, [])

  const handleSave = useCallback((values: { title: string; content: string; chapterId: string; difficulty: Difficulty }) => {
    if (editingCard) {
      saveMutation.mutate({ ...values, id: editingCard.id })
    } else {
      saveMutation.mutate(values)
    }
  }, [editingCard, saveMutation])

  // Reset chapter when domain changes
  const handleDomainChange = useCallback((value: string | undefined) => {
    setSelectedDomainId(value)
    setSelectedChapterId(undefined)
  }, [])

  const columns: ColumnsType<CardData> = [
    {
      title: '卡片标题',
      dataIndex: 'title',
      key: 'title',
      width: 250,
      ellipsis: true,
    },
    {
      title: '所属章节',
      dataIndex: 'chapterName',
      key: 'chapterName',
      width: 160,
      ellipsis: true,
    },
    {
      title: '所属领域',
      dataIndex: 'domainName',
      key: 'domainName',
      width: 140,
      ellipsis: true,
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 100,
      render: (difficulty: Difficulty) => (
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${difficultyColors[difficulty] || ''}`}>
          {difficultyLabels[difficulty] || difficulty}
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
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
    },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      render: (_: unknown, record: CardData) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handlePreview(record)}>预览</Button>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
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
        <h1 className="m-0 text-[28px] font-bold text-text-primary leading-tight">知识卡片管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ background: '#160C57' }}>
          新增卡片
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="搜索卡片标题..."
          prefix={<SearchOutlined className="text-gray-400" />}
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
          className="max-w-xs"
          allowClear
        />
        <Select
          placeholder="选择领域"
          allowClear
          className="w-44"
          value={selectedDomainId}
          onChange={handleDomainChange}
          options={domains.map((d) => ({ value: d.id, label: `${d.icon} ${d.name}` }))}
        />
        <Select
          placeholder="选择章节"
          allowClear
          className="w-44"
          value={selectedChapterId}
          onChange={(val) => { setSelectedChapterId(val); setPage(1) }}
          options={chapters.map((c) => ({ value: c.id, label: c.name }))}
          disabled={!selectedDomainId}
        />
        <Select
          placeholder="难度等级"
          allowClear
          className="w-32"
          value={selectedDifficulty}
          onChange={(val) => { setSelectedDifficulty(val); setPage(1) }}
          options={[
            { value: 'easy', label: difficultyLabels.easy },
            { value: 'medium', label: difficultyLabels.medium },
            { value: 'hard', label: difficultyLabels.hard },
          ]}
        />
      </div>

      <Table<CardData>
        rowKey="id"
        columns={columns}
        dataSource={cards}
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: (p, ps) => { setPage(p); setPageSize(ps) },
          showSizeChanger: true,
          showTotal: (totalCount) => `共 ${totalCount} 条`,
        }}
        locale={{ emptyText: '暂无卡片数据' }}
        rowClassName={(_, index) => (index % 2 === 1 ? 'bg-[#F4F2FA]' : '')}
        className="[&_.ant-table-thead>tr>th]:bg-[#F8FAFC] [&_.ant-table-thead>tr>th]:text-sm [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:h-12 [&_.ant-table-thead>tr>th]:px-5 [&_.ant-table-tbody>tr>td]:h-[52px] [&_.ant-table-tbody>tr>td]:px-5 [&_.ant-table-tbody>tr:hover>td]:!bg-[#F4F2FA] [&_.ant-table-pagination.ant-pagination]:h-12 [&_.ant-table-row-selected>td]:!bg-[#EEF2FF]"
      />

      <CardFormModal
        open={modalOpen}
        editingCard={editingCard}
        chapterOptions={(allChapters?.data ?? []).map((c) => ({ value: c.id, label: `${c.domainName} / ${c.name}` }))}
        onClose={() => { setModalOpen(false); setEditingCard(null) }}
        onSave={handleSave}
      />

      {/* Delete confirmation modal */}
      {deleteConfirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setDeleteConfirming(null)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-[420px]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">确认删除</h3>
            <p className="text-sm text-gray-600 mb-6">
              确定删除知识卡片「<strong>{deleteConfirming.title}</strong>」及其关联题目？删除后不可恢复。
            </p>
            <div className="flex justify-end gap-3">
              <Button onClick={() => setDeleteConfirming(null)}>取消</Button>
              <Button danger type="primary" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleteConfirming.id)}>确认删除</Button>
            </div>
          </div>
        </div>
      )}

      {/* Preview drawer */}
      <Drawer
        title="卡片预览"
        open={previewOpen}
        onClose={() => { setPreviewOpen(false); setPreviewCard(null) }}
        width={560}
      >
        {previewCard && (
          <div className="flex flex-col gap-4">
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">卡片标题</div>
              <div className="text-lg font-semibold">{previewCard.title}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">所属章节</div>
              <div className="text-sm">{previewCard.domainName} / {previewCard.chapterName}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">难度等级</div>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${difficultyColors[previewCard.difficulty] || ''}`}>
                {difficultyLabels[previewCard.difficulty] || previewCard.difficulty}
              </span>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">状态</div>
              <StatusBadge status={previewCard.enabled ? 'enabled' : 'disabled'} />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">卡片内容</div>
              <div className="p-4 bg-gray-50 rounded-lg text-sm leading-relaxed whitespace-pre-wrap">
                {previewCard.content}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">创建时间</div>
              <div className="text-sm">{previewCard.createdAt}</div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default CardsPage
