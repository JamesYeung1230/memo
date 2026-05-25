import { memo, useMemo } from 'react'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import { BarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { Skeleton, Empty } from 'antd'

echarts.use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

export interface ComparisonBarItem {
  name: string
  value: number
}

interface ComparisonChartProps {
  title?: string
  data?: ComparisonBarItem[]
  loading?: boolean
  height?: number
  /** horizontal: 水平条形图, vertical: 垂直柱状图, grouped: 分组柱状图 */
  type?: 'horizontal' | 'vertical' | 'grouped'
  /** 分组柱状图专用：系列配置 */
  groupSeries?: { name: string; data: number[]; color: string }[]
  groupLabels?: string[]
}

export const ComparisonChart = memo(function ComparisonChart({
  title,
  data,
  loading = false,
  height = 320,
  type = 'vertical',
  groupSeries,
  groupLabels,
}: ComparisonChartProps) {
  const option = useMemo(() => {
    // Early return if no valid data source for the given type
    if (type === 'grouped') {
      if (!groupSeries || !groupLabels) return null
      // grouped chart rendering continues below
    }

    if (type === 'grouped' && groupSeries && groupLabels) {
      return {
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(255,255,255,0.96)',
          borderColor: '#E2E8F0',
          borderWidth: 1,
          textStyle: { fontSize: 12, color: '#0F172A' },
          formatter: (params: { name: string; seriesName: string; value: number }[]) => {
            let html = `<div style="font-weight:600;margin-bottom:4px">${params[0].name}</div>`
            params.forEach((p) => {
              html += `<div style="display:flex;justify-content:space-between;gap:16px">
                <span>${p.seriesName}</span>
                <span style="font-weight:600">${p.value}%</span>
              </div>`
            })
            return html
          },
        },
        legend: {
          data: groupSeries.map((s) => s.name),
          bottom: 0,
          textStyle: { fontSize: 12, color: '#475569' },
        },
        grid: { top: title ? 40 : 20, right: 20, bottom: 40, left: 50 },
        xAxis: {
          type: 'category',
          data: groupLabels,
          axisLine: { lineStyle: { color: '#E2E8F0' } },
          axisTick: { show: false },
          axisLabel: { fontSize: 11, color: '#94A3B8' },
        },
        yAxis: {
          type: 'value',
          max: 100,
          splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
          axisLabel: { fontSize: 11, color: '#94A3B8', formatter: '{value}%' },
        },
        series: groupSeries.map((s) => ({
          name: s.name,
          type: 'bar',
          data: s.data,
          barWidth: 20,
          itemStyle: { color: s.color, borderRadius: [4, 4, 0, 0] },
        })),
      }
    }

    if (type === 'horizontal') {
      if (!data) return null
      const values = data.map((d) => d.value)
      const names = data.map((d) => d.name)
      return {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          backgroundColor: 'rgba(255,255,255,0.96)',
          borderColor: '#E2E8F0',
          borderWidth: 1,
          textStyle: { fontSize: 12, color: '#0F172A' },
          formatter: (params: { name: string; value: number }[]) =>
            `${params[0].name}: <strong>${params[0].value}</strong>`,
        },
        grid: { top: title ? 40 : 20, right: 40, bottom: 20, left: 80 },
        xAxis: {
          type: 'value',
          splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
          axisLabel: { fontSize: 11, color: '#94A3B8' },
        },
        yAxis: {
          type: 'category',
          data: names,
          axisLine: { lineStyle: { color: '#E2E8F0' } },
          axisTick: { show: false },
          axisLabel: { fontSize: 11, color: '#475569' },
        },
        series: [
          {
            type: 'bar',
            data: values,
            barWidth: 16,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: '#6366F1' },
                { offset: 1, color: '#160C57' },
              ]),
              borderRadius: [0, 4, 4, 0],
            },
          },
        ],
      }
    }

    // vertical bar
    if (!data) return null
    const values = data.map((d) => d.value)
    const names = data.map((d) => d.name)
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        textStyle: { fontSize: 12, color: '#0F172A' },
        formatter: (params: { name: string; value: number }[]) =>
          `${params[0].name}: <strong>${params[0].value}</strong>`,
      },
      grid: { top: title ? 40 : 20, right: 20, bottom: 50, left: 50 },
      xAxis: {
        type: 'category',
        data: names,
        axisLine: { lineStyle: { color: '#E2E8F0' } },
        axisTick: { show: false },
        axisLabel: { fontSize: 11, color: '#94A3B8', rotate: names.length > 6 ? 30 : 0 },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
        axisLabel: { fontSize: 11, color: '#94A3B8' },
      },
      series: [
        {
          type: 'bar',
          data: values,
          barWidth: 24,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#6366F1' },
              { offset: 1, color: '#160C57' },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    }
  }, [data, title, type, groupSeries, groupLabels])

  if (loading) {
    return <Skeleton active paragraph={{ rows: 4 }} />
  }

  const hasData =
    type === 'grouped'
      ? groupSeries != null && groupSeries.length > 0
      : data != null && data.length > 0

  if (!hasData) {
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
