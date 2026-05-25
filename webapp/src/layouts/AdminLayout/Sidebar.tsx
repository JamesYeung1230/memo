import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu } from 'antd'
import {
  DashboardOutlined,
  RobotOutlined,
  FileTextOutlined,
  SettingOutlined,
  UserOutlined,
  BarChartOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import { ROUTE_PATHS } from '@/routes/routePaths'

const menuItems = [
  {
    key: ROUTE_PATHS.DASHBOARD,
    icon: <DashboardOutlined />,
    label: '工作台',
  },
  {
    key: 'ai',
    icon: <RobotOutlined />,
    label: 'AI 内容工作台',
    children: [
      { key: ROUTE_PATHS.AI_CARDS, label: 'AI 知识卡片生成' },
      { key: ROUTE_PATHS.AI_QUESTIONS, label: 'AI 题目生成' },
      { key: ROUTE_PATHS.AI_REVIEW, label: 'AI 审核管理' },
      { key: ROUTE_PATHS.AI_SENSITIVE_WORDS, label: '敏感词库管理' },
    ],
  },
  {
    key: 'content',
    icon: <FileTextOutlined />,
    label: '内容管理',
    children: [
      { key: ROUTE_PATHS.CONTENT_DOMAINS, label: '知识领域管理' },
      { key: ROUTE_PATHS.CONTENT_CHAPTERS, label: '知识章节管理' },
      { key: ROUTE_PATHS.CONTENT_CARDS, label: '知识卡片管理' },
      { key: ROUTE_PATHS.CONTENT_QUESTIONS, label: '题库管理' },
    ],
  },
  {
    key: 'operation',
    icon: <ToolOutlined />,
    label: '运营配置',
    children: [
      { key: ROUTE_PATHS.OPERATION_POINTS, label: '积分规则' },
      { key: ROUTE_PATHS.OPERATION_UNLOCK, label: '解锁消耗' },
      { key: ROUTE_PATHS.OPERATION_HOMEPAGE, label: '首页运营' },
      { key: ROUTE_PATHS.OPERATION_BADGES, label: '成就徽章' },
      { key: ROUTE_PATHS.OPERATION_ADS, label: '广告配置' },
      { key: ROUTE_PATHS.OPERATION_REVIEW, label: '复习默认配置' },
    ],
  },
  {
    key: ROUTE_PATHS.ANALYTICS_OVERVIEW,
    icon: <BarChartOutlined />,
    label: '数据看板',
  },
  {
    key: ROUTE_PATHS.USERS,
    icon: <UserOutlined />,
    label: '用户管理',
  },
  {
    key: 'system',
    icon: <SettingOutlined />,
    label: '系统管理',
    children: [
      { key: ROUTE_PATHS.SYSTEM_PASSWORD, label: '修改密码' },
      { key: ROUTE_PATHS.SYSTEM_LOGS, label: '操作日志' },
    ],
  },
]

/** 获取给定路径对应的所有父菜单 key */
function getParentKeys(pathname: string): string[] {
  return menuItems
    .filter((item) => item.children?.some((child) => child.key === pathname))
    .map((item) => item.key)
}

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const selectedKey = location.pathname

  const [openKeys, setOpenKeys] = useState<string[]>(() => getParentKeys(selectedKey))

  // 路由变化时自动展开对应的父菜单（不覆盖用户手动折叠）
  useEffect(() => {
    const keys = getParentKeys(location.pathname)
    if (keys.length > 0) {
      setOpenKeys((prev) => {
        const merged = new Set([...prev, ...keys])
        return Array.from(merged)
      })
    }
  }, [location.pathname])

  return (
    <div className="flex flex-col h-full" style={{ background: '#160C57' }}>
      <div className="flex items-center h-14 px-6 text-white font-semibold text-base shrink-0">
        码上启航
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        openKeys={openKeys}
        onOpenChange={setOpenKeys}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{ background: 'transparent', borderInlineEnd: 'none' }}
      />
    </div>
  )
}
