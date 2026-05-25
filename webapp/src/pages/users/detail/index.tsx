import { memo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Modal, Avatar, Skeleton } from 'antd'
import {
  ReadOutlined,
  QuestionCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { userApi } from '@/api/users'
import type { UserData } from '@/types/user'
import { formatDate } from '@/utils/format'

interface UserDetailModalProps {
  userId: string
  open: boolean
  onClose: () => void
}

interface UserInfoHeaderProps {
  user: UserData
}

const UserInfoHeader = memo(function UserInfoHeader({ user }: UserInfoHeaderProps) {
  return (
    <div className="flex items-center gap-4 pb-5 border-b border-[#E2E8F0]">
      <Avatar
        size={64}
        className="bg-brand-primary text-white text-xl shrink-0"
      >
        {user.nickname.charAt(0)}
      </Avatar>
      <div className="flex flex-col gap-1">
        <span className="text-lg font-semibold text-[#0F172A]">{user.nickname}</span>
        <span className="text-sm text-[#64748B]">{user.openId}</span>
      </div>
    </div>
  )
})

interface StatGridProps {
  cardCount: number
  answerCount: number
  pointsBalance: number
  noteCount: number
}

const StatGrid = memo(function StatGrid({
  cardCount,
  answerCount,
  pointsBalance,
  noteCount,
}: StatGridProps) {
  const stats = [
    { label: '学习卡片数', value: cardCount, icon: <ReadOutlined /> },
    { label: '答题数', value: answerCount, icon: <QuestionCircleOutlined /> },
    { label: '积分余额', value: pointsBalance, icon: <DollarOutlined />, highlight: true },
    { label: '笔记数', value: noteCount, icon: <FileTextOutlined /> },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 mt-5">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-3 p-4 rounded-lg bg-[#F8FAFC]"
        >
          <span className={`text-lg ${stat.highlight ? 'text-[#160C57]' : 'text-[#64748B]'}`}>
            {stat.icon}
          </span>
          <div className="flex flex-col">
            <span className="text-xs text-[#64748B]">{stat.label}</span>
            <span className={`text-xl font-bold ${stat.highlight ? 'text-[#160C57]' : 'text-[#0F172A]'}`}>
              {stat.value.toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
})

interface LearningRecordItemProps {
  title: string
  time: string
}

const LearningRecordItem = memo(function LearningRecordItem({ title, time }: LearningRecordItemProps) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-[#F4F2FA] transition-colors">
      <span className="text-sm text-[#0F172A]">{title}</span>
      <span className="text-xs text-[#94A3B8] shrink-0">{formatDate(time)}</span>
    </div>
  )
})

interface PointRecordItemProps {
  amount: number
  reason: string
  time: string
}

const PointRecordItem = memo(function PointRecordItem({ amount, reason, time }: PointRecordItemProps) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-[#F4F2FA] transition-colors">
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${amount >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
          {amount >= 0 ? `+${amount}` : amount}
        </span>
        <span className="text-sm text-[#0F172A]">{reason}</span>
      </div>
      <span className="text-xs text-[#94A3B8] shrink-0">{formatDate(time)}</span>
    </div>
  )
})

export function UserDetailModal({ userId, open, onClose }: UserDetailModalProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['user', 'detail', userId],
    queryFn: () => userApi.getDetail(userId),
    enabled: open,
  })

  const detail = data?.data

  return (
    <Modal
      title="用户详情"
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
      destroyOnClose
    >
      {isLoading ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton.Avatar active size={64} shape="circle" />
            <Skeleton active paragraph={{ rows: 1 }} title={{ width: 120 }} />
          </div>
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      ) : detail ? (
        <div className="flex flex-col">
          <UserInfoHeader user={detail.user} />

          <StatGrid
            cardCount={detail.stats.cardCount}
            answerCount={detail.stats.answerCount}
            pointsBalance={detail.stats.pointsBalance}
            noteCount={detail.stats.noteCount}
          />

          {/* Learning Records */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-[#0F172A] mb-3">学习记录</h3>
            {detail.learningRecords.length > 0 ? (
              <div className="space-y-1">
                {detail.learningRecords.map((record) => (
                  <LearningRecordItem
                    key={record.id}
                    title={record.cardTitle}
                    time={record.learnedAt}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#94A3B8] py-2">暂无学习记录</p>
            )}
          </div>

          {/* Point Records */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-[#0F172A] mb-3">积分记录</h3>
            {detail.pointRecords.length > 0 ? (
              <div className="space-y-1">
                {detail.pointRecords.map((record) => (
                  <PointRecordItem
                    key={record.id}
                    amount={record.changeAmount}
                    reason={record.reason}
                    time={record.createdAt}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#94A3B8] py-2">暂无积分记录</p>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
