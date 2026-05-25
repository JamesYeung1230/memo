import { ApiResponse } from '@/types/api'
import type { SensitiveWordData } from '@/types/sensitive-word'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const mockData: SensitiveWordData[] = [
  { id: 'sw1', word: '违禁品', matchMode: 'exact', enabled: true, createdAt: '2026-05-23' },
  { id: 'sw2', word: 'falun', matchMode: 'pinyin', enabled: true, createdAt: '2026-05-22' },
  { id: 'sw3', word: '法轮', matchMode: 'homophone', enabled: false, createdAt: '2026-05-21' },
  { id: 'sw4', word: '\\d{17}[\\dXx]', matchMode: 'regex', enabled: true, createdAt: '2026-05-20' },
  { id: 'sw5', word: '赌博', matchMode: 'exact', enabled: true, createdAt: '2026-05-19' },
  { id: 'sw6', word: 'se qing', matchMode: 'pinyin', enabled: true, createdAt: '2026-05-18' },
  { id: 'sw7', word: '毒品', matchMode: 'exact', enabled: false, createdAt: '2026-05-17' },
  { id: 'sw8', word: 'fa lun', matchMode: 'pinyin', enabled: true, createdAt: '2026-05-16' },
  { id: 'sw9', word: '暴力', matchMode: 'exact', enabled: true, createdAt: '2026-05-15' },
  { id: 'sw10', word: '吸D', matchMode: 'homophone', enabled: false, createdAt: '2026-05-14' },
  { id: 'sw11', word: '代开fa票', matchMode: 'homophone', enabled: true, createdAt: '2026-05-13' },
  { id: 'sw12', word: '1xbet', matchMode: 'regex', enabled: true, createdAt: '2026-05-12' },
]

export const sensitiveWordApi = {
  async getList(params: { keyword?: string; page?: number; pageSize?: number }): Promise<ApiResponse<{ items: SensitiveWordData[]; total: number }>> {
    await delay(300)
    let filtered = [...mockData]
    if (params.keyword) {
      const q = params.keyword.toLowerCase()
      filtered = filtered.filter((w) => w.word.toLowerCase().includes(q))
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

  async create(_word: string, _matchMode: string): Promise<ApiResponse<SensitiveWordData>> {
    await delay(400)
    return { data: { id: 'new', word: _word, matchMode: _matchMode as any, enabled: true, createdAt: '2026-05-25' } }
  },

  async update(_id: string, _data: Partial<SensitiveWordData>): Promise<ApiResponse<SensitiveWordData>> {
    await delay(300)
    return { data: { id: _id, word: '', matchMode: 'exact', enabled: true, createdAt: '' } }
  },

  async toggle(_id: string, _enabled: boolean): Promise<ApiResponse<null>> {
    await delay(200)
    return { data: null }
  },

  async delete(_id: string): Promise<ApiResponse<null>> {
    await delay(200)
    return { data: null }
  },

  async batchDelete(_ids: string[]): Promise<ApiResponse<null>> {
    await delay(300)
    return { data: null }
  },
}
