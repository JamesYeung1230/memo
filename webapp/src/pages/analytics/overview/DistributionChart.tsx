import { memo, useMemo } from 'react'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import { PieChart } from 'echarts/charts'
import {
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { Skeleton, Empty } from 'antd'

echarts.use([PieChart, TooltipComponent, LegendComponent, TitleComponent, CanvasRenderer])

export interface DistributionItem {
  name: string
  value: number
}

interface DistributionChartProps {
  title?: string
  data: DistributionItem[]
  loading?: boolean
  height?: number
  /** donut: 环形图, pie: 饼图 */
  variant?: 'donut' | 'pie'
  centerText?: string
}

const COLORS = ['#6366F1', '#160C57', '#F97316', '#10B981', '#F59E0B', '#0EA5E9', '#EF4444']

export const DistributionChart = memo(function DistributionChart({
  title,
  data,
  loading = false,
  height = 300,
  variant = 'donut',
  centerText,
}: DistributionChartProps) {
  const option = useMemo(() => {
    if (!data.length) return null

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        textStyle: { fontSize: 12, color: '#0F172A' },
        formatter: (params: { name: string; value: number; percent: number }) =>
          `${params.name}: <strong>${params.value}</strong> (${params.percent}%)`,
      },
      legend: {
        orient: 'vertical',
        right: 20,
        top: 'center',
        textStyle: { fontSize: 12, color: '#475569' },
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 12,
      },
      series: [
        {
          type: 'pie',
          radius: variant === 'donut' ? ['42%', '68%'] : ['0%', '68%'],
          center: ['40%', '50%'],
          avoidLabelOverlap: true,
          padAngle: 2,
          itemStyle: {
            borderRadius: 4,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 13,
              fontWeight: 'bold',
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0,0,0,0.2)',
            },
          },
          data: data.map((d, i) => ({
            value: d.value,
            name: d.name,
            itemStyle: { color: COLORS[i % COLORS.length] },
          })),
        },
      ],
    }
  }, [data, variant])

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
    <div className="relative">
      {title && (
        <h3 className="m-0 mb-2 text-[14px] font-semibold text-text-primary">{title}</h3>
      )}
      <div className="relative">
        <ReactEChartsCore echarts={echarts} option={option} style={{ height }} notMerge />
        {centerText && variant === 'donut' && (
          <div className="absolute left-[120px] top-1/2 -translate-y-1/2 text-center pointer-events-none">
            <div className="text-[11px] text-text-secondary">{centerText}</div>
          </div>
        )}
      </div>
    </div>
  )
})
