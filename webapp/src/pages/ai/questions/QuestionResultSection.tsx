import { memo } from 'react'
import { Card, Radio } from 'antd'
import type { AiGeneratedQuestion } from '@/types/question'

interface QuestionResultSectionProps {
  result: AiGeneratedQuestion | null
  loading: boolean
  onEdit: () => void
  onSave: () => void
}

export const QuestionResultSection = memo(function QuestionResultSection({
  result,
  loading,
  onEdit,
  onSave,
}: QuestionResultSectionProps) {
  if (loading) {
    return (
      <Card title={<span className="text-base font-semibold">AI 生成结果</span>} className="shadow-sm">
        <div className="flex flex-col gap-4 animate-pulse">
          <div className="h-10 bg-gray-100 rounded-lg" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-gray-50 rounded-lg" />
          ))}
          <div className="flex justify-end gap-3">
            <div className="w-16 h-10 bg-gray-100 rounded-lg" />
            <div className="w-24 h-10 bg-gray-100 rounded-lg" />
          </div>
        </div>
      </Card>
    )
  }

  if (!result) return null

  return (
    <Card
      title={<span className="text-base font-semibold">AI 生成结果</span>}
      className="shadow-sm"
    >
      <div className="flex flex-col gap-3">
        {/* 题干 */}
        <div>
          <div className="text-sm font-medium text-gray-700 mb-1.5">题干</div>
          <div className="text-sm text-gray-900 px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-100">
            {result.stem}
          </div>
        </div>

        {/* 选项 */}
        <div>
          <div className="text-sm font-medium text-gray-700 mb-1.5">选项</div>
          <Radio.Group value={result.correctAnswer} className="w-full">
            {result.options.map((opt) => {
              const isCorrect = opt.label === result.correctAnswer
              return (
                <div
                  key={opt.label}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg mb-1.5 transition-colors ${
                    isCorrect ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-gray-100'
                  }`}
                >
                  <Radio value={opt.label} disabled className={isCorrect ? 'text-emerald-500' : ''}>
                    <span className={`text-sm font-semibold mr-1 ${isCorrect ? 'text-emerald-600' : 'text-gray-500'}`}>
                      {opt.label}.
                    </span>
                    <span className={`text-sm ${isCorrect ? 'text-emerald-700 font-medium' : 'text-gray-900'}`}>
                      {opt.text}
                    </span>
                  </Radio>
                  {isCorrect && <span className="ml-auto text-emerald-500 text-xs font-medium">✓ 正确答案</span>}
                </div>
              )
            })}
          </Radio.Group>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end items-center gap-3 mt-2">
          <button
            onClick={onEdit}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-[#6366F1] text-[#6366F1] hover:bg-indigo-50"
          >
            编辑
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
            style={{ background: '#160C57' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#2D1A8E')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#160C57')}
          >
            采纳保存
          </button>
        </div>
      </div>
    </Card>
  )
})
