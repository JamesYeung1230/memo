import { useState } from 'react'
import { InboxOutlined, LoadingOutlined } from '@ant-design/icons'
import type { ComponentType } from 'react'

interface EmptyStateProps {
  description: string
  secondaryText?: string
  actionText?: string
  onAction?: () => void | Promise<void>
  icon?: ComponentType<{ className?: string }>
}

export function EmptyState({ description, secondaryText, actionText, onAction, icon: Icon = InboxOutlined }: EmptyStateProps) {
  const [loading, setLoading] = useState(false)

  const handleAction = async () => {
    if (!onAction || loading) return
    setLoading(true)
    try {
      await onAction()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Icon className="text-[64px] text-[#94A3B8]" />
      <p className="mt-4 text-base text-[#475569]">{description}</p>
      {secondaryText && (
        <p className="mt-1 text-sm text-[#94A3B8]">{secondaryText}</p>
      )}
      {actionText && onAction && (
        <button
          onClick={handleAction}
          disabled={loading}
          className="mt-4 h-10 rounded-md border border-[#6366F1] px-5 text-sm font-medium text-[#6366F1] transition-colors hover:bg-[#EEF2FF] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <LoadingOutlined className="mr-1.5" />}
          {actionText}
        </button>
      )}
    </div>
  )
}
