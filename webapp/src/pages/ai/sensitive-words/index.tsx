import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Input, Button, Table, Space, message, Modal, Alert } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { sensitiveWordApi } from '@/api/sensitive-words'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { SensitiveWordData, MatchMode } from '@/types/sensitive-word'
import { matchModeLabels } from '@/types/sensitive-word'
import { WordFormModal } from './WordFormModal'

const matchModeColors: Record<MatchMode, string> = {
  exact: 'bg-blue-100 text-blue-700',
  pinyin: 'bg-purple-100 text-purple-700',
  homophone: 'bg-orange-100 text-orange-700',
  regex: 'bg-gray-100 text-gray-600',
}

function SensitiveWordsPage() {
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingWord, setEditingWord] = useState<SensitiveWordData | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletingWord, setDeletingWord] = useState<SensitiveWordData | null>(null)

  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['sensitive-words', keyword, page, pageSize],
    queryFn: () =>
      sensitiveWordApi.getList({ keyword: keyword || undefined, page, pageSize }),
    placeholderData: (prev) => prev,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      sensitiveWordApi.toggle(id, enabled),
    onSuccess: () => {
      message.success('操作成功')
      queryClient.invalidateQueries({ queryKey: ['sensitive-words'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sensitiveWordApi.delete(id),
    onSuccess: () => {
      message.success('删除成功')
      setDeleteModalOpen(false)
      setDeletingWord(null)
      queryClient.invalidateQueries({ queryKey: ['sensitive-words'] })
    },
  })

  const batchDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => sensitiveWordApi.batchDelete(ids),
    onSuccess: () => {
      message.success('批量删除成功')
      setSelectedIds([])
      queryClient.invalidateQueries({ queryKey: ['sensitive-words'] })
    },
  })

  const createMutation = useMutation({
    mutationFn: (params: { word: string; matchMode: string; enabled?: boolean }) =>
      sensitiveWordApi.create(params),
    onSuccess: () => {
      message.success('新增成功')
      setModalOpen(false)
      setEditingWord(null)
      queryClient.invalidateQueries({ queryKey: ['sensitive-words'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (params: { id: string; word: string; matchMode: string; enabled?: boolean }) =>
      sensitiveWordApi.update(params.id, {
        word: params.word,
        matchMode: params.matchMode,
        enabled: params.enabled,
      }),
    onSuccess: () => {
      message.success('编辑成功')
      setModalOpen(false)
      setEditingWord(null)
      queryClient.invalidateQueries({ queryKey: ['sensitive-words'] })
    },
  })

  const handleSave = useCallback(
    (word: string, matchMode: string, enabled: boolean) => {
      if (editingWord) {
        updateMutation.mutate({ id: editingWord.id, word, matchMode, enabled })
      } else {
        createMutation.mutate({ word, matchMode, enabled })
      }
    },
    [createMutation, updateMutation, editingWord],
  )

  const handleAdd = useCallback(() => {
    setEditingWord(null)
    setModalOpen(true)
  }, [])

  const handleEdit = useCallback((record: SensitiveWordData) => {
    setEditingWord(record)
    setModalOpen(true)
  }, [])

  const handleDelete = useCallback((record: SensitiveWordData) => {
    setDeletingWord(record)
    setDeleteModalOpen(true)
  }, [])

  const confirmDelete = useCallback(() => {
    if (deletingWord) {
      deleteMutation.mutate(deletingWord.id)
    }
  }, [deletingWord, deleteMutation])

  const columns: ColumnsType<SensitiveWordData> = [
    {
      title: '敏感词',
      dataIndex: 'word',
      key: 'word',
      width: '25%',
      ellipsis: true,
    },
    {
      title: '匹配模式',
      dataIndex: 'match_mode',
      key: 'match_mode',
      width: '15%',
      render: (mode: MatchMode) => (
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${matchModeColors[mode] || 'bg-gray-100'}`}>
          {matchModeLabels[mode] || mode}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: '12%',
      render: (enabled: boolean) => <StatusBadge status={enabled ? 'enabled' : 'disabled'} />,
    },
    {
      title: '添加时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: '18%',
    },
    {
      title: '操作',
      key: 'actions',
      width: '20%',
      render: (_: unknown, record: SensitiveWordData) => (
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
        <h1 className="m-0 text-[28px] font-bold text-text-primary leading-tight">敏感词库管理</h1>
      </div>

      {error && (
        <Alert
          message="加载失败"
          description={(error as Error).message || '请检查网络连接后重试'}
          type="error"
          showIcon
          closable
        />
      )}

      <div className="flex items-center justify-between">
        <Input
          placeholder="搜索敏感词..."
          prefix={<SearchOutlined className="text-gray-400" />}
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
          className="max-w-xs"
          allowClear
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ background: '#160C57' }}>
          新增敏感词
        </Button>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 rounded-lg border border-indigo-100">
          <span className="text-sm text-gray-700">
            已选择 <span className="font-semibold text-indigo-600">{selectedIds.length}</span> 项
          </span>
          <Button
            danger
            size="small"
            loading={batchDeleteMutation.isPending}
            onClick={() => batchDeleteMutation.mutate(selectedIds)}
          >
            批量删除
          </Button>
          <Button size="small" onClick={() => setSelectedIds([])}>取消选择</Button>
        </div>
      )}

      <Table<SensitiveWordData>
        rowKey="id"
        columns={columns}
        dataSource={data?.data?.items ?? []}
        loading={isLoading}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (keys) => setSelectedIds(keys as string[]),
        }}
        pagination={{
          current: page,
          pageSize,
          total: data?.data?.total ?? 0,
          onChange: (p, ps) => { setPage(p); setPageSize(ps) },
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        locale={{ emptyText: '暂无敏感词数据' }}
      />

      <WordFormModal
        open={modalOpen}
        editingWord={editingWord}
        onClose={() => { setModalOpen(false); setEditingWord(null) }}
        onSave={handleSave}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      />

      <Modal
        title="确认删除"
        open={deleteModalOpen}
        width={400}
        onCancel={() => { setDeleteModalOpen(false); setDeletingWord(null) }}
        onOk={confirmDelete}
        okText="确认删除"
        okButtonProps={{ danger: true }}
        cancelText="取消"
        confirmLoading={deleteMutation.isPending}
      >
        <p className="text-sm text-gray-600">
          确定删除敏感词「<strong>{deletingWord?.word}</strong>」？删除后不可恢复。
        </p>
      </Modal>
    </div>
  )
}

export default SensitiveWordsPage
