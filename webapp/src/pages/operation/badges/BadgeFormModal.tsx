import { memo, useEffect } from 'react'
import { Modal, Form, Input, InputNumber, Switch } from 'antd'
import type { BadgeData } from '@/types/badge'

interface BadgeFormModalProps {
  open: boolean
  editingBadge: BadgeData | null
  onClose: () => void
  onSave: (values: Omit<BadgeData, 'id' | 'redeemCount' | 'createdAt'>) => void
}

export const BadgeFormModal = memo(function BadgeFormModal({
  open,
  editingBadge,
  onClose,
  onSave,
}: BadgeFormModalProps) {
  const [form] = Form.useForm()
  const isEdit = !!editingBadge

  useEffect(() => {
    if (open) {
      if (editingBadge) {
        form.setFieldsValue({
          name: editingBadge.name,
          icon: editingBadge.icon,
          description: editingBadge.description,
          requiredPoints: editingBadge.requiredPoints,
          enabled: editingBadge.enabled,
        })
      } else {
        form.resetFields()
        form.setFieldsValue({ enabled: true, requiredPoints: 0 })
      }
    }
  }, [open, editingBadge, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      onSave({
        name: values.name,
        icon: values.icon,
        description: values.description,
        requiredPoints: values.requiredPoints,
        enabled: values.enabled,
      })
      form.resetFields()
      onClose()
    } catch {
      // validation failed
    }
  }

  return (
    <Modal
      title={isEdit ? '编辑徽章' : '新增徽章'}
      open={open}
      width={560}
      onCancel={() => { form.resetFields(); onClose() }}
      onOk={handleOk}
      okText="保存"
      cancelText="取消"
      okButtonProps={{ style: { background: '#160C57', borderColor: '#160C57' } }}
      getContainer={() => document.body}
      zIndex={10000}
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-2" initialValues={{ enabled: true, requiredPoints: 0 }}>
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="name"
            label="徽章名称"
            rules={[{ required: true, message: '请输入徽章名称' }, { max: 20, message: '最长 20 字' }]}
          >
            <Input maxLength={20} showCount placeholder="请输入徽章名称" />
          </Form.Item>

          <Form.Item
            name="icon"
            label="图标(Emoji)"
            rules={[{ required: true, message: '请输入图标' }]}
          >
            <Input maxLength={2} placeholder="例如: ⭐" />
          </Form.Item>
        </div>

        <Form.Item
          name="description"
          label="获取条件"
          rules={[{ required: true, message: '请输入获取条件' }, { max: 100, message: '最长 100 字' }]}
        >
          <Input.TextArea maxLength={100} showCount rows={2} placeholder="描述如何获得该徽章" />
        </Form.Item>

        <Form.Item
          name="requiredPoints"
          label="兑换所需积分"
          tooltip="0 表示不可兑换，需满足条件自动获得"
        >
          <InputNumber<number> min={0} max={99999} className="w-full" placeholder="0 表示条件达成自动获得" />
        </Form.Item>

        <Form.Item name="enabled" label="启用状态" valuePropName="checked">
          <Switch checkedChildren="启用" unCheckedChildren="停用" />
        </Form.Item>
      </Form>
    </Modal>
  )
})
