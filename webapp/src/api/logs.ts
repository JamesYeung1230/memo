import { ApiResponse, PaginatedResponse } from '@/types/api'
import type { OperationLog } from '@/types/log'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const actionTypes = ['create', 'update', 'delete', 'login', 'export'] as const

const mockLogs: OperationLog[] = Array.from({ length: 68 }, (_, i) => {
  const date = new Date(2026, 4, 25 - Math.floor(i / 3), 8 + (i % 9), (i * 7) % 60)
  const actionType = actionTypes[i % actionTypes.length]
  const targets: Record<string, string[]> = {
    create: ['新增知识卡片', '新增章节', '新增领域', '新建用户'],
    update: ['修改积分规则', '更新用户信息', '编辑卡片内容', '修改配置'],
    delete: ['删除知识卡片', '删除用户评论', '删除章节', '删除领域'],
    login: ['管理员登录', '后台登录'],
    export: ['导出用户数据', '导出学习报告', '导出统计数据'],
  }
  const targetList = targets[actionType]
  return {
    id: `log_${String(i + 1).padStart(3, '0')}`,
    actionTime: `${date.toISOString().slice(0, 10)} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`,
    actionType,
    targetName: targetList[i % targetList.length],
    detail: `管理员执行了${actionType === 'create' ? '新增' : actionType === 'update' ? '修改' : actionType === 'delete' ? '删除' : actionType === 'login' ? '登录' : '导出'}操作，对象：${targetList[i % targetList.length]}`,
  }
})

export const logApi = {
  async getList(params: {
    page: number
    pageSize: number
    startTime?: string
    endTime?: string
    actionType?: string
  }): Promise<ApiResponse<PaginatedResponse<OperationLog>>> {
    await delay(400)

    let filtered = [...mockLogs]

    if (params.startTime) {
      filtered = filtered.filter((l) => l.actionTime >= params.startTime!)
    }
    if (params.endTime) {
      filtered = filtered.filter((l) => l.actionTime <= params.endTime!)
    }
    if (params.actionType) {
      filtered = filtered.filter((l) => l.actionType === params.actionType)
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
}
