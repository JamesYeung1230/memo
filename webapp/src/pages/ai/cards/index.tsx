import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, Input, Button, Table, Progress, Tag, message, Modal, Select, Empty } from 'antd'
import { PlusOutlined, DeleteOutlined, ThunderboltOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { cardApi } from '@/api/cards'
import type { AiGeneratedCard, AiCardGenerateHistory } from '@/api/cards'
import { CardPreviewModal } from './CardPreviewModal'

function AiCardsPage() {
  const [topics, setTopics] = useState<string[]>([''])
  const [generatedCards, setGeneratedCards] = useState<AiGeneratedCard[]>([])
  const [generating, setGenerating] = useState(false)
  const [genProgress, setGenProgress] = useState(0)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewCard, setPreviewCard] = useState<AiGeneratedCard | null>(null)
  const [adoptModalOpen, setAdoptModalOpen] = useState(false)
  const [selectedChapter, setSelectedChapter] = useState<string | undefined>()
  const [adoptCards, setAdoptCards] = useState<AiGeneratedCard[]>([])

  const { data: history } = useQuery({
    queryKey: ['ai', 'cards', 'history'],
    queryFn: () => cardApi.getHistory(),
  })

  const { data: chapters } = useQuery({
    queryKey: ['ai', 'cards', 'chapters'],
    queryFn: () => cardApi.getChapters(),
  })

  const handleTopicChange = (index: number, value: string) => {
    const newTopics = [...topics]
    newTopics[index] = value
    setTopics(newTopics)
  }

  const addTopic = () => {
    if (topics.length < 10) {
      setTopics([...topics, ''])
    } else {
      message.warning('最多支持10个主题')
    }
  }

  const removeTopic = (index: number) => {
    if (topics.length > 1) {
      setTopics(topics.filter((_, i) => i !== index))
    }
  }

  const handleGenerate = async () => {
    const validTopics = topics.filter((t) => t.trim())
    if (validTopics.length === 0) {
      message.warning('请至少输入一个主题')
      return
    }

    setGenerating(true)
    setGeneratedCards([])
    setGenProgress(0)

    // Simulate progress
    const interval = setInterval(() => {
      setGenProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    try {
      const result = await cardApi.generateCards(validTopics)
      setGeneratedCards(result.data)
      setGenProgress(100)
      message.success('卡片生成完成！')
    } catch {
      message.error('生成失败，请重试')
    } finally {
      clearInterval(interval)
      setGenerating(false)
    }
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

      {/* 主题输入区 */}
      <Card title={<span className="text-base font-semibold">批量主题输入</span>} className="shadow-sm">
        <div className="flex flex-col gap-2">
          {topics.map((topic, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={topic}
                onChange={(e) => handleTopicChange(index, e.target.value)}
                placeholder={`主题 ${index + 1}`}
                className="max-w-md"
                disabled={generating}
              />
              {topics.length > 1 && (
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeTopic(index)}
                  disabled={generating}
                />
              )}
            </div>
          ))}
          {topics.length < 10 && (
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={addTopic}
              className="max-w-xs mt-1"
              disabled={generating}
            >
              添加主题（最多10个）
            </Button>
          )}
        </div>

        <div className="mt-4 flex items-center gap-4">
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={handleGenerate}
            loading={generating}
            disabled={generating || topics.every((t) => !t.trim())}
            size="large"
            style={{ background: '#160C57' }}
          >
            {generating ? `生成中 ${genProgress}%` : '开始生成'}
          </Button>
          {generating && (
            <Progress percent={genProgress} className="flex-1 max-w-md" strokeColor="#160C57" />
          )}
        </div>
      </Card>

      {/* 生成结果 */}
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

      {/* 历史记录 */}
      <Card title={<span className="text-base font-semibold">历史生成记录</span>} className="shadow-sm">
        <Table<AiCardGenerateHistory>
          rowKey="id"
          columns={historyColumns}
          dataSource={history?.data ?? []}
          pagination={false}
          locale={{ emptyText: <Empty description="暂无历史记录" /> }}
          size="small"
        />
      </Card>

      {/* 预览弹窗 */}
      <CardPreviewModal
        open={previewOpen}
        card={previewCard}
        onClose={() => setPreviewOpen(false)}
      />

      {/* 采纳弹窗 */}
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
