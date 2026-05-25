import { useState, useCallback } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { message } from 'antd'
import { aiApi } from '@/api/ai'
import type { CardSearchItem, AiGeneratedQuestion } from '@/types/question'
import { CardSearchSection } from './CardSearchSection'
import { QuestionResultSection } from './QuestionResultSection'
import { QuestionEditModal } from './QuestionEditModal'

function AiQuestionsPage() {
  const [selectedCard, setSelectedCard] = useState<CardSearchItem | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')

  const { data: cardData, isLoading: cardLoading } = useQuery({
    queryKey: ['ai', 'cards', 'search', searchKeyword],
    queryFn: () => aiApi.searchCards(searchKeyword),
    placeholderData: (prev) => prev,
  })

  const {
    data: generateData,
    isPending: isGenerating,
    mutate: generate,
  } = useMutation({
    mutationFn: (cardId: string) => aiApi.generateQuestion(cardId),
    onSuccess: () => {
      message.success('题目生成成功！请审核编辑后采纳保存。')
    },
    onError: () => {
      message.error('生成失败，请重试')
    },
  })

  const [editModalOpen, setEditModalOpen] = useState(false)

  const handleSearch = useCallback((keyword: string) => {
    setSearchKeyword(keyword)
  }, [])

  const handleSelectCard = useCallback((card: CardSearchItem) => {
    setSelectedCard(card)
  }, [])

  const handleGenerate = useCallback(() => {
    if (selectedCard) {
      generate(selectedCard.id)
    }
  }, [selectedCard, generate])

  const handleEdit = useCallback(() => {
    setEditModalOpen(true)
  }, [])

  const handleEditSave = useCallback(
    (_values: AiGeneratedQuestion) => {
      // In real scenario, this would call the API
      message.success('题目已更新保存')
      setEditModalOpen(false)
    },
    [],
  )

  const handleSave = useCallback(() => {
    message.success('题目已采纳保存至题库')
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <h1 className="m-0 text-[28px] font-bold text-text-primary leading-tight">AI 题目生成</h1>

      <CardSearchSection
        cardList={cardData?.data ?? []}
        loading={cardLoading}
        selectedCard={selectedCard}
        onSearch={handleSearch}
        onSelectCard={handleSelectCard}
        onGenerate={handleGenerate}
        generating={isGenerating}
      />

      {generateData?.data && (
        <QuestionResultSection
          result={generateData.data}
          loading={false}
          onEdit={handleEdit}
          onSave={handleSave}
        />
      )}

      {isGenerating && (
        <QuestionResultSection result={null} loading={true} onEdit={() => {}} onSave={() => {}} />
      )}

      <QuestionEditModal
        open={editModalOpen}
        question={generateData?.data ?? null}
        onClose={() => setEditModalOpen(false)}
        onSave={handleEditSave}
      />
    </div>
  )
}

export default AiQuestionsPage
