import { memo, useEffect } from 'react'
import { Modal, Form, Input, Select } from 'antd'
import type { ChapterData } from '@/types/chapter'
import type { DomainData } from '@/types/domain'

interface ChapterFormModalProps {
  open: boolean
  editingChapter: ChapterData | null
  domains: DomainData[]
  domainId?: string
  onClose: () => void
  onSave: (values: { name: string; domainId: string }) => void
}

export const ChapterFormModal = memo(function ChapterFormModal({
  open,
  editingChapter,
  domains,
  domainId,
  onClose,
  onSave,
}: ChapterFormModalProps) {
  const [form] = Form.useForm()
  const isEdit = !!editingChapter

  useEffect(() => {
    if (open) {
      if (editingChapter) {
        form.setFieldsValue({
          name: editingChapter.name,
          domainId: editingChapter.domainId,
        })
      } else {
        form.resetFields()
        form.setFieldsValue({ domainId: domainId || undefined })
      }
    }
  }, [open, editingChapter, form, domainId])

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
      title={isEdit ? '编辑知识章节' : '新增知识章节'}
      open={open}
      width={520}
      onCancel={() => { form.resetFields(); onClose() }}
      onOk={handleOk}
      okText="保存"
      cancelText="取消"
      okButtonProps={{ style: { background: '#160C57', borderColor: '#160C57' } }}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        className="mt-2"
      >
        <Form.Item
          name="name"
          label="章节名称"
          rules={[{ required: true, message: '请输入章节名称' }, { max: 50, message: '最长50字' }]}
        >
          <Input maxLength={50} showCount placeholder="请输入章节名称" />
        </Form.Item>

        <Form.Item
          name="domainId"
          label="所属领域"
          rules={[{ required: true, message: '请选择所属领域' }]}
        >
          <Select
            placeholder="请选择所属领域"
            options={domains
              .filter((d) => d.enabled)
              .map((d) => ({ value: d.id, label: `${d.icon} ${d.name}` }))}
            disabled={isEdit}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
})
