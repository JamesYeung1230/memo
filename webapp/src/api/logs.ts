import type { ApiResponse, PaginatedResponse, PaginationMeta } from '@/types/api'
import type { OperationLog } from '@/types/log'
import apiClient from './client'

export const logApi = {
  /**
   * GET /api/v1/admin/logs — paginated, filterable operation log list
   * Note: Backend does not yet support startTime/endTime filters.
   */
  async getList(params: {
    page: number
    pageSize: number
    startTime?: string
    endTime?: string
    actionType?: string
  }): Promise<ApiResponse<PaginatedResponse<OperationLog>>> {
    const res = await apiClient.get('/admin/logs', {
      params: {
        page: params.page,
        page_size: params.pageSize,
        action_type: params.actionType || undefined,
      },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = res as any

    const items: OperationLog[] = (body.data as Record<string, unknown>[]).map(
      (item: Record<string, unknown>) => ({
        id: item.id as string,
        created_at: item.created_at as string,
        action_type: item.action_type as string,
        target_type: item.target_type as string,
        target_id: item.target_id as string,
        operator: item.operator as string,
        detail: (item.detail as Record<string, unknown>) ?? null,
        ip_address: (item.ip_address as string) ?? null,
      }),
    )

    const meta = body.meta as PaginationMeta

    return {
      data: {
        items,
        total: meta.total,
        page: meta.page,
        pageSize: meta.page_size,
        totalPages: Math.ceil(meta.total / meta.page_size),
      },
    }
  },
}
