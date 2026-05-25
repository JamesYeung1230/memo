import { useCallback } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, Switch, Input, Button, message } from 'antd'
import { adApi } from '@/api/ads'

function AdsConfigPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['ad-config'],
    queryFn: () => adApi.getConfig(),
  })

  const updateMutation = useMutation({
    mutationFn: (params: { splashEnabled: boolean; splashImageUrl: string; splashLink: string }) =>
      adApi.updateConfig(params),
    onSuccess: () => {
      message.success('保存成功')
    },
  })

  const config = data?.data

  const handleToggle = useCallback(
    (checked: boolean) => {
      if (config) {
        updateMutation.mutate({
          splashEnabled: checked,
          splashImageUrl: config.splashImageUrl,
          splashLink: config.splashLink,
        })
      }
    },
    [config, updateMutation],
  )

  const handleImageUrlChange = useCallback(
    (value: string) => {
      if (config) {
        updateMutation.mutate({
          splashEnabled: config.splashEnabled,
          splashImageUrl: value,
          splashLink: config.splashLink,
        })
      }
    },
    [config, updateMutation],
  )

  const handleLinkChange = useCallback(
    (value: string) => {
      if (config) {
        updateMutation.mutate({
          splashEnabled: config.splashEnabled,
          splashImageUrl: config.splashImageUrl,
          splashLink: value,
        })
      }
    },
    [config, updateMutation],
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="m-0 text-[28px] font-bold text-text-primary leading-tight">广告配置</h1>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-gray-400">加载中...</div>
      ) : config ? (
        <>
          <Card
            title={<span className="text-base font-semibold text-[#160C57]">开屏广告</span>}
            className="shadow-sm border border-gray-100"
          >
            <div className="flex flex-col gap-6 max-w-[600px]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">开屏广告开关</p>
                  <p className="text-xs text-gray-400 mt-0.5">开启后用户在启动应用时将看到开屏广告</p>
                </div>
                <Switch
                  checked={config.splashEnabled}
                  onChange={handleToggle}
                  checkedChildren="开启"
                  unCheckedChildren="关闭"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">开屏广告图片 URL</label>
                <Input
                  defaultValue={config.splashImageUrl}
                  onBlur={(e) => {
                    if (e.target.value !== data?.data?.splashImageUrl) {
                      handleImageUrlChange(e.target.value)
                    }
                  }}
                  placeholder="请输入开屏广告图片 URL"
                />
                <p className="text-xs text-gray-400 mt-1">建议尺寸: 1125 x 2436 px</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">跳转链接</label>
                <Input
                  defaultValue={config.splashLink}
                  onBlur={(e) => {
                    if (e.target.value !== data?.data?.splashLink) {
                      handleLinkChange(e.target.value)
                    }
                  }}
                  placeholder="https://..."
                />
                <p className="text-xs text-gray-400 mt-1">用户点击广告后跳转的链接</p>
              </div>

              <div className="flex justify-end">
                <Button
                  type="primary"
                  loading={updateMutation.isPending}
                  style={{ background: '#160C57', borderColor: '#160C57' }}
                >
                  保存配置
                </Button>
              </div>
            </div>
          </Card>

          <Card
            title={<span className="text-base font-semibold text-[#160C57]">激励广告</span>}
            className="shadow-sm border border-gray-100"
          >
            <div className="max-w-[600px]">
              <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">每次观看激励广告获得积分</p>
                  <p className="text-xs text-gray-400 mt-0.5">该值在「积分规则配置」中管理</p>
                </div>
                <span className="text-lg font-semibold text-[#160C57]">{config.incentivePoints} 分</span>
              </div>
            </div>
          </Card>
        </>
      ) : (
        <div className="text-center py-16 text-gray-400">暂无广告配置</div>
      )}
    </div>
  )
}

export default AdsConfigPage
