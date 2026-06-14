import { memo, useEffect } from 'react'
import { Modal, Form, Input, Select, Switch, DatePicker } from 'antd'
import type { BannerData, JumpType } from '@/types/banner'
import dayjs from 'dayjs'

interface BannerFormModalProps {
  open: boolean
  editingBanner: BannerData | null
  onClose: () => void
  onSave: (values: Omit<BannerData, 'id' | 'pv' | 'clickPv' | 'clickRate'>) => void
}

const jumpTypeOptions: { value: JumpType; label: string }[] = [
  { value: 'h5', label: 'H5 链接' },
  { value: 'miniapp', label: '小程序页面' },
  { value: 'none', label: '无跳转' },
]

export const BannerFormModal = memo(function BannerFormModal({
  open,
  editingBanner,
  onClose,
  onSave,
}: BannerFormModalProps) {
  const [form] = Form.useForm()
  const isEdit = !!editingBanner

  useEffect(() => {
    if (open) {
      if (editingBanner) {
        form.setFieldsValue({
          ...editingBanner,
          startTime: editingBanner.startTime ? dayjs(editingBanner.startTime) : null,
          endTime: editingBanner.endTime ? dayjs(editingBanner.endTime) : null,
        })
      } else {
        form.resetFields()
        form.setFieldsValue({ jumpType: 'none', enabled: true, sortOrder: 1 })
      }
    }
  }, [open, editingBanner, form])

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      onSave({
        imageUrl: values.imageUrl,
        title: values.title,
        jumpType: values.jumpType,
        jumpPath: values.jumpPath ?? '',
        sortOrder: values.sortOrder,
        enabled: values.enabled,
        startTime: values.startTime?.format('YYYY-MM-DD') ?? '',
        endTime: values.endTime?.format('YYYY-MM-DD') ?? '',
      })
      form.resetFields()
      onClose()
    } catch {
      // validation failed
    }
  }

  return (
    <Modal
      title={isEdit ? '编辑 Banner' : '新增 Banner'}
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
      <Form form={form} layout="vertical" className="mt-2" initialValues={{ enabled: true, jumpType: 'none' }}>
        <Form.Item
          name="imageUrl"
          label="图片 URL"
          rules={[{ required: true, message: '请输入图片 URL' }]}
        >
          <Input placeholder="请输入图片 URL" />
        </Form.Item>

        <Form.Item
          name="title"
          label="标题"
          rules={[{ required: true, message: '请输入标题' }, { max: 50, message: '最长 50 字' }]}
        >
          <Input maxLength={50} showCount placeholder="请输入 Banner 标题" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="jumpType"
            label="跳转类型"
            rules={[{ required: true, message: '请选择跳转类型' }]}
          >
            <Select options={jumpTypeOptions} placeholder="请选择跳转类型" />
          </Form.Item>

          <Form.Item
            name="sortOrder"
            label="排序权重"
            rules={[{ required: true, message: '请输入排序权重' }]}
          >
            <Input type="number" min={1} placeholder="数字越小越靠前" />
          </Form.Item>
        </div>

        <Form.Item
          noStyle
          shouldUpdate={(prev, curr) => prev.jumpType !== curr.jumpType}
        >
          {({ getFieldValue }) => {
            const jumpType = getFieldValue('jumpType') as JumpType
            if (jumpType === 'none') return null
            return (
              <Form.Item
                name="jumpPath"
                label={jumpType === 'h5' ? 'H5 链接' : '小程序页面路径'}
                rules={[{ required: true, message: '请输入跳转路径' }]}
              >
                <Input placeholder={jumpType === 'h5' ? 'https://...' : 'pages/...'} />
              </Form.Item>
            )
          }}
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="startTime"
            label="生效开始时间"
            rules={[{ required: true, message: '请选择开始时间' }]}
          >
            <DatePicker className="w-full" />
          </Form.Item>

          <Form.Item
            name="endTime"
            label="生效结束时间"
            rules={[{ required: true, message: '请选择结束时间' }]}
          >
            <DatePicker className="w-full" />
          </Form.Item>
        </div>

        <Form.Item name="enabled" label="生效状态" valuePropName="checked">
          <Switch checkedChildren="生效" unCheckedChildren="停用" />
        </Form.Item>
      </Form>
    </Modal>
  )
})
