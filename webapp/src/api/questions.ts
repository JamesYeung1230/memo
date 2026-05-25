import { ApiResponse } from '@/types/api'
import type { QuestionBankData } from '@/types/question-bank'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const mockData: QuestionBankData[] = [
  { id: 'q1', question: '数组和链表的主要区别是什么？', options: [{ label: 'A', content: '数组长度可变，链表长度固定' }, { label: 'B', content: '数组内存连续，链表非连续' }, { label: 'C', content: '数组只能存数字' }, { label: 'D', content: '链表访问更快' }], answer: 'B', explanation: '数组在内存中占用连续空间，链表通过指针链接不连续节点。', cardId: 'cc1', cardTitle: '数组与链表区别', domainId: 'd1', domainName: '计算机科学', enabled: true, createdAt: '2026-05-01' },
  { id: 'q2', question: '二叉树的先序遍历顺序是？', options: [{ label: 'A', content: '左-根-右' }, { label: 'B', content: '根-左-右' }, { label: 'C', content: '左-右-根' }, { label: 'D', content: '根-右-左' }], answer: 'B', explanation: '先序遍历的顺序是根节点、左子树、右子树。', cardId: 'cc2', cardTitle: '二叉树遍历方式', domainId: 'd1', domainName: '计算机科学', enabled: true, createdAt: '2026-05-02' },
  { id: 'q3', question: '死锁的必要条件不包括以下哪个？', options: [{ label: 'A', content: '互斥条件' }, { label: 'B', content: '持有并等待' }, { label: 'C', content: '优先级调度' }, { label: 'D', content: '循环等待' }], answer: 'C', explanation: '死锁的四个必要条件：互斥、持有并等待、非剥夺、循环等待。', cardId: 'cc4', cardTitle: '死锁的四个必要条件', domainId: 'd1', domainName: '计算机科学', enabled: false, createdAt: '2026-05-03' },
  { id: 'q4', question: 'P(A|B)的计算公式是？', options: [{ label: 'A', content: 'P(A|B) = P(A∩B)/P(A)' }, { label: 'B', content: 'P(A|B) = P(A∩B)/P(B)' }, { label: 'C', content: 'P(A|B) = P(A)P(B)' }, { label: 'D', content: 'P(A|B) = P(A)+P(B)' }], answer: 'B', explanation: '条件概率公式：P(A|B) = P(A∩B)/P(B)。', cardId: 'cc6', cardTitle: '贝叶斯定理', domainId: 'd2', domainName: '数学基础', enabled: true, createdAt: '2026-05-04' },
  { id: 'q5', question: '"unhappy"中的"un-"是什么？', options: [{ label: 'A', content: '后缀' }, { label: 'B', content: '前缀' }, { label: 'C', content: '词根' }, { label: 'D', content: '介词' }], answer: 'B', explanation: 'un-是否定前缀，表示"不"的意思。', cardId: 'cc7', cardTitle: '常用英语前缀', domainId: 'd3', domainName: '英语学习', enabled: true, createdAt: '2026-05-05' },
  { id: 'q6', question: '现在完成时的结构是？', options: [{ label: 'A', content: '主语 + 过去式' }, { label: 'B', content: '主语 + have/has + 过去分词' }, { label: 'C', content: '主语 + will + 动词原形' }, { label: 'D', content: '主语 + be + doing' }], answer: 'B', explanation: '现在完成时由"have/has + 过去分词"构成。', cardId: 'cc8', cardTitle: '现在完成时用法', domainId: 'd3', domainName: '英语学习', enabled: false, createdAt: '2026-05-06' },
  { id: 'q7', question: '秦始皇统一六国是在哪一年？', options: [{ label: 'A', content: '公元前221年' }, { label: 'B', content: '公元前206年' }, { label: 'C', content: '公元221年' }, { label: 'D', content: '公元581年' }], answer: 'A', explanation: '公元前221年，秦始皇嬴政统一六国，建立秦朝。', cardId: 'cc9', cardTitle: '秦朝统一六国', domainId: 'd4', domainName: '历史文化', enabled: true, createdAt: '2026-05-07' },
  { id: 'q8', question: 'DNA复制的方式是？', options: [{ label: 'A', content: '全保留复制' }, { label: 'B', content: '半保留复制' }, { label: 'C', content: '分散复制' }, { label: 'D', content: '随机复制' }], answer: 'B', explanation: 'DNA以半保留方式进行复制，每条母链作为模板合成新的子链。', cardId: 'cc10', cardTitle: 'DNA复制过程', domainId: 'd6', domainName: '生物医学', enabled: true, createdAt: '2026-05-08' },
  { id: 'q9', question: 'TCP三次握手中第二次握手发送的是什么？', options: [{ label: 'A', content: 'SYN' }, { label: 'B', content: 'SYN-ACK' }, { label: 'C', content: 'ACK' }, { label: 'D', content: 'FIN' }], answer: 'B', explanation: '第二次握手：服务器发送SYN-ACK确认客户端的SYN并请求建立连接。', cardId: 'cc12', cardTitle: 'TCP三次握手', domainId: 'd1', domainName: '计算机科学', enabled: true, createdAt: '2026-05-09' },
  { id: 'q10', question: '供大于求时价格通常会？', options: [{ label: 'A', content: '上涨' }, { label: 'B', content: '下跌' }, { label: 'C', content: '不变' }, { label: 'D', content: '先涨后跌' }], answer: 'B', explanation: '供大于求时，供给过剩导致价格下跌。', cardId: 'cc11', cardTitle: '供求关系', domainId: 'd7', domainName: '经济学', enabled: true, createdAt: '2026-05-10' },
]

let data = [...mockData]

export const questionApi = {
  async getList(params: {
    keyword?: string
    domainId?: string
    page?: number
    pageSize?: number
  }): Promise<ApiResponse<{ items: QuestionBankData[]; total: number }>> {
    await delay(300)
    let filtered = [...data]
    if (params.keyword) {
      const q = params.keyword.toLowerCase()
      filtered = filtered.filter((qb) => qb.question.toLowerCase().includes(q))
    }
    if (params.domainId) {
      filtered = filtered.filter((qb) => qb.domainId === params.domainId)
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

  async update(id: string, params: Partial<QuestionBankData>): Promise<ApiResponse<QuestionBankData>> {
    await delay(300)
    const idx = data.findIndex((q) => q.id === id)
    if (idx === -1) throw new Error('题目不存在')
    data[idx] = { ...data[idx], ...params }
    return { data: data[idx] }
  },

  async toggle(id: string, enabled: boolean): Promise<ApiResponse<null>> {
    await delay(200)
    const idx = data.findIndex((q) => q.id === id)
    if (idx !== -1) data[idx].enabled = enabled
    return { data: null }
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    await delay(300)
    data = data.filter((q) => q.id !== id)
    return { data: null }
  },
}
