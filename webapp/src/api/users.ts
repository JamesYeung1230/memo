import { ApiResponse, PaginatedResponse } from '@/types/api'
import type { UserData, UserDetail } from '@/types/user'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const mockUsers: UserData[] = Array.from({ length: 56 }, (_, i) => ({
  id: `user_${String(i + 1).padStart(3, '0')}`,
  nickname: [
    '小明', '小红', '张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十',
    '程序员小陈', '产品经理小李', '设计师小王', '测试员小张', '运营小刘',
    '前端开发者', '后端工程师', '全栈攻城狮', '数据分析师', '算法工程师',
    'Alice', 'Bob', 'Charlie', 'David', 'Eva',
    '学习达人', '知识爱好者', '编程小白', '技术大牛', '码农日常',
    '雨后的天空', '星辰大海', '追梦少年', '静水流深', '乘风破浪',
    '书虫', '学无止境', '知识就是力量', '终身学习者', '求知若渴',
    'SpringBoot', 'ReactFan', 'TypeScript', 'Pythonista', 'GolangDev',
    '清晨的阳光', '午后的咖啡', '夜晚的星星', '远方的诗', '脚下的路',
    'AI探索者', '数据挖掘工', '云原生玩家', '微服务架构师', '容器化实践者',
  ][i] || `用户${i + 1}`,
  avatarUrl: '',
  openId: `openid_${String(i + 1).padStart(8, '0')}_wx`,
  pointsBalance: Math.floor(Math.random() * 10000),
  registerTime: new Date(2025, 0, 1 + i).toISOString().replace('T', ' ').slice(0, 19),
  lastActiveTime: new Date(2026, 4, 1 + (i % 25)).toISOString().replace('T', ' ').slice(0, 19),
})).reverse() // 按注册时间倒序

export const userApi = {
  async getList(params: {
    page: number
    pageSize: number
    keyword?: string
  }): Promise<ApiResponse<PaginatedResponse<UserData>>> {
    await delay(400)

    let filtered = [...mockUsers]
    if (params.keyword) {
      const kw = params.keyword.toLowerCase()
      filtered = filtered.filter(
        (u) => u.nickname.toLowerCase().includes(kw) || u.openId.toLowerCase().includes(kw),
      )
    }

    const total = filtered.length
    const totalPages = Math.ceil(total / params.pageSize)
    const start = (params.page - 1) * params.pageSize
    const items = filtered.slice(start, start + params.pageSize)

    return {
      data: {
        items,
        total,
        page: params.page,
        pageSize: params.pageSize,
        totalPages,
      },
    }
  },

  async getDetail(id: string): Promise<ApiResponse<UserDetail>> {
    await delay(300)
    const user = mockUsers.find((u) => u.id === id)
    if (!user) {
      throw new Error('用户不存在')
    }
    return {
      data: {
        user,
        stats: {
          cardCount: Math.floor(Math.random() * 200),
          answerCount: Math.floor(Math.random() * 500),
          pointsBalance: user.pointsBalance,
          noteCount: Math.floor(Math.random() * 50),
        },
        learningRecords: [
          { id: 'lr1', cardTitle: 'JavaScript 基础概念', learnedAt: '2026-05-24 14:30:00' },
          { id: 'lr2', cardTitle: 'React 组件生命周期', learnedAt: '2026-05-24 10:15:00' },
          { id: 'lr3', cardTitle: 'HTTP 协议详解', learnedAt: '2026-05-23 16:45:00' },
          { id: 'lr4', cardTitle: 'TypeScript 类型系统', learnedAt: '2026-05-23 09:20:00' },
          { id: 'lr5', cardTitle: 'CSS Flexbox 布局', learnedAt: '2026-05-22 11:00:00' },
        ],
        pointRecords: [
          { id: 'pr1', changeAmount: 10, reason: '学习卡片奖励', createdAt: '2026-05-24 14:30:00' },
          { id: 'pr2', changeAmount: -5, reason: '解锁章节消耗', createdAt: '2026-05-24 12:00:00' },
          { id: 'pr3', changeAmount: 20, reason: '完成挑战', createdAt: '2026-05-24 10:15:00' },
          { id: 'pr4', changeAmount: 5, reason: '每日签到', createdAt: '2026-05-24 08:00:00' },
          { id: 'pr5', changeAmount: 15, reason: '撰写笔记奖励', createdAt: '2026-05-23 16:45:00' },
        ],
      },
    }
  },
}
