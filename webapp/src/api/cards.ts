import { ApiResponse } from '@/types/api'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export interface AiGeneratedCard {
  title: string
  coreConcept: string
  detail: string
  lifeAnalogy: string
  tags: string[]
  difficulty: '入门' | '基础' | '进阶'
}

export interface AiCardGenerateHistory {
  id: string
  topic: string
  createdAt: string
  adopted: boolean
}

export interface ChapterOption {
  id: string
  name: string
  domainName: string
}

export const cardApi = {
  async generateCards(topics: string[]): Promise<ApiResponse<AiGeneratedCard[]>> {
    await delay(2000)
    return {
      data: topics.map((topic, i) => ({
        title: `${topic} 基础概念`,
        coreConcept: `${topic} 是编程中的核心概念，掌握它对于后续学习至关重要。`,
        detail: `<p><strong>${topic}</strong> 是编程语言中的基本构建块。</p><p>通过理解 ${topic}，开发者可以更好地组织和构建代码。</p><p>实际应用中，${topic} 广泛用于各种场景。</p>`,
        lifeAnalogy: `${topic} 就像日常生活中的一个基本工具，虽然简单但不可或缺。`,
        tags: [topic, '编程基础', '入门知识'],
        difficulty: i < 3 ? '入门' as const : '基础' as const,
      })),
    }
  },

  async getHistory(): Promise<ApiResponse<AiCardGenerateHistory[]>> {
    await delay(200)
    return {
      data: [
        { id: 'h1', topic: '变量与数据类型', createdAt: '2026-05-07 14:30', adopted: true },
        { id: 'h2', topic: '条件判断语句', createdAt: '2026-05-07 11:00', adopted: true },
        { id: 'h3', topic: '循环结构详解', createdAt: '2026-05-06 16:20', adopted: false },
        { id: 'h4', topic: '函数定义与参数传递', createdAt: '2026-05-06 09:10', adopted: true },
        { id: 'h5', topic: '数组操作方法', createdAt: '2026-05-05 14:00', adopted: false },
      ],
    }
  },

  async getChapters(): Promise<ApiResponse<ChapterOption[]>> {
    await delay(200)
    return {
      data: [
        { id: 'ch1', name: '变量与数据类型', domainName: '编程基础概念' },
        { id: 'ch2', name: '控制流程', domainName: '编程基础概念' },
        { id: 'ch3', name: '函数', domainName: '编程基础概念' },
        { id: 'ch4', name: 'HTTP 协议', domainName: '计算机网络基础' },
        { id: 'ch5', name: '传输层协议', domainName: '计算机网络基础' },
      ],
    }
  },
}
