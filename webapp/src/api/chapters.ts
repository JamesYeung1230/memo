import { ApiResponse } from '@/types/api'
import type { ChapterData } from '@/types/chapter'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const domainNames: Record<string, string> = {
  d1: '计算机科学',
  d2: '数学基础',
  d3: '英语学习',
  d4: '历史文化',
  d5: '物理科学',
  d6: '生物医学',
  d7: '经济学',
  d8: '哲学思考',
}

const mockData: ChapterData[] = [
  { id: 'ch1', name: '数据结构与算法', domainId: 'd1', domainName: '计算机科学', enabled: true, sortOrder: 1, createdAt: '2026-05-01' },
  { id: 'ch2', name: '操作系统原理', domainId: 'd1', domainName: '计算机科学', enabled: true, sortOrder: 2, createdAt: '2026-05-02' },
  { id: 'ch3', name: '计算机网络', domainId: 'd1', domainName: '计算机科学', enabled: false, sortOrder: 3, createdAt: '2026-05-03' },
  { id: 'ch4', name: '线性代数', domainId: 'd2', domainName: '数学基础', enabled: true, sortOrder: 1, createdAt: '2026-05-04' },
  { id: 'ch5', name: '概率统计', domainId: 'd2', domainName: '数学基础', enabled: true, sortOrder: 2, createdAt: '2026-05-05' },
  { id: 'ch6', name: '微积分', domainId: 'd2', domainName: '数学基础', enabled: true, sortOrder: 3, createdAt: '2026-05-06' },
  { id: 'ch7', name: '词汇积累', domainId: 'd3', domainName: '英语学习', enabled: true, sortOrder: 1, createdAt: '2026-05-07' },
  { id: 'ch8', name: '语法精讲', domainId: 'd3', domainName: '英语学习', enabled: false, sortOrder: 2, createdAt: '2026-05-08' },
  { id: 'ch9', name: '阅读理解', domainId: 'd3', domainName: '英语学习', enabled: true, sortOrder: 3, createdAt: '2026-05-09' },
  { id: 'ch10', name: '中国古代史', domainId: 'd4', domainName: '历史文化', enabled: true, sortOrder: 1, createdAt: '2026-05-10' },
  { id: 'ch11', name: '世界近代史', domainId: 'd4', domainName: '历史文化', enabled: true, sortOrder: 2, createdAt: '2026-05-11' },
  { id: 'ch12', name: '力学基础', domainId: 'd5', domainName: '物理科学', enabled: false, sortOrder: 1, createdAt: '2026-05-12' },
  { id: 'ch13', name: '分子生物学', domainId: 'd6', domainName: '生物医学', enabled: true, sortOrder: 1, createdAt: '2026-05-13' },
  { id: 'ch14', name: '微观经济学', domainId: 'd7', domainName: '经济学', enabled: false, sortOrder: 1, createdAt: '2026-05-14' },
  { id: 'ch15', name: '逻辑与批判思维', domainId: 'd8', domainName: '哲学思考', enabled: true, sortOrder: 1, createdAt: '2026-05-15' },
]

let data = [...mockData]

export const chapterApi = {
  async getList(params: { domainId?: string }): Promise<ApiResponse<ChapterData[]>> {
    await delay(300)
    let filtered = [...data]
    if (params.domainId) {
      filtered = filtered.filter((c) => c.domainId === params.domainId)
    }
    const sorted = filtered.sort((a, b) => a.sortOrder - b.sortOrder)
    return { data: sorted }
  },

  async create(params: { name: string; domainId: string }): Promise<ApiResponse<ChapterData>> {
    await delay(400)
    const chapters = data.filter((c) => c.domainId === params.domainId)
    const maxSort = chapters.reduce((max, c) => Math.max(max, c.sortOrder), 0)
    const item: ChapterData = {
      id: `ch${Date.now()}`,
      name: params.name,
      domainId: params.domainId,
      domainName: domainNames[params.domainId] || '未知领域',
      enabled: true,
      sortOrder: maxSort + 1,
      createdAt: '2026-05-25',
    }
    data.push(item)
    return { data: item }
  },

  async update(id: string, params: Partial<ChapterData>): Promise<ApiResponse<ChapterData>> {
    await delay(300)
    const idx = data.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error('章节不存在')
    data[idx] = { ...data[idx], ...params }
    return { data: data[idx] }
  },

  async toggle(id: string, enabled: boolean): Promise<ApiResponse<null>> {
    await delay(200)
    const idx = data.findIndex((c) => c.id === id)
    if (idx !== -1) data[idx].enabled = enabled
    return { data: null }
  },

  async reorder(ids: string[]): Promise<ApiResponse<null>> {
    await delay(200)
    const orderMap: Record<string, number> = {}
    ids.forEach((id, i) => { orderMap[id] = i + 1 })
    data.forEach((c) => {
      if (orderMap[c.id] !== undefined) c.sortOrder = orderMap[c.id]
    })
    return { data: null }
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    await delay(300)
    data = data.filter((c) => c.id !== id)
    return { data: null }
  },
}
