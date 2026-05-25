import { memo, useState } from 'react'
import { Modal, Input } from 'antd'

interface BatchActionBarProps {
  selectedCount: number
  onApprove: () => void
  onReject: (reason: string) => void
  onClear: () => void
}

export const BatchActionBar = memo(function BatchActionBar({
  selectedCount,
  onApprove,
  onReject,
  onClear,
}: BatchActionBarProps) {
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  if (selectedCount === 0) return null

  const handleReject = () => {
    if (rejectReason.trim()) {
      onReject(rejectReason.trim())
      setRejectReason('')
      setRejectModalOpen(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 rounded-lg border border-indigo-100">
        <span className="text-sm text-gray-700">
          已选择 <span className="font-semibold text-indigo-600">{selectedCount}</span> 条笔记
        </span>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={onApprove}
            className="px-4 py-1.5 rounded text-sm font-medium text-white"
            style={{ background: '#10B981' }}
          >
            批量通过
          </button>
          <button
            onClick={() => setRejectModalOpen(true)}
            className="px-4 py-1.5 rounded text-sm font-medium text-white"
            style={{ background: '#EF4444' }}
          >
            批量驳回
          </button>
          <button onClick={onClear} className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700">
            取消选择
          </button>
        </div>
      </div>

      <Modal
        title="批量驳回"
        open={rejectModalOpen}
        width={400}
        onCancel={() => setRejectModalOpen(false)}
        onOk={handleReject}
        okText="确认驳回"
        cancelText="取消"
        okButtonProps={{ danger: true, disabled: !rejectReason.trim() }}
      >
        <p className="text-sm text-gray-500 mb-3">已选中 {selectedCount} 条笔记</p>
        <Input.TextArea
          placeholder="请输入驳回原因（必填，最长200字）"
          maxLength={200}
          rows={3}
          showCount
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>
    </>
  )
})
