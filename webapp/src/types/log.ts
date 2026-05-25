export interface OperationLog {
  id: string
  actionTime: string
  actionType: string
  targetName: string
  detail: string
}

import type { SelectProps } from 'antd'

export const actionTypeOptions: SelectProps['options'] = [
  { value: 'create', label: '新增' },
  { value: 'update', label: '修改' },
  { value: 'delete', label: '删除' },
  { value: 'login', label: '登录' },
  { value: 'export', label: '导出' },
]
