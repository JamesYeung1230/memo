import { ApiResponse } from '@/types/api'
import type { CardData, Difficulty } from '@/types/card'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const mockData: CardData[] = [
  { id: 'cc1', title: '数组与链表区别', content: '数组是连续内存空间，链表是非连续...', chapterId: 'ch1', chapterName: '数据结构与算法', domainId: 'd1', domainName: '计算机科学', difficulty: 'easy', enabled: true, createdAt: '2026-05-01' },
  { id: 'cc2', title: '二叉树遍历方式', content: '前序、中序、后序、层序遍历...', chapterId: 'ch1', chapterName: '数据结构与算法', domainId: 'd1', domainName: '计算机科学', difficulty: 'medium', enabled: true, createdAt: '2026-05-02' },
  { id: 'cc3', title: '进程与线程', content: '进程是资源分配的基本单位...', chapterId: 'ch2', chapterName: '操作系统原理', domainId: 'd1', domainName: '计算机科学', difficulty: 'medium', enabled: true, createdAt: '2026-05-03' },
  { id: 'cc4', title: '死锁的四个必要条件', content: '互斥、持有并等待、非剥夺、循环等待...', chapterId: 'ch2', chapterName: '操作系统原理', domainId: 'd1', domainName: '计算机科学', difficulty: 'hard', enabled: false, createdAt: '2026-05-04' },
  { id: 'cc5', title: '矩阵乘法', content: '两个矩阵相乘，前矩阵列数需等于后矩阵行数...', chapterId: 'ch4', chapterName: '线性代数', domainId: 'd2', domainName: '数学基础', difficulty: 'medium', enabled: true, createdAt: '2026-05-05' },
  { id: 'cc6', title: '贝叶斯定理', content: 'P(A|B) = P(B|A)P(A)/P(B)...', chapterId: 'ch5', chapterName: '概率统计', domainId: 'd2', domainName: '数学基础', difficulty: 'hard', enabled: true, createdAt: '2026-05-06' },
  { id: 'cc7', title: '常用英语前缀', content: 'un-表示否定，re-表示重新...', chapterId: 'ch7', chapterName: '词汇积累', domainId: 'd3', domainName: '英语学习', difficulty: 'easy', enabled: true, createdAt: '2026-05-07' },
  { id: 'cc8', title: '现在完成时用法', content: 'have/has + 过去分词表示过去发生的动作对现在的影响...', chapterId: 'ch8', chapterName: '语法精讲', domainId: 'd3', domainName: '英语学习', difficulty: 'medium', enabled: false, createdAt: '2026-05-08' },
  { id: 'cc9', title: '秦朝统一六国', content: '公元前221年秦始皇统一六国...', chapterId: 'ch10', chapterName: '中国古代史', domainId: 'd4', domainName: '历史文化', difficulty: 'easy', enabled: true, createdAt: '2026-05-09' },
  { id: 'cc10', title: 'DNA复制过程', content: '半保留复制，DNA聚合酶催化...', chapterId: 'ch13', chapterName: '分子生物学', domainId: 'd6', domainName: '生物医学', difficulty: 'hard', enabled: true, createdAt: '2026-05-10' },
  { id: 'cc11', title: '供求关系', content: '供大于求价格下降，供不应求价格上涨...', chapterId: 'ch14', chapterName: '微观经济学', domainId: 'd7', domainName: '经济学', difficulty: 'medium', enabled: true, createdAt: '2026-05-11' },
  { id: 'cc12', title: 'TCP三次握手', content: 'SYN, SYN-ACK, ACK 建立连接的过程...', chapterId: 'ch3', chapterName: '计算机网络', domainId: 'd1', domainName: '计算机科学', difficulty: 'medium', enabled: true, createdAt: '2026-05-12' },
]

let data = [...mockData]

export const cardsContentApi = {
  async getList(params: {
    keyword?: string
    domainId?: string
    chapterId?: string
    difficulty?: Difficulty
    page?: number
    pageSize?: number
  }): Promise<ApiResponse<{ items: CardData[]; total: number }>> {
    await delay(300)
    let filtered = [...data]
    if (params.keyword) {
      const q = params.keyword.toLowerCase()
      filtered = filtered.filter((c) => c.title.toLowerCase().includes(q))
    }
    if (params.domainId) {
      filtered = filtered.filter((c) => c.domainId === params.domainId)
    }
    if (params.chapterId) {
      filtered = filtered.filter((c) => c.chapterId === params.chapterId)
    }
    if (params.difficulty) {
      filtered = filtered.filter((c) => c.difficulty === params.difficulty)
    }
    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const start = (page - 1) * pageSize
    return {
      data: {
        items: filtered.slice(start, start + pageSize),
        total: filtered.length,
      },
    }
  },

  async update(id: string, params: Partial<CardData>): Promise<ApiResponse<CardData>> {
    await delay(300)
    const idx = data.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error('卡片不存在')
    data[idx] = { ...data[idx], ...params }
    return { data: data[idx] }
  },

  async toggle(id: string, enabled: boolean): Promise<ApiResponse<null>> {
    await delay(200)
    const idx = data.findIndex((c) => c.id === id)
    if (idx !== -1) data[idx].enabled = enabled
    return { data: null }
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    await delay(300)
    data = data.filter((c) => c.id !== id)
    return { data: null }
  },
}
