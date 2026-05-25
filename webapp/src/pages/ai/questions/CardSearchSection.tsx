import { memo, useState } from 'react'
import { Input, Card, List, Space, Tag } from 'antd'
import { SearchOutlined, ThunderboltOutlined } from '@ant-design/icons'
import type { CardSearchItem } from '@/types/question'

interface CardSearchSectionProps {
  cardList: CardSearchItem[]
  loading: boolean
  selectedCard: CardSearchItem | null
  onSearch: (keyword: string) => void
  onSelectCard: (card: CardSearchItem) => void
  onGenerate: () => void
  generating: boolean
}

export const CardSearchSection = memo(function CardSearchSection({
  cardList,
  loading,
  selectedCard,
  onSearch,
  onSelectCard,
  onGenerate,
  generating,
}: CardSearchSectionProps) {
  const [keyword, setKeyword] = useState('')

  const handleSearch = (value: string) => {
    setKeyword(value)
    onSearch(value)
  }

  return (
    <Card
      title={<span className="text-base font-semibold">选择关联卡片</span>}
      className="shadow-sm"
    >
      <p className="text-sm text-gray-500 mb-4">
        选择一张知识卡片，AI将基于此卡片内容自动生成配套单选题
      </p>

      <Space direction="vertical" className="w-full" size={12}>
        <Input
          placeholder="搜索知识卡片..."
          prefix={<SearchOutlined className="text-gray-400" />}
          value={keyword}
          onChange={(e) => handleSearch(e.target.value)}
          className="max-w-xs"
          allowClear
        />

        <List
          loading={loading}
          dataSource={cardList}
          locale={{ emptyText: keyword ? '未找到匹配的卡片' : '请输入关键词搜索知识卡片' }}
          className="max-h-48 overflow-y-auto border rounded-lg"
          renderItem={(item) => (
            <List.Item
              className={`px-4 py-3 cursor-pointer transition-colors hover:bg-purple-50 ${
                selectedCard?.id === item.id ? 'bg-purple-50 border-l-4 border-l-[#160C57]' : ''
              }`}
              onClick={() => onSelectCard(item)}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{item.title}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {item.domainName} / {item.chapterName}
                </div>
              </div>
              <Tag color="default" className="text-xs shrink-0">
                {item.difficulty}
              </Tag>
            </List.Item>
          )}
        />

        {selectedCard && (
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
            <div className="font-semibold text-base text-gray-900">{selectedCard.title}</div>
            <div className="text-xs text-gray-500 mt-1">
              所属章节：{selectedCard.domainName} / {selectedCard.chapterName}
            </div>
            <div className="text-xs text-gray-500">难度：{selectedCard.difficulty}</div>
          </div>
        )}

        <button
          onClick={onGenerate}
          disabled={!selectedCard || generating}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: '#160C57' }}
          onMouseEnter={(e) => !generating && selectedCard && (e.currentTarget.style.background = '#2D1A8E')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#160C57')}
        >
          <ThunderboltOutlined className="text-base" />
          {generating ? '生成中...' : 'AI 生成题目'}
        </button>
      </Space>
    </Card>
  )
})
