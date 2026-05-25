import { memo } from 'react'

interface StatusBadgeProps {
  status: string
}

const statusStyles: Record<string, string> = {
  active: 'bg-[#D1FAE5] text-[#065F46]',
  enabled: 'bg-[#D1FAE5] text-[#065F46]',
  approved: 'bg-[#D1FAE5] text-[#065F46]',
  published: 'bg-[#D1FAE5] text-[#065F46]',
  inactive: 'bg-[#FEE2E2] text-[#991B1B]',
  disabled: 'bg-[#FEE2E2] text-[#991B1B]',
  rejected: 'bg-[#FEE2E2] text-[#991B1B]',
  auto_rejected: 'bg-[#FEE2E2] text-[#991B1B]',
  reviewing: 'bg-[#FEF3C7] text-[#92400E]',
  pending: 'bg-[#FEF3C7] text-[#92400E]',
  pending_manual: 'bg-[#FEF3C7] text-[#92400E]',
  draft: 'bg-[#F1F5F9] text-[#475569]',
  free: 'bg-[#DBEAFE] text-[#1E40AF]',
}

const statusLabels: Record<string, string> = {
  active: '上架',
  enabled: '启用',
  approved: '通过',
  published: '已发布',
  inactive: '下架',
  disabled: '停用',
  rejected: '驳回',
  auto_rejected: '自动驳回',
  reviewing: '审核中',
  pending: '待处理',
  pending_manual: '待审核',
  draft: '草稿',
  free: '免费',
}

export const StatusBadge = memo(function StatusBadge({ status }: StatusBadgeProps) {
  const style = statusStyles[status] || 'bg-[#F1F5F9] text-[#475569]'
  const label = statusLabels[status] || status
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {label}
    </span>
  )
})
