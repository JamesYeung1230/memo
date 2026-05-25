import { useState, useCallback } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Table, InputNumber, Button, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { unlockApi } from '@/api/unlock'
import type { UnlockConfig } from '@/types/unlock'
import { StatusBadge } from '@/components/common/StatusBadge'

function UnlockPage() {
  const [editMap, setEditMap] = useState<Record<string, number>>({})
  const [modifiedIds, setModifiedIds] = useState<Set<string>>(new Set())

  const { data, isLoading } = useQuery({
    queryKey: ['unlock-configs'],
    queryFn: () => unlockApi.getList(),
  })

  const batchMutation = useMutation({
    mutationFn: (updates: { domainId: string; unlockPoints: number }[]) => unlockApi.batchUpdate(updates),
    onSuccess: () => {
      message.success('保存成功')
      setModifiedIds(new Set())
    },
  })

  const handlePointsChange = useCallback((domainId: string, value: number | null) => {
    setEditMap((prev) => ({ ...prev, [domainId]: value ?? 0 }))
    setModifiedIds((prev) => new Set(prev).add(domainId))
  }, [])

  const handleSave = useCallback(() => {
    const updates = Object.entries(editMap)
      .filter(([id]) => modifiedIds.has(id))
      .map(([domainId, unlockPoints]) => ({ domainId, unlockPoints }))
    if (updates.length === 0) {
      message.info('没有需要保存的修改')
      return
    }
    batchMutation.mutate(updates)
  }, [editMap, modifiedIds, batchMutation])

  const configs = data?.data ?? []

  const columns: ColumnsType<UnlockConfig> = [
    {
      title: '领域名称',
      dataIndex: 'domainName',
      key: 'domainName',
      width: '25%',
    },
    {
      title: '是否免费',
      dataIndex: 'isFree',
      key: 'isFree',
      width: '15%',
      render: (isFree: boolean) => <StatusBadge status={isFree ? 'free' : 'active'} />,
    },
    {
      title: '解锁积分',
      dataIndex: 'unlockPoints',
      key: 'unlockPoints',
      width: '25%',
      render: (_: unknown, record: UnlockConfig) => {
        if (record.isFree) {
          return <span className="text-gray-400">免费领域</span>
        }
        return (
          <InputNumber<number>
            min={30}
            max={60}
            value={editMap[record.domainId] ?? record.unlockPoints}
            onChange={(val) => handlePointsChange(record.domainId, val)}
          />
        )
      },
    },
    {
      title: '当前值',
      dataIndex: 'unlockPoints',
      key: 'currentValue',
      width: '15%',
      render: (v: number, record: UnlockConfig) => {
        const edited = editMap[record.domainId]
        if (edited !== undefined && edited !== v) {
          return (
            <span className="text-orange-500 font-medium">
              {v} → {edited}
            </span>
          )
        }
        return <span>{v}</span>
      },
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="m-0 text-[28px] font-bold text-text-primary leading-tight">解锁消耗配置</h1>
        <Button
          type="primary"
          disabled={modifiedIds.size === 0}
          loading={batchMutation.isPending}
          style={{ background: '#160C57', borderColor: '#160C57' }}
          onClick={handleSave}
        >
          保存修改
        </Button>
      </div>

      <Table<UnlockConfig>
        rowKey="domainId"
        columns={columns}
        dataSource={configs}
        loading={isLoading}
        pagination={false}
        locale={{ emptyText: '暂无解锁配置' }}
      />
    </div>
  )
}

export default UnlockPage
