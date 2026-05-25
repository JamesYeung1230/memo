import { Outlet } from 'react-router-dom'
import { Layout } from 'antd'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

const { Sider, Content } = Layout

export function AdminLayout() {
  return (
    <Layout className="h-screen">
      <Sider width={240} theme="dark" className="overflow-auto">
        <Sidebar />
      </Sider>
      <Layout>
        <Header />
        <Content className="overflow-auto p-6" style={{ maxWidth: 1280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
