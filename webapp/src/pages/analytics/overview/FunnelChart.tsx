import { memo, useMemo } from 'react'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import { FunnelChart as EChartsFunnel } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { Skeleton, Empty } from 'antd'

echarts.use([EChartsFunnel, TooltipComponent, CanvasRenderer])

export interface FunnelDataItem {
  name: string
  value: number
}

interface FunnelChartProps {
  title?: string
  data: FunnelDataItem[]
  loading?: boolean
  height?: number
}

const COLORS = ['#160C57', '#2D1A8E', '#6366F1', '#818CF8', '#A5B4FC', '#C7D2FE']

export const FunnelChart = memo(function FunnelChart({
  title,
  data,
  loading = false,
  height = 360,
}: FunnelChartProps) {
  const option = useMemo(() => {
    if (!data.length) return null

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        textStyle: { fontSize: 12, color: '#0F172A' },
        formatter: (rawParams: unknown) => {
          const params = rawParams as { name: string; value: number; percent: number; dataIndex: number }
          const dataIndex = params.dataIndex
          const conversionRate =
            dataIndex > 0
              ? ((params.value / data[dataIndex - 1].value) * 100).toFixed(1)
              : '-'
          return `<strong>${params.name}</strong><br/>
            人数: ${params.value.toLocaleString()}<br/>
            占比: ${params.percent}%<br/>
            转化率: ${conversionRate}%`
        },
      },
      grid: { top: title ? 40 : 20, bottom: 20 },
      series: [
        {
          type: 'funnel',
          left: '10%',
          right: '10%',
          top: 20,
          bottom: 20,
          minSize: '10%',
          maxSize: '100%',
          sort: 'descending',
          gap: 4,
          label: {
            show: true,
            position: 'inside',
            fontSize: 13,
            fontWeight: 600,
            color: '#fff',
            formatter: (params: { name: string; value: number }) =>
              `${params.name}\n${params.value.toLocaleString()}`,
          },
          labelLine: { show: false },
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 2,
          },
          data: data.map((d, i) => ({
            value: d.value,
            name: d.name,
            itemStyle: { color: COLORS[i % COLORS.length] },
          })),
        },
      ],
    }
  }, [data, title])

  if (loading) {
    return <Skeleton active paragraph={{ rows: 4 }} />
  }

  if (!option) {
    return (
      <div className="flex justify-center items-center" style={{ height }}>
        <Empty description="暂无数据" />
      </div>
    )
  }

  return (
    <div>
      {title && (
        <h3 className="m-0 mb-2 text-[14px] font-semibold text-text-primary">{title}</h3>
      )}
      <ReactEChartsCore echarts={echarts} option={option} style={{ height }} notMerge />
    </div>
  )
})
