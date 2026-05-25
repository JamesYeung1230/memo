import { memo, useEffect } from 'react'
import { Modal, Form, Input, Select } from 'antd'
import type { CardData, Difficulty } from '@/types/card'
import { difficultyLabels } from '@/types/card'

interface CardFormModalProps {
  open: boolean
  editingCard: CardData | null
  chapterOptions: { value: string; label: string }[]
  onClose: () => void
  onSave: (values: { title: string; content: string; chapterId: string; difficulty: Difficulty }) => void
}

export const CardFormModal = memo(function CardFormModal({
  open,
  editingCard,
  chapterOptions,
  onClose,
  onSave,
}: CardFormModalProps) {
  const [form] = Form.useForm()
  const isEdit = !!editingCard

  useEffect(() => {
    if (open) {
      if (editingCard) {
        form.setFieldsValue({
          title: editingCard.title,
          content: editingCard.content,
          chapterId: editingCard.chapterId,
          difficulty: editingCard.difficulty,
        })
      } else {
        form.resetFields()
      }
    }
  }, [open, editingCard, form])

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
      title={isEdit ? '编辑知识卡片' : '新增知识卡片'}
      open={open}
      width={640}
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
          name="title"
          label="卡片标题"
          rules={[{ required: true, message: '请输入卡片标题' }, { max: 100, message: '最长100字' }]}
        >
          <Input maxLength={100} showCount placeholder="请输入卡片标题" />
        </Form.Item>

        <Form.Item
          name="content"
          label="卡片内容"
          rules={[{ required: true, message: '请输入卡片内容' }]}
        >
          <Input.TextArea rows={4} maxLength={500} showCount placeholder="请输入卡片内容" />
        </Form.Item>

        <Form.Item
          name="chapterId"
          label="所属章节"
          rules={[{ required: true, message: '请选择所属章节' }]}
        >
          <Select
            placeholder="请选择所属章节"
            options={chapterOptions}
            showSearch
            filterOption={(input, option) =>
              (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item
          name="difficulty"
          label="难度等级"
          rules={[{ required: true, message: '请选择难度等级' }]}
        >
          <Select
            placeholder="请选择难度等级"
            options={[
              { value: 'easy', label: difficultyLabels.easy },
              { value: 'medium', label: difficultyLabels.medium },
              { value: 'hard', label: difficultyLabels.hard },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
})
