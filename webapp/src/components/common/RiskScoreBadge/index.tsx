import { memo } from 'react'

interface RiskScoreBadgeProps {
  score: number
  type?: string
}

function getRiskLevel(score: number): { label: string; color: string; bg: string } {
  if (score >= 61) return { label: '高风险', color: '#EF4444', bg: '#FEE2E2' }
  if (score >= 31) return { label: '中风险', color: '#F59E0B', bg: '#FEF3C7' }
  return { label: '低风险', color: '#10B981', bg: '#D1FAE5' }
}

export const RiskScoreBadge = memo(function RiskScoreBadge({ score, type }: RiskScoreBadgeProps) {
  const { label, color, bg } = getRiskLevel(score)
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ color, background: bg }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {type || label}
      <span>{score}分</span>
    </span>
  )
})
