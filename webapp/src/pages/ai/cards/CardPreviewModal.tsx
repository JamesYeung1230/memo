import { memo } from 'react'
import { Modal, Tag } from 'antd'
import type { AiGeneratedCard } from '@/api/cards'

interface CardPreviewModalProps {
  open: boolean
  card: AiGeneratedCard | null
  onClose: () => void
}

const difficultyColors: Record<string, string> = {
  '入门': 'green',
  '基础': 'blue',
  '进阶': 'orange',
}

export const CardPreviewModal = memo(function CardPreviewModal({
  open,
  card,
  onClose,
}: CardPreviewModalProps) {
  return (
    <Modal
      title="卡片预览"
      open={open}
      width={720}
      onCancel={onClose}
      getContainer={() => document.body}
      zIndex={10000}
      footer={null}
    >
      {card && (
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-sm font-medium text-gray-500 mb-1">标题</div>
            <div className="text-lg font-semibold">{card.title}</div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-500 mb-1">核心概念</div>
            <div className="text-sm text-gray-700">{card.coreConcept}</div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-500 mb-1">详细说明</div>
            <div
              className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4 border prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: card.detail }}
            />
          </div>

          {card.lifeAnalogy && (
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">生活类比</div>
              <div className="text-sm text-gray-700">{card.lifeAnalogy}</div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-gray-500">标签：</div>
            <Space size={4}>
              {card.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </Space>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-gray-500">难度等级：</div>
            <Tag color={difficultyColors[card.difficulty] || 'default'}>{card.difficulty}</Tag>
          </div>
        </div>
      )}
    </Modal>
  )
})

function Space({ children, size }: { children: React.ReactNode; size?: number }) {
  return <div className={`flex gap-${size ?? 2} flex-wrap`}>{children}</div>
}
