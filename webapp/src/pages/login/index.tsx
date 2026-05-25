import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Form, Input, App } from 'antd'
import { UserOutlined, LockOutlined, BookOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/api/auth'
import { ROUTE_PATHS } from '@/routes/routePaths'

interface LoginForm {
  username: string
  password: string
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const { message } = App.useApp()

  const handleSubmit = async (values: LoginForm) => {
    setLoading(true)
    try {
      const result = await authApi.login(values)
      login(result.token, result.username)
      message.success('登录成功')
      navigate(ROUTE_PATHS.DASHBOARD, { replace: true })
    } catch (err) {
      message.error(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ background: 'linear-gradient(180deg, #160C57 0%, #2D1A8E 100%)' }}
    >
      <Card
        className="w-[400px]"
        styles={{ body: { padding: 32 } }}
        style={{
          borderRadius: 12,
          boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
        }}
      >
        <div className="flex flex-col items-center gap-2 mb-6">
          <BookOutlined style={{ fontSize: 48, color: '#160C57' }} />
          <h1 className="text-2xl font-bold m-0" style={{ color: '#160C57' }}>
            码上启航
          </h1>
          <p className="text-sm m-0" style={{ color: '#475569' }}>
            运营管理后台
          </p>
        </div>

        <div style={{ height: 1, background: '#E2E8F0', marginBottom: 24 }} />

        <Form
          name="login"
          onFinish={handleSubmit}
          autoComplete="off"
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="username"
            label={<span style={{ fontSize: 13, fontWeight: 500 }}>用户名</span>}
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 2, message: '用户名至少2个字符' },
            ]}
            style={{ marginBottom: 16 }}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#94A3B8' }} />}
              placeholder="请输入用户名"
              style={{ height: 44, borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span style={{ fontSize: 13, fontWeight: 500 }}>密码</span>}
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
            style={{ marginBottom: 16 }}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#94A3B8' }} />}
              placeholder="请输入密码"
              style={{ height: 44, borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: 48,
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              登 录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
