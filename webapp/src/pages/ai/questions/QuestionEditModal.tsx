import { memo } from 'react'
import { Modal, Input, Radio, Form } from 'antd'
import type { AiGeneratedQuestion } from '@/types/question'

const { TextArea } = Input

interface QuestionEditModalProps {
  open: boolean
  question: AiGeneratedQuestion | null
  onClose: () => void
  onSave: (values: AiGeneratedQuestion) => void
}

export const QuestionEditModal = memo(function QuestionEditModal({
  open,
  question,
  onClose,
  onSave,
}: QuestionEditModalProps) {
  const [form] = Form.useForm()

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      onSave(values)
      form.resetFields()
    } catch {
      // validation failed
    }
  }

  const handleClose = () => {
    form.resetFields()
    onClose()
  }

  return (
    <Modal
      title="编辑题目"
      open={open}
      width={720}
      onCancel={handleClose}
      onOk={handleOk}
      okText="保存"
      cancelText="取消"
      okButtonProps={{
        style: { background: '#160C57', borderColor: '#160C57' },
      }}
      destroyOnClose
    >
      {question && (
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            ...question,
            correctAnswer: question.correctAnswer,
          }}
          className="mt-2"
        >
          <Form.Item
            name="stem"
            label="题干"
            rules={[{ required: true, message: '请输入题干' }, { max: 500, message: '最长500字' }]}
          >
            <TextArea rows={2} maxLength={500} showCount placeholder="请输入题干" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-3">
            {(['A', 'B', 'C', 'D'] as const).map((label) => (
              <Form.Item
                key={label}
                name={['options', label === 'A' ? 0 : label === 'B' ? 1 : label === 'C' ? 2 : 3, 'text']}
                label={`选项 ${label}`}
                rules={[{ required: true, message: `请输入选项${label}` }, { max: 200, message: '最长200字' }]}
                initialValue={question.options[label === 'A' ? 0 : label === 'B' ? 1 : label === 'C' ? 2 : 3].text}
              >
                <Input maxLength={200} showCount placeholder={`选项 ${label}`} />
              </Form.Item>
            ))}
          </div>

          <Form.Item
            name="correctAnswer"
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
            name="analysis"
            label="解析说明"
            rules={[{ required: true, message: '请输入解析说明' }, { max: 1000, message: '最长1000字' }]}
          >
            <TextArea rows={3} maxLength={1000} showCount placeholder="请输入解析说明" />
          </Form.Item>
        </Form>
      )}
    </Modal>
  )
})
