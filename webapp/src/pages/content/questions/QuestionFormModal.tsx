import { memo, useEffect } from 'react'
import { Modal, Form, Input, Radio } from 'antd'
import type { QuestionBankData } from '@/types/question-bank'

interface QuestionFormModalProps {
  open: boolean
  editingQuestion: QuestionBankData | null
  onClose: () => void
  onSave: (values: {
    question: string
    options: { label: string; content: string }[]
    answer: string
    explanation: string
  }) => void
}

export const QuestionFormModal = memo(function QuestionFormModal({
  open,
  editingQuestion,
  onClose,
  onSave,
}: QuestionFormModalProps) {
  const [form] = Form.useForm()
  const isEdit = !!editingQuestion

  useEffect(() => {
    if (open) {
      if (editingQuestion) {
        const optionMap: Record<string, string> = {}
        editingQuestion.options.forEach((opt) => {
          optionMap[opt.label] = opt.content
        })
        form.setFieldsValue({
          question: editingQuestion.question,
          optionA: optionMap['A'] || '',
          optionB: optionMap['B'] || '',
          optionC: optionMap['C'] || '',
          optionD: optionMap['D'] || '',
          answer: editingQuestion.answer,
          explanation: editingQuestion.explanation,
        })
      } else {
        form.resetFields()
      }
    }
  }, [open, editingQuestion, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      onSave({
        question: values.question,
        options: [
          { label: 'A', content: values.optionA },
          { label: 'B', content: values.optionB },
          { label: 'C', content: values.optionC },
          { label: 'D', content: values.optionD },
        ],
        answer: values.answer,
        explanation: values.explanation,
      })
      form.resetFields()
      onClose()
    } catch {
      // validation failed
    }
  }

  return (
    <Modal
      title={isEdit ? '编辑题目' : '新增题目'}
      open={open}
      width={640}
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
      >
        <Form.Item
          name="question"
          label="题干"
          rules={[{ required: true, message: '请输入题干' }]}
        >
          <Input.TextArea rows={2} maxLength={200} showCount placeholder="请输入题目题干" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item
            name="optionA"
            label="选项 A"
            rules={[{ required: true, message: '请输入选项A' }]}
          >
            <Input placeholder="选项A" />
          </Form.Item>
          <Form.Item
            name="optionB"
            label="选项 B"
            rules={[{ required: true, message: '请输入选项B' }]}
          >
            <Input placeholder="选项B" />
          </Form.Item>
          <Form.Item
            name="optionC"
            label="选项 C"
            rules={[{ required: true, message: '请输入选项C' }]}
          >
            <Input placeholder="选项C" />
          </Form.Item>
          <Form.Item
            name="optionD"
            label="选项 D"
            rules={[{ required: true, message: '请输入选项D' }]}
          >
            <Input placeholder="选项D" />
          </Form.Item>
        </div>

        <Form.Item
          name="answer"
          label="正确答案"
          rules={[{ required: true, message: '请选择正确答案' }]}
        >
          <Radio.Group>
            <Radio value="A">A</Radio>
            <Radio value="B">B</Radio>
            <Radio value="C">C</Radio>
            <Radio value="D">D</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="explanation"
          label="题目解析"
          rules={[{ required: true, message: '请输入解析' }]}
        >
          <Input.TextArea rows={3} maxLength={500} showCount placeholder="请输入题目解析" />
        </Form.Item>
      </Form>
    </Modal>
  )
})
