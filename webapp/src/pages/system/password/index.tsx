import { useState, useCallback } from 'react'
import { Input, Button, Form, message } from 'antd'
import { authApi } from '@/api/auth'

function PasswordPage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleSubmit = useCallback(async (values: { oldPassword: string; newPassword: string; confirmPassword: string }) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次输入的新密码不一致')
      return
    }
    setLoading(true)
    try {
      await authApi.changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      })
      message.success('密码修改成功')
      form.resetFields()
    } catch (err) {
      message.error((err as Error).message || '密码修改失败')
    } finally {
      setLoading(false)
    }
  }, [form])

  return (
    <div className="flex flex-col gap-6">
      <h1 className="m-0 text-[28px] font-bold text-text-primary leading-tight">修改密码</h1>

      <div className="max-w-lg">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="oldPassword"
            label="当前密码"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password
              placeholder="请输入当前密码"
              className="max-w-sm"
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度不能少于 6 位' },
            ]}
          >
            <Input.Password
              placeholder="请输入新密码"
              className="max-w-sm"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请再次输入新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password
              placeholder="请再次输入新密码"
              className="max-w-sm"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{ background: '#160C57' }}
            >
              保存
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

export default PasswordPage
