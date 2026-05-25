import { useState, useCallback, memo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { InputNumber, Button, Card, Modal, Table, message } from 'antd'
import { HistoryOutlined } from '@ant-design/icons'
import { pointApi } from '@/api/points'
import type { PointConfig, ActionType, PointChangeLog } from '@/types/point'
import { actionTypeGroups, actionTypeLabels } from '@/types/point'

const pointRange: Record<ActionType, { min: number; max: number }> = {
  learning: { min: 1, max: 50 },
  challenge: { min: 10, max: 200 },
  checkin: { min: 1, max: 20 },
  note: { min: 5, max: 100 },
  ad: { min: 5, max: 100 },
}

const dailyLimitRange: Record<ActionType, { min: number; max: number }> = {
  learning: { min: 10, max: 500 },
  challenge: { min: 50, max: 1000 },
  checkin: { min: 1, max: 50 },
  note: { min: 10, max: 500 },
  ad: { min: 10, max: 500 },
}

const ConfigCard = memo(function ConfigCard({
  config,
  onPointsChange,
  onLimitChange,
  onSave,
}: {
  config: PointConfig
  onPointsChange: (id: string, value: number | null) => void
  onLimitChange: (id: string, value: number | null) => void
  onSave: (config: PointConfig) => void
}) {
  const group = actionTypeGroups.find((g) => g.key === config.actionType)
  const pRange = pointRange[config.actionType]
  const dRange = dailyLimitRange[config.actionType]
  const hasChanges =
    config.pointsValue !== undefined &&
    config.dailyLimit !== undefined

  return (
    <Card
      size="small"
      title={
        <span className="text-base font-semibold text-[#160C57]">{group?.label || config.actionType}</span>
      }
      className="shadow-sm border border-gray-100"
    >
      <p className="text-xs text-gray-500 mb-4">{group?.description || config.description}</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">每次获得积分</label>
          <InputNumber<number>
            min={pRange.min}
            max={pRange.max}
            value={config.pointsValue}
            onChange={(val) => onPointsChange(config.id, val)}
            className="w-full"
          />
          <p className="text-xs text-gray-400 mt-1">范围: {pRange.min} ~ {pRange.max}</p>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">每日上限</label>
          <InputNumber<number>
            min={dRange.min}
            max={dRange.max}
            value={config.dailyLimit}
            onChange={(val) => onLimitChange(config.id, val)}
            className="w-full"
          />
          <p className="text-xs text-gray-400 mt-1">范围: {dRange.min} ~ {dRange.max}</p>
        </div>
      </div>
      <div className="mt-3 text-right">
        <Button
          type="primary"
          size="small"
          disabled={!hasChanges}
          style={{ background: '#160C57', borderColor: '#160C57' }}
          onClick={() => onSave(config)}
        >
          保存
        </Button>
      </div>
    </Card>
  )
})

const ChangeLogModal = memo(function ChangeLogModal({
  open,
  logs,
  onClose,
}: {
  open: boolean
  logs: PointChangeLog[]
  onClose: () => void
}) {
  const columns = [
    { title: '行为类型', dataIndex: 'actionType', key: 'actionType', width: 100, render: (v: ActionType) => actionTypeLabels[v] || v },
    { title: '旧积分值', dataIndex: 'oldValue', key: 'oldValue', width: 100 },
    { title: '新积分值', dataIndex: 'newValue', key: 'newValue', width: 100 },
    { title: '旧每日上限', dataIndex: 'oldLimit', key: 'oldLimit', width: 100 },
    { title: '新每日上限', dataIndex: 'newLimit', key: 'newLimit', width: 100 },
    { title: '操作人', dataIndex: 'operator', key: 'operator', width: 100 },
    { title: '变更时间', dataIndex: 'changedAt', key: 'changedAt', width: 150 },
  ]

  return (
    <Modal
      title="配置变更历史"
      open={open}
      width={800}
      onCancel={onClose}
      footer={<Button onClick={onClose}>关闭</Button>}
    >
      <Table
        rowKey="id"
        columns={columns}
        dataSource={logs}
        pagination={false}
        locale={{ emptyText: '暂无变更记录' }}
      />
    </Modal>
  )
})

function PointsPage() {
  const [localConfigs, setLocalConfigs] = useState<Map<string, { pointsValue: number; dailyLimit: number }>>(new Map())
  const [historyOpen, setHistoryOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['point-configs'],
    queryFn: () => pointApi.getList(),
  })

  const { data: changeLogs } = useQuery({
    queryKey: ['point-change-logs'],
    queryFn: () => pointApi.getChangeLogs(),
    enabled: historyOpen,
  })

  const saveMutation = useMutation({
    mutationFn: (config: PointConfig) => pointApi.update(config.id, { pointsValue: config.pointsValue, dailyLimit: config.dailyLimit }),
    onSuccess: () => {
      message.success('保存成功')
    },
  })

  const handlePointsChange = useCallback((id: string, value: number | null) => {
    setLocalConfigs((prev) => {
      const next = new Map(prev)
      const existing = next.get(id)
      next.set(id, { pointsValue: value ?? 0, dailyLimit: existing?.dailyLimit ?? 0 })
      return next
    })
  }, [])

  const handleLimitChange = useCallback((id: string, value: number | null) => {
    setLocalConfigs((prev) => {
      const next = new Map(prev)
      const existing = next.get(id)
      next.set(id, { pointsValue: existing?.pointsValue ?? 0, dailyLimit: value ?? 0 })
      return next
    })
  }, [])

  const handleSave = useCallback(
    (config: PointConfig) => {
      const local = localConfigs.get(config.id)
      const payload: PointConfig = {
        ...config,
        pointsValue: local?.pointsValue ?? config.pointsValue,
        dailyLimit: local?.dailyLimit ?? config.dailyLimit,
      }
      saveMutation.mutate(payload)
    },
    [localConfigs, saveMutation],
  )

  const configs = data?.data ?? []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="m-0 text-[28px] font-bold text-text-primary leading-tight">积分规则配置</h1>
        <Button icon={<HistoryOutlined />} onClick={() => setHistoryOpen(true)}>
          变更历史
        </Button>
      </div>

      {actionTypeGroups.map((group) => {
        const groupConfigs = configs.filter((c) => c.actionType === group.key)
        if (groupConfigs.length === 0) return null
        return (
          <div key={group.key} className="flex flex-col gap-3">
            {groupConfigs.map((config) => (
              <ConfigCard
                key={config.id}
                config={{
                  ...config,
                  pointsValue: localConfigs.get(config.id)?.pointsValue ?? config.pointsValue,
                  dailyLimit: localConfigs.get(config.id)?.dailyLimit ?? config.dailyLimit,
                }}
                onPointsChange={handlePointsChange}
                onLimitChange={handleLimitChange}
                onSave={handleSave}
              />
            ))}
          </div>
        )
      })}

      {!isLoading && configs.length === 0 && (
        <div className="text-center py-16 text-gray-400">暂无积分规则配置</div>
      )}

      <ChangeLogModal
        open={historyOpen}
        logs={changeLogs?.data ?? []}
        onClose={() => setHistoryOpen(false)}
      />
    </div>
  )
}

export default PointsPage
