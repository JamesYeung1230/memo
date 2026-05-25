import { memo, useState } from 'react'
import { Modal, Input, Typography } from 'antd'

const { Text } = Typography

interface DomainDeleteConfirmProps {
  domainName: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

export const DomainDeleteConfirm = memo(function DomainDeleteConfirm({
  domainName,
  onConfirm,
  onCancel,
}: DomainDeleteConfirmProps) {
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)

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
      title="确认删除知识领域"
      open
      okText="确认删除"
      cancelText="取消"
      okButtonProps={{ danger: true, disabled: inputValue !== domainName, loading }}
      onOk={handleOk}
      onCancel={onCancel}
      maskClosable={false}
    >
      <div className="space-y-3">
        <Text>
          此操作将永久删除知识领域「<Text strong>{domainName}</Text>」及其下所有章节和知识卡片，删除后不可恢复。
        </Text>
        <div className="p-3 bg-[#FEF2F2] rounded-md">
          <Text type="danger">此操作将同时删除该领域下的所有章节和知识卡片，请谨慎操作。</Text>
        </div>
        <div>
          <Text type="secondary">请输入 <Text strong>{domainName}</Text> 确认删除：</Text>
          <Input
            className="mt-1"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`请输入 "${domainName}"`}
          />
        </div>
      </div>
    </Modal>
  )
})
