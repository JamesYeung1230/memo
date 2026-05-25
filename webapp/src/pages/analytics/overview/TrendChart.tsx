import { memo, useMemo } from 'react'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import { LineChart, BarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { Skeleton, Empty } from 'antd'

echarts.use([
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  CanvasRenderer,
])

export interface TrendSeries {
  name: string
  data: number[]
  color?: string
  type?: 'line' | 'bar'
  yAxisIndex?: number
}

interface TrendChartProps {
  title?: string
  xLabels: string[]
  series: TrendSeries[]
  loading?: boolean
  height?: number
  showLegend?: boolean
  yName?: string
  y2Name?: string
  smooth?: boolean
  areaStyle?: boolean
}

export const TrendChart = memo(function TrendChart({
  title,
  xLabels,
  series,
  loading = false,
  height = 320,
  showLegend = true,
  yName,
  y2Name,
  smooth = true,
  areaStyle = false,
}: TrendChartProps) {
  const option = useMemo(() => {
    if (!xLabels.length || !series.length) return null

    const hasDualAxis = series.some((s) => s.yAxisIndex != null && s.yAxisIndex === 1)

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        textStyle: { fontSize: 12, color: '#0F172A' },
      },
      legend: showLegend
        ? {
            data: series.map((s) => s.name),
            bottom: 0,
            textStyle: { fontSize: 12, color: '#475569' },
          }
        : undefined,
      grid: {
        top: title ? 40 : 20,
        right: hasDualAxis ? 60 : 20,
        bottom: showLegend ? 36 : 20,
        left: 50,
      },
      xAxis: {
        type: 'category',
        data: xLabels,
        axisLine: { lineStyle: { color: '#E2E8F0' } },
        axisTick: { show: false },
        axisLabel: { fontSize: 11, color: '#94A3B8' },
      },
      yAxis: hasDualAxis
        ? [
            {
              type: 'value',
              name: yName,
              nameTextStyle: { fontSize: 11, color: '#94A3B8' },
              splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
              axisLabel: { fontSize: 11, color: '#94A3B8' },
            },
            {
              type: 'value',
              name: y2Name,
              nameTextStyle: { fontSize: 11, color: '#94A3B8' },
              splitLine: { show: false },
              axisLabel: { fontSize: 11, color: '#94A3B8' },
            },
          ]
        : {
            type: 'value',
            name: yName,
            nameTextStyle: { fontSize: 11, color: '#94A3B8' },
            splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
            axisLabel: { fontSize: 11, color: '#94A3B8' },
          },
      series: series.map((s) => ({
        name: s.name,
        type: s.type ?? 'line',
        data: s.data,
        yAxisIndex: s.yAxisIndex ?? 0,
        smooth,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { width: 2, color: s.color ?? '#6366F1' },
        itemStyle: { color: s.color ?? '#6366F1' },
        areaStyle: areaStyle
          ? {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: (s.color ?? '#6366F1') + '30' },
                { offset: 1, color: (s.color ?? '#6366F1') + '05' },
              ]),
            }
          : undefined,
      })),
    }
  }, [xLabels, series, showLegend, yName, y2Name, smooth, areaStyle, title])

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
