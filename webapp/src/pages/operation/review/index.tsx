import { useCallback, memo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, InputNumber, Select, Switch, Button, Tag, message, Empty } from 'antd'
import { reviewConfigApi } from '@/api/review-config'
import type { ReviewPlan } from '@/types/review-config'

const ReviewPlanCard = memo(function ReviewPlanCard({
  plan,
  isSelected,
  onSelect,
}: {
  plan: ReviewPlan
  isSelected: boolean
  onSelect: (id: string) => void
}) {
  return (
    <div
      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
        isSelected
          ? 'border-[#160C57] bg-indigo-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => onSelect(plan.id)}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-800">{plan.name}</span>
        {plan.isDefault && (
          <Tag color="blue" className="m-0">默认</Tag>
        )}
      </div>
      <div className="text-sm text-gray-500">
        间隔天数: {plan.intervals.map((d) => (
          d < 1 ? `${Math.round(d * 24)}小时` : `${d}天`
        )).join(' → ')}
      </div>
    </div>
  )
})

function ReviewConfigPage() {
  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['review-plans'],
    queryFn: () => reviewConfigApi.getPlans(),
  })

  const { data: configData, isLoading: configLoading } = useQuery({
    queryKey: ['review-default-config'],
    queryFn: () => reviewConfigApi.getDefaultConfig(),
  })

  const updateConfigMutation = useMutation({
    mutationFn: (params: { dailyLimit?: number; remindTime?: string; weekendSilent?: boolean }) =>
      reviewConfigApi.updateDefaultConfig(params),
    onSuccess: () => {
      message.success('保存成功')
    },
  })

  const setDefaultPlanMutation = useMutation({
    mutationFn: (planId: string) => reviewConfigApi.setDefaultPlan(planId),
    onSuccess: () => {
      message.success('默认方案已更新')
    },
  })

  const resetMutation = useMutation({
    mutationFn: () => reviewConfigApi.resetDefaultConfig(),
    onSuccess: () => {
      message.success('已恢复默认配置')
    },
  })

  const plans = plansData?.data ?? []
  const defaultConfig = configData?.data

  const handleSelectPlan = useCallback(
    (planId: string) => {
      setDefaultPlanMutation.mutate(planId)
    },
    [setDefaultPlanMutation],
  )

  const handleDailyLimitChange = useCallback(
    (value: number | null) => {
      if (value !== null && defaultConfig) {
        updateConfigMutation.mutate({ dailyLimit: value })
      }
    },
    [defaultConfig, updateConfigMutation],
  )

  const handleRemindTimeChange = useCallback(
    (value: string) => {
      updateConfigMutation.mutate({ remindTime: value })
    },
    [updateConfigMutation],
  )

  const handleWeekendSilentChange = useCallback(
    (checked: boolean) => {
      updateConfigMutation.mutate({ weekendSilent: checked })
    },
    [updateConfigMutation],
  )

  const selectedPlanId = plans.find((p) => p.isDefault)?.id

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="m-0 text-[28px] font-bold text-text-primary leading-tight">复习默认配置</h1>
      </div>

      {/* 复习节点方案 */}
      <Card
        title={<span className="text-base font-semibold text-[#160C57]">复习节点方案</span>}
        className="shadow-sm border border-gray-100"
      >
        {plansLoading ? (
          <div className="text-center py-8 text-gray-400">加载中...</div>
        ) : plans.length === 0 ? (
          <Empty description="暂无复习方案" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <ReviewPlanCard
                key={plan.id}
                plan={plan}
                isSelected={plan.id === selectedPlanId}
                onSelect={handleSelectPlan}
              />
            ))}
          </div>
        )}
      </Card>

      {/* 默认配置 */}
      <Card
        title={<span className="text-base font-semibold text-[#160C57]">默认参数配置</span>}
        className="shadow-sm border border-gray-100"
      >
        {configLoading ? (
          <div className="text-center py-8 text-gray-400">加载中...</div>
        ) : defaultConfig ? (
          <div className="flex flex-col gap-6 max-w-[600px]">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">每日复习上限</label>
              <InputNumber<number>
                min={5}
                max={200}
                value={defaultConfig.dailyLimit}
                onChange={handleDailyLimitChange}
                className="w-full"
              />
              <p className="text-xs text-gray-400 mt-1">范围: 5 ~ 200 张/天</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">默认提醒时间</label>
              <Select
                value={defaultConfig.remindTime}
                onChange={handleRemindTimeChange}
                className="w-full"
                options={[
                  { value: '08:00', label: '08:00' },
                  { value: '09:00', label: '09:00' },
                  { value: '10:00', label: '10:00' },
                  { value: '12:00', label: '12:00' },
                  { value: '18:00', label: '18:00' },
                  { value: '20:00', label: '20:00' },
                  { value: '21:00', label: '21:00' },
                  { value: '22:00', label: '22:00' },
                ]}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">周末免打扰</p>
                <p className="text-xs text-gray-400 mt-0.5">开启后周末不会发送复习提醒</p>
              </div>
              <Switch
                checked={defaultConfig.weekendSilent}
                onChange={handleWeekendSilentChange}
                checkedChildren="开启"
                unCheckedChildren="关闭"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
              <Button
                type="primary"
                loading={updateConfigMutation.isPending}
                style={{ background: '#160C57', borderColor: '#160C57' }}
                onClick={() => {
                  updateConfigMutation.mutate({
                    dailyLimit: defaultConfig.dailyLimit,
                    remindTime: defaultConfig.remindTime,
                    weekendSilent: defaultConfig.weekendSilent,
                  })
                }}
              >
                保存配置
              </Button>
              <Button
                danger
                loading={resetMutation.isPending}
                onClick={() => resetMutation.mutate()}
              >
                恢复默认
              </Button>
            </div>
          </div>
        ) : (
          <Empty description="暂无默认配置" />
        )}
      </Card>
    </div>
  )
}

export default ReviewConfigPage
