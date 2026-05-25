import { useLocation, useNavigate } from 'react-router-dom'
import { Breadcrumb, Button, Dropdown, Space, theme } from 'antd'
import { LogoutOutlined, MoonOutlined, SunOutlined, UserOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'

const breadcrumbMap: Record<string, string> = {
  '/dashboard': '工作台',
  '/ai/cards': 'AI 知识卡片生成',
  '/ai/questions': 'AI 题目生成',
  '/ai/review': 'AI 审核管理',
  '/ai/sensitive-words': '敏感词库管理',
  '/content/domains': '知识领域管理',
  '/content/chapters': '知识章节管理',
  '/content/cards': '知识卡片管理',
  '/content/questions': '题库管理',
  '/operation/points': '积分规则',
  '/operation/unlock': '解锁消耗',
  '/operation/homepage': '首页运营',
  '/operation/badges': '成就徽章',
  '/operation/ads': '广告配置',
  '/operation/review': '复习默认配置',
  '/analytics/overview': '核心指标',
  '/analytics/content': '内容数据',
  '/analytics/users': '用户数据',
  '/analytics/revenue': '积分与广告',
  '/users': '用户列表',
  '/system/password': '修改密码',
  '/system/logs': '操作日志',
}

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { username, logout } = useAuthStore()
  const { mode, toggle } = useThemeStore()
  const { token } = theme.useToken()

  const pathSnippets = location.pathname.split('/').filter(Boolean)
  const breadcrumbItems = [
    { title: '首页', onClick: () => navigate('/dashboard'), style: { cursor: 'pointer' } },
    ...pathSnippets.map((_, index) => {
      const url = `/${pathSnippets.slice(0, index + 1).join('/')}`
      const name = breadcrumbMap[url]
      return name ? { title: name } : null
    }).filter((item): item is NonNullable<typeof item> => item !== null),
  ]

  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？')) {
      logout()
      navigate('/login')
    }
  }

  const userMenuItems = [
    { key: 'password', icon: <UserOutlined />, label: '修改密码', onClick: () => navigate('/system/password') },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
  ]

  return (
    <div
      className="flex items-center justify-between h-14 px-6"
      style={{ background: token.colorBgContainer, borderBottom: `1px solid ${token.colorBorderSecondary}` }}
    >
      <Breadcrumb items={breadcrumbItems} />
      <Space size="middle">
        <Button
          type="text"
          icon={mode === 'light' ? <MoonOutlined /> : <SunOutlined />}
          onClick={toggle}
        />
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Button type="text" icon={<UserOutlined />}>
            {username || '管理员'}
          </Button>
        </Dropdown>
      </Space>
    </div>
  )
}
