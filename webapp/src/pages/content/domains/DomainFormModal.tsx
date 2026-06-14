import { memo, useEffect } from 'react'
import { Modal, Form, Input, InputNumber, Switch, Select } from 'antd'
import type { DomainData } from '@/types/domain'

interface DomainFormModalProps {
  open: boolean
  editingDomain: DomainData | null
  onClose: () => void
  onSave: (values: { name: string; icon: string; isFree: boolean; unlockPoints: number; enabled: boolean }) => void
}

const iconOptions = [
  { value: '💻', label: '💻 计算机' },
  { value: '📐', label: '📐 数学' },
  { value: '🇬🇧', label: '🇬🇧 英语' },
  { value: '🏛️', label: '🏛️ 历史' },
  { value: '⚛️', label: '⚛️ 物理' },
  { value: '🧬', label: '🧬 生物' },
  { value: '📊', label: '📊 经济' },
  { value: '🧠', label: '🧠 哲学' },
  { value: '🎨', label: '🎨 艺术' },
  { value: '🌍', label: '🌍 地理' },
  { value: '🔬', label: '🔬 科学' },
  { value: '📚', label: '📚 文学' },
]

export const DomainFormModal = memo(function DomainFormModal({
  open,
  editingDomain,
  onClose,
  onSave,
}: DomainFormModalProps) {
  const [form] = Form.useForm()
  const isEdit = !!editingDomain

  useEffect(() => {
    if (open) {
      if (editingDomain) {
        form.setFieldsValue({
          name: editingDomain.name,
          icon: editingDomain.icon,
          isFree: editingDomain.isFree,
          unlockPoints: editingDomain.unlockPoints,
          enabled: editingDomain.enabled,
        })
      } else {
        form.resetFields()
        form.setFieldsValue({ isFree: true, enabled: true, icon: '💻', unlockPoints: 0 })
      }
    }
  }, [open, editingDomain, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      onSave(values)
      form.resetFields()
      onClose()
    } catch {
      // validation failed
    }
  }

  return (
    <Modal
      title={isEdit ? '编辑知识领域' : '新增知识领域'}
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
      <Form
        form={form}
        layout="vertical"
        className="mt-2"
        initialValues={{ isFree: true, enabled: true, unlockPoints: 0 }}
      >
        <Form.Item
          name="name"
          label="领域名称"
          rules={[{ required: true, message: '请输入领域名称' }, { max: 30, message: '最长30字' }]}
        >
          <Input maxLength={30} showCount placeholder="请输入领域名称" />
        </Form.Item>

        <Form.Item
          name="icon"
          label="图标"
          rules={[{ required: true, message: '请选择图标' }]}
        >
          <Select
            placeholder="请选择图标"
            options={iconOptions}
            showSearch
            className="w-full"
          />
        </Form.Item>

        <Form.Item name="isFree" label="是否免费" valuePropName="checked">
          <Switch
            checkedChildren="免费"
            unCheckedChildren="付费"
            onChange={(checked) => {
              if (checked) form.setFieldsValue({ unlockPoints: 0 })
            }}
          />
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prev, cur) => prev.isFree !== cur.isFree}
        >
          {({ getFieldValue }) => {
            const isFree = getFieldValue('isFree')
            return !isFree ? (
              <Form.Item
                name="unlockPoints"
                label="解锁所需积分"
                rules={[{ required: true, message: '请输入解锁积分' }]}
              >
                <InputNumber min={1} max={99999} className="w-full" placeholder="请输入解锁积分" />
              </Form.Item>
            ) : null
          }}
        </Form.Item>

        <Form.Item name="enabled" label="状态" valuePropName="checked">
          <Switch checkedChildren="上架" unCheckedChildren="下架" />
        </Form.Item>
      </Form>
    </Modal>
  )
})
