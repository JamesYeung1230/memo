import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Input, Select, Table, Space, message } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { questionApi } from '@/api/questions'
import { domainApi } from '@/api/domains'
import type { QuestionBankData } from '@/types/question-bank'
import { StatusBadge } from '@/components/common/StatusBadge'
import { QuestionFormModal } from './QuestionFormModal'

function QuestionsPage() {
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedDomainId, setSelectedDomainId] = useState<string | undefined>()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<QuestionBankData | null>(null)
  const [deleteConfirming, setDeleteConfirming] = useState<QuestionBankData | null>(null)

  const { data: domainList } = useQuery({
    queryKey: ['content', 'domains'],
    queryFn: () => domainApi.getList(),
  })
  const domains = domainList?.data ?? []

  const { data: questionsData, isLoading } = useQuery({
    queryKey: ['content', 'questions', keyword, selectedDomainId, page, pageSize],
    queryFn: () => questionApi.getList({
      keyword: keyword || undefined,
      domainId: selectedDomainId,
      page,
      pageSize,
    }),
    placeholderData: (prev) => prev,
  })

  const questions = questionsData?.data?.items ?? []
  const total = questionsData?.data?.total ?? 0

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => questionApi.toggle(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', 'questions'] })
      message.success('操作成功')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => questionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', 'questions'] })
      message.success('删除成功')
      setDeleteConfirming(null)
    },
  })

  const saveMutation = useMutation({
    mutationFn: (values: {
      question: string
      options: { label: string; content: string }[]
      answer: string
      explanation: string
      id?: string
    }) => {
      if (values.id) {
        return questionApi.update(values.id, {
          question: values.question,
          options: values.options,
          answer: values.answer,
          explanation: values.explanation,
        })
      }
      return questionApi.update('new', values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', 'questions'] })
      message.success('保存成功')
      setModalOpen(false)
      setEditingQuestion(null)
    },
  })

  const handleAdd = useCallback(() => {
    setEditingQuestion(null)
    setModalOpen(true)
  }, [])

  const handleEdit = useCallback((record: QuestionBankData) => {
    setEditingQuestion(record)
    setModalOpen(true)
  }, [])

  const handleDelete = useCallback((record: QuestionBankData) => {
    setDeleteConfirming(record)
  }, [])

  const handleSave = useCallback((values: {
    question: string
    options: { label: string; content: string }[]
    answer: string
    explanation: string
  }) => {
    if (editingQuestion) {
      saveMutation.mutate({ ...values, id: editingQuestion.id })
    } else {
      saveMutation.mutate(values)
    }
  }, [editingQuestion, saveMutation])

  const columns: ColumnsType<QuestionBankData> = [
    {
      title: '题干',
      dataIndex: 'question',
      key: 'question',
      width: 300,
      ellipsis: true,
      render: (question: string) => (
        <span className="text-sm truncate block max-w-[300px]" title={question}>
          {question}
        </span>
      ),
    },
    {
      title: '关联卡片',
      dataIndex: 'cardTitle',
      key: 'cardTitle',
      width: 160,
      ellipsis: true,
      render: (title: string) => title || '-',
    },
    {
      title: '所属领域',
      dataIndex: 'domainName',
      key: 'domainName',
      width: 140,
      ellipsis: true,
    },
    {
      title: '正确答案',
      dataIndex: 'answer',
      key: 'answer',
      width: 100,
      render: (answer: string) => (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#D1FAE5] text-[#065F46] text-xs font-bold">
          {answer}
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
      render: (_: unknown, record: QuestionBankData) => (
        <Space size={0}>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Button
            type="link"
            size="small"
            onClick={() => toggleMutation.mutate({ id: record.id, enabled: !record.enabled })}
          >
            {record.enabled ? '停用' : '启用'}
          </Button>
          <Button type="link" size="small" danger onClick={() => handleDelete(record)}>删除</Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="m-0 text-[28px] font-bold text-text-primary leading-tight">题库管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ background: '#160C57' }}>
          新增题目
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="搜索题干..."
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
          onChange={(val) => { setSelectedDomainId(val); setPage(1) }}
          options={domains.map((d) => ({ value: d.id, label: `${d.icon} ${d.name}` }))}
        />
      </div>

      <Table<QuestionBankData>
        rowKey="id"
        columns={columns}
        dataSource={questions}
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: (p, ps) => { setPage(p); setPageSize(ps) },
          showSizeChanger: true,
          showTotal: (totalCount) => `共 ${totalCount} 条`,
        }}
        locale={{ emptyText: '暂无题目数据' }}
        rowClassName={(_, index) => (index % 2 === 1 ? 'bg-[#F4F2FA]' : '')}
        className="[&_.ant-table-thead>tr>th]:bg-[#F8FAFC] [&_.ant-table-thead>tr>th]:text-sm [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:h-12 [&_.ant-table-thead>tr>th]:px-5 [&_.ant-table-tbody>tr>td]:h-[52px] [&_.ant-table-tbody>tr>td]:px-5 [&_.ant-table-tbody>tr:hover>td]:!bg-[#F4F2FA] [&_.ant-table-pagination.ant-pagination]:h-12 [&_.ant-table-row-selected>td]:!bg-[#EEF2FF]"
      />

      <QuestionFormModal
        open={modalOpen}
        editingQuestion={editingQuestion}
        onClose={() => { setModalOpen(false); setEditingQuestion(null) }}
        onSave={handleSave}
      />

      {/* Delete confirmation modal */}
      {deleteConfirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setDeleteConfirming(null)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-[420px]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">确认删除</h3>
            <p className="text-sm text-gray-600 mb-6">
              确定删除题目「<strong>{deleteConfirming.question}</strong>」？删除后不可恢复。
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

export default QuestionsPage
