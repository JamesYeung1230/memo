import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Form, Input, App } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
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
      message.success('login success')
      navigate(ROUTE_PATHS.DASHBOARD, { replace: true })
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ background: 'linear-gradient(135deg, #160C57 0%, #2D1A8E 100%)' }}
    >
      <Card className="w-[400px]">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-1" style={{ color: '#160C57' }}>
            CodeSail
          </h2>
          <p className="text-gray-500">Admin</p>
        </div>

        <Form name="login" onFinish={handleSubmit} autoComplete="off" size="large">
          <Form.Item
            name="username"
            rules={[
              { required: true, message: 'username required' },
              { min: 2, message: 'min 2 chars' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="username" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'password required' },
              { min: 6, message: 'min 6 chars' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Login
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
