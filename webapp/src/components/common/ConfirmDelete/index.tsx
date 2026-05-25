import { useState } from 'react'
import { Modal, Input, Typography } from 'antd'

const { Text } = Typography

interface ConfirmDeleteProps {
  title: string
  content: string
  confirmText: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  dangerLevel?: 'domain' | 'chapter' | 'card' | 'normal'
}

const levelMessages: Record<string, string> = {
  domain: '此操作将同时删除该领域下的所有章节和知识卡片，',
  chapter: '此操作将同时删除该章节下的所有知识卡片，',
  card: '此操作将删除该知识卡片及其关联题目，',
}

export function ConfirmDelete({ title, content, confirmText, onConfirm, onCancel, dangerLevel = 'normal' }: ConfirmDeleteProps) {
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const levelMsg = levelMessages[dangerLevel]

  const handleOk = async () => {
    setLoading(true)
    try {
      await onConfirm()
      onCancel()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={title}
      open
      okText="确认删除"
      cancelText="取消"
      okButtonProps={{ danger: true, disabled: inputValue !== confirmText, loading }}
      onOk={handleOk}
      onCancel={onCancel}
      maskClosable={false}
    >
      <div className="space-y-3">
        <Text>
          {content}
        </Text>
        {levelMsg && (
          <div className="p-3 bg-[#FEF2F2] rounded-md">
            <Text type="danger">{levelMsg}请谨慎操作。</Text>
          </div>
        )}
        <div>
          <Text type="secondary">请输入 <Text strong>{confirmText}</Text> 确认删除：</Text>
          <Input
            className="mt-1"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`请输入 "${confirmText}"`}
          />
        </div>
      </div>
    </Modal>
  )
}
