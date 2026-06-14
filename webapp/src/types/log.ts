export interface OperationLog {
  id: string
  created_at: string
  action_type: string
  target_type: string
  target_id: string
  operator: string
  detail: Record<string, unknown> | null
  ip_address: string | null
}

/** Human-readable action type label map */
export const actionTypeLabels: Record<string, string> = {
  create: '新增',
  update: '修改',
  delete: '删除',
  login: '登录',
  export: '导出',
}

import type { SelectProps } from 'antd'

export const actionTypeOptions: SelectProps['options'] = [
  { value: 'create', label: '新增' },
  { value: 'update', label: '修改' },
  { value: 'delete', label: '删除' },
  { value: 'login', label: '登录' },
  { value: 'export', label: '导出' },
]
