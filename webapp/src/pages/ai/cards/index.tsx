import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, Input, Button, Table, Tag, message, Modal, Select, Empty, List } from 'antd'
import { ThunderboltOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { cardApi } from '@/api/cards'
import { aiApi } from '@/api/ai'
import type { AiGeneratedCard, AiCardGenerateHistory } from '@/api/cards'
import type { CardSearchItem } from '@/types/question'
import { CardPreviewModal } from './CardPreviewModal'

function AiCardsPage() {
  // Card search & selection state
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([])
  const [generatedCards, setGeneratedCards] = useState<AiGeneratedCard[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewCard, setPreviewCard] = useState<AiGeneratedCard | null>(null)
  const [adoptModalOpen, setAdoptModalOpen] = useState(false)
  const [selectedChapter, setSelectedChapter] = useState<string | undefined>()
  const [adoptCards, setAdoptCards] = useState<AiGeneratedCard[]>([])

  // Search cards query
  const { data: cardSearchData, isLoading: cardsLoading } = useQuery({
    queryKey: ['ai', 'cards', 'search', searchKeyword],
    queryFn: () => aiApi.searchCards(searchKeyword),
    enabled: searchKeyword.length > 0,
    placeholderData: (prev) => prev,
  })

  const cardList = cardSearchData?.data ?? []

  // History query
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['ai', 'cards', 'history'],
    queryFn: () => cardApi.getHistory(),
  })

  // Chapters query
  const { data: chapters } = useQuery({
    queryKey: ['ai', 'cards', 'chapters'],
    queryFn: () => cardApi.getChapters(),
  })

  // Generate mutation
  const {
    mutate: generate,
    isPending: generating,
  } = useMutation({
    mutationFn: (cardIds: string[]) => cardApi.generateCards(cardIds),
    onSuccess: (result) => {
      setGeneratedCards(result.data)
      message.success('卡片生成完成！')
    },
    onError: (err: Error) => {
      message.error(err.message || '生成失败，请重试')
    },
  })

  // Card selection
  const toggleCardSelection = (card: CardSearchItem) => {
    setSelectedCardIds((prev) =>
      prev.includes(card.id) ? prev.filter((id) => id !== card.id) : [...prev, card.id],
    )
  }

  const handleGenerate = () => {
    if (selectedCardIds.length === 0) {
      message.warning('请至少选择一张参考卡片')
      return
    }
    setGeneratedCards([])
    generate(selectedCardIds)
  }

  const handlePreview = (card: AiGeneratedCard) => {
    setPreviewCard(card)
    setPreviewOpen(true)
  }

  const handleAdopt = (cards: AiGeneratedCard[]) => {
    setAdoptCards(cards)
    setSelectedChapter(undefined)
    setAdoptModalOpen(true)
  }

  const confirmAdopt = () => {
    if (!selectedChapter) {
      message.warning('请选择所属章节')
      return
    }
    message.success('卡片已采纳保存')
    setAdoptModalOpen(false)
    setGeneratedCards([])
  }

  const historyColumns: ColumnsType<AiCardGenerateHistory> = [
    { title: '主题', dataIndex: 'topic', key: 'topic' },
    { title: '生成时间', dataIndex: 'createdAt', key: 'createdAt', width: 160 },
    {
      title: '状态',
      dataIndex: 'adopted',
      key: 'adopted',
      width: 100,
      render: (adopted: boolean) => (
        <Tag color={adopted ? 'success' : 'default'}>{adopted ? '已采纳' : '未采纳'}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: () => (
        <Button type="link" size="small">预览</Button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <h1 className="m-0 text-[28px] font-bold text-text-primary leading-tight">AI 知识卡片生成</h1>

      {/* Card Selection Section */}
      <Card title={<span className="text-base font-semibold">选择参考卡片</span>} className="shadow-sm">
        <p className="text-sm text-gray-500 mb-4">
          搜索并选择现有知识卡片作为参考，AI 将基于所选卡片内容生成新的知识卡片
        </p>

        <Input.Search
          placeholder="搜索知识卡片..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onSearch={(value) => setSearchKeyword(value)}
          className="max-w-md mb-3"
          allowClear
        />

        {searchKeyword && (
          <List
            loading={cardsLoading}
            dataSource={cardList}
            locale={{ emptyText: '未找到匹配的卡片' }}
            className="max-h-48 overflow-y-auto border rounded-lg mb-4"
            renderItem={(item) => {
              const isSelected = selectedCardIds.includes(item.id)
              return (
                <List.Item
                  className={`px-4 py-3 cursor-pointer transition-colors hover:bg-purple-50 ${
                    isSelected ? 'bg-purple-50 border-l-4 border-l-[#160C57]' : ''
                  }`}
                  onClick={() => toggleCardSelection(item)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{item.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {item.domainName ? `${item.domainName} / ` : ''}{item.chapterName}
                    </div>
                  </div>
                  <Tag color="default" className="text-xs shrink-0">
                    {item.difficulty}
                  </Tag>
                </List.Item>
              )
            }}
          />
        )}

        {selectedCardIds.length > 0 && (
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-100 mb-4">
            <div className="text-sm font-medium text-gray-700">
              已选择 <strong>{selectedCardIds.length}</strong> 张参考卡片
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={handleGenerate}
            loading={generating}
            disabled={generating || selectedCardIds.length === 0}
            size="large"
            style={{ background: '#160C57' }}
          >
            {generating ? '生成中...' : '开始生成'}
          </Button>
        </div>
      </Card>

      {/* Generated Results */}
      {generatedCards.length > 0 && (
        <Card
          title={<span className="text-base font-semibold">生成结果（{generatedCards.length} 张卡片）</span>}
          className="shadow-sm"
        >
          <div className="flex flex-col gap-3">
            {generatedCards.map((card, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{card.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5 truncate">{card.coreConcept}</div>
                </div>
                <div className="flex gap-2 shrink-0 ml-4">
                  <Button size="small" onClick={() => handlePreview(card)}>预览</Button>
                </div>
              </div>
            ))}
            <div className="flex justify-end mt-2">
              <Button
                type="primary"
                onClick={() => handleAdopt(generatedCards)}
                style={{ background: '#160C57' }}
              >
                全部采纳
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* History */}
      <Card title={<span className="text-base font-semibold">历史生成记录</span>} className="shadow-sm">
        <Table<AiCardGenerateHistory>
          rowKey="id"
          columns={historyColumns}
          dataSource={history?.data ?? []}
          loading={historyLoading}
          pagination={false}
          locale={{ emptyText: <Empty description="暂无历史记录" /> }}
          size="small"
        />
      </Card>

      {/* Preview Modal */}
      <CardPreviewModal
        open={previewOpen}
        card={previewCard}
        onClose={() => setPreviewOpen(false)}
      />

      {/* Adopt Modal */}
      <Modal
        title="采纳为正式卡片"
        open={adoptModalOpen}
        width={560}
        onCancel={() => setAdoptModalOpen(false)}
        onOk={confirmAdopt}
        okText="确认采纳"
        cancelText="取消"
        okButtonProps={{ style: { background: '#160C57', borderColor: '#160C57' } }}
      >
        <div className="flex flex-col gap-4">
          <div className="text-sm text-gray-600">
            将 <strong>{adoptCards.length}</strong> 张卡片采纳为正式知识卡片
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">选择所属章节</div>
            <Select
              placeholder="请选择领域 / 章节"
              className="w-full"
              value={selectedChapter}
              onChange={setSelectedChapter}
              options={chapters?.data?.map((ch) => ({
                value: ch.id,
                label: `${ch.domainName} / ${ch.name}`,
              }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AiCardsPage
