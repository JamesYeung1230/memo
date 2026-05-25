import { useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { UserDetailModal } from './index'

function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const handleClose = useCallback(() => {
    navigate('/users', { replace: true })
  }, [navigate])

  if (!id) {
    navigate('/users', { replace: true })
    return null
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/users')}
          className="text-gray-500"
        />
        <h1 className="m-0 text-[28px] font-bold text-text-primary leading-tight">用户详情</h1>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl">
        <UserDetailModal userId={id} open={true} onClose={handleClose} />
      </div>
    </div>
  )
}

export default UserDetailPage
