import { memo } from 'react'
import { Modal, Descriptions, Tag } from 'antd'
import type { PendingNote } from '@/types/review'
import { RiskScoreBadge } from '@/components/common/RiskScoreBadge'

interface ReviewDetailModalProps {
  open: boolean
  note: PendingNote | null
  detail: { noteContent: string; aiReason: string; sensitiveWords: string[] } | null
  loading: boolean
  onApprove: () => void
  onReject: () => void
  onClose: () => void
}

export const ReviewDetailModal = memo(function ReviewDetailModal({
  open,
  note,
  detail,
  loading,
  onApprove,
  onReject,
  onClose,
}: ReviewDetailModalProps) {
  return (
    <Modal
      title="审核详情"
      open={open}
      width={720}
      onCancel={onClose}
      footer={[
        <button
          key="reject"
          onClick={onReject}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-red-400 text-red-500 hover:bg-red-50"
        >
          驳回
        </button>,
        <button
          key="approve"
          onClick={onApprove}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: '#10B981' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#059669')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#10B981')}
        >
          通过
        </button>,
      ]}
    >
      {loading ? (
        <div className="flex flex-col gap-4 animate-pulse">
          <div className="h-6 w-48 bg-gray-100 rounded" />
          <div className="h-32 bg-gray-50 rounded" />
          <div className="h-20 bg-gray-50 rounded" />
        </div>
      ) : note && detail ? (
        <div className="flex flex-col gap-4">
          <Descriptions column={1} size="small">
            <Descriptions.Item label="笔记标题">{note.noteTitle}</Descriptions.Item>
            <Descriptions.Item label="作者">{note.author}</Descriptions.Item>
            <Descriptions.Item label="提交时间">{note.submitTime}</Descriptions.Item>
            <Descriptions.Item label="AI风险评分">
              <RiskScoreBadge score={note.aiRiskScore} type={note.aiRiskType} />
            </Descriptions.Item>
          </Descriptions>

          <div className="border-t pt-4">
            <div className="text-sm font-medium text-gray-700 mb-2">笔记全文</div>
            <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4 border">{detail.noteContent}</div>
          </div>

          <div className="border-t pt-4">
            <div className="text-sm font-medium text-gray-700 mb-2">AI 审查结果</div>
            <div className="text-sm text-gray-600 mb-2">{detail.aiReason}</div>
            {detail.sensitiveWords.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {detail.sensitiveWords.map((w) => (
                  <Tag key={w} color="red" className="m-0">
                    {w}
                  </Tag>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  )
})
