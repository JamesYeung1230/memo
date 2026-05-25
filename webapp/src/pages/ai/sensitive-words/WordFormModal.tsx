import { memo, useEffect } from 'react'
import { Modal, Form, Input, Select, Switch } from 'antd'
import type { SensitiveWordData } from '@/types/sensitive-word'

interface WordFormModalProps {
  open: boolean
  editingWord: SensitiveWordData | null
  onClose: () => void
  onSave: (word: string, matchMode: string, enabled: boolean) => void
}

export const WordFormModal = memo(function WordFormModal({
  open,
  editingWord,
  onClose,
  onSave,
}: WordFormModalProps) {
  const [form] = Form.useForm()
  const isEdit = !!editingWord

  useEffect(() => {
    if (open) {
      if (editingWord) {
        form.setFieldsValue({
          word: editingWord.word,
          matchMode: editingWord.matchMode,
          enabled: editingWord.enabled,
        })
      } else {
        form.resetFields()
        form.setFieldsValue({ enabled: true })
      }
    }
  }, [open, editingWord, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      onSave(values.word, values.matchMode, values.enabled)
      form.resetFields()
      onClose()
    } catch {
      // validation failed
    }
  }

  return (
    <Modal
      title={isEdit ? '编辑敏感词' : '新增敏感词'}
      open={open}
      width={560}
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
        initialValues={{ enabled: true }}
      >
        <Form.Item
          name="word"
          label="敏感词"
          rules={[{ required: true, message: '请输入敏感词' }, { max: 50, message: '最长50字' }]}
        >
          <Input maxLength={50} showCount placeholder="请输入敏感词" />
        </Form.Item>

        <Form.Item
          name="matchMode"
          label="匹配模式"
          rules={[{ required: true, message: '请选择匹配模式' }]}
        >
          <Select
            options={[
              { value: 'exact', label: '精确匹配' },
              { value: 'pinyin', label: '拼音匹配' },
              { value: 'homophone', label: '谐音匹配' },
              { value: 'regex', label: '正则表达式' },
            ]}
            placeholder="请选择匹配模式"
          />
        </Form.Item>

        <Form.Item name="enabled" label="启用状态" valuePropName="checked">
          <Switch checkedChildren="启用" unCheckedChildren="停用" />
        </Form.Item>
      </Form>
    </Modal>
  )
})
