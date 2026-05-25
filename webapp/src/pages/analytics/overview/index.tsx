import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Tabs, Card, Segmented } from 'antd'
import { analyticsApi } from '@/api/analytics'
import { StatCards } from './StatCards'
import { TrendChart } from './TrendChart'
import { ComparisonChart } from './ComparisonChart'
import { DistributionChart } from './DistributionChart'
import { FunnelChart } from './FunnelChart'

const BRAND = '#160C57'
const SECONDARY = '#6366F1'
const SUCCESS = '#10B981'
const WARNING = '#F59E0B'
const DANGER = '#EF4444'
const INFO = '#0EA5E9'

function OverviewTab() {
  const [growthDays, setGrowthDays] = useState<7 | 30>(7)

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['analytics', 'overview-stats'],
    queryFn: () => analyticsApi.getOverviewStats(),
  })

  const { data: growth, isLoading: growthLoading } = useQuery({
    queryKey: ['analytics', 'user-growth-trend', growthDays],
    queryFn: () => analyticsApi.getUserGrowthTrend(growthDays),
  })

  return (
    <div className="flex flex-col gap-6">
      <StatCards data={stats?.data} loading={statsLoading} />

      <Card className="[&>.ant-card-body]:!p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="m-0 text-[14px] font-semibold text-text-primary">用户增长趋势</h3>
          <Segmented<7 | 30>
            value={growthDays}
            onChange={(v) => setGrowthDays(v)}
            options={[
              { label: '近7日', value: 7 },
              { label: '近30日', value: 30 },
            ]}
          />
        </div>
        <TrendChart
          xLabels={growth?.data?.map((d) => d.date.slice(5)) ?? []}
          series={
            growth?.data
              ? [
                  {
                    name: '新增用户',
                    data: growth.data.map((d) => d.count),
                    color: SECONDARY,
                  },
                ]
              : []
          }
          loading={growthLoading}
          height={300}
          showLegend={false}
          areaStyle
        />
      </Card>
    </div>
  )
}

function ContentTab() {
  const { data: domainHeat, isLoading: domainLoading } = useQuery({
    queryKey: ['analytics', 'domain-heat'],
    queryFn: () => analyticsApi.getDomainHeat(),
  })

  const { data: cardRank, isLoading: rankLoading } = useQuery({
    queryKey: ['analytics', 'card-rank'],
    queryFn: () => analyticsApi.getCardLearningRank(),
  })

  const { data: accuracy, isLoading: accuracyLoading } = useQuery({
    queryKey: ['analytics', 'question-accuracy'],
    queryFn: () => analyticsApi.getQuestionAccuracy(),
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="[&>.ant-card-body]:!p-5">
          <ComparisonChart
            title="领域学习热度"
            type="horizontal"
            data={
              domainHeat?.data?.map((d) => ({ name: d.domain, value: d.heat })) ?? []
            }
            loading={domainLoading}
            height={320}
          />
        </Card>

        <Card className="[&>.ant-card-body]:!p-5">
          <ComparisonChart
            title="卡片学习排行 TOP10"
            type="horizontal"
            data={
              cardRank?.data?.map((d) => ({ name: d.cardTitle, value: d.studyCount })) ?? []
            }
            loading={rankLoading}
            height={320}
          />
        </Card>
      </div>

      <Card className="[&>.ant-card-body]:!p-5">
        <ComparisonChart
          title="题目正确率（按领域）"
          type="grouped"
          groupSeries={
            accuracy?.data
              ? [
                  { name: '正确率', data: accuracy.data.map((d) => d.correctRate), color: SUCCESS },
                  { name: '错误率', data: accuracy.data.map((d) => d.wrongRate), color: DANGER },
                ]
              : undefined
          }
          groupLabels={accuracy?.data?.map((d) => d.domain)}
          loading={accuracyLoading}
          height={320}
        />
      </Card>
    </div>
  )
}

function UsersTab() {
  const { data: growth, isLoading: growthLoading } = useQuery({
    queryKey: ['analytics', 'user-growth'],
    queryFn: () => analyticsApi.getUserGrowth(),
  })

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ['analytics', 'activity-distribution'],
    queryFn: () => analyticsApi.getActivityDistribution(),
  })

  const { data: funnel, isLoading: funnelLoading } = useQuery({
    queryKey: ['analytics', 'learning-funnel'],
    queryFn: () => analyticsApi.getLearningFunnel(),
  })

  return (
    <div className="flex flex-col gap-6">
      <Card className="[&>.ant-card-body]:!p-5">
        <TrendChart
          title="用户增长趋势"
          xLabels={growth?.data?.map((d) => d.date.slice(5)) ?? []}
          series={
            growth?.data
              ? [
                  {
                    name: '累计用户数',
                    data: growth.data.map((d) => d.cumulative),
                    color: BRAND,
                    yAxisIndex: 0,
                  },
                  {
                    name: '新增用户数',
                    data: growth.data.map((d) => d.newUsers),
                    color: SECONDARY,
                    yAxisIndex: 1,
                  },
                ]
              : []
          }
          loading={growthLoading}
          height={320}
          yName="累计用户数"
          y2Name="新增用户数"
          areaStyle={false}
        />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="[&>.ant-card-body]:!p-5">
          <DistributionChart
            title="活跃度分布"
            data={
              activity?.data?.map((d) => ({ name: d.name, value: d.value })) ?? []
            }
            loading={activityLoading}
            variant="donut"
            height={300}
          />
        </Card>

        <Card className="[&>.ant-card-body]:!p-5">
          <FunnelChart
            title="学习行为漏斗"
            data={
              funnel?.data?.map((d) => ({ name: d.name, value: d.value })) ?? []
            }
            loading={funnelLoading}
            height={360}
          />
        </Card>
      </div>
    </div>
  )
}

function PointsTab() {
  const { data: pointsTrend, isLoading: pointsLoading } = useQuery({
    queryKey: ['analytics', 'points-trend'],
    queryFn: () => analyticsApi.getPointsTrend(),
  })

  const { data: adStats, isLoading: adLoading } = useQuery({
    queryKey: ['analytics', 'ad-stats'],
    queryFn: () => analyticsApi.getAdStats(),
  })

  const { data: pointsDist, isLoading: distLoading } = useQuery({
    queryKey: ['analytics', 'points-distribution'],
    queryFn: () => analyticsApi.getPointsDistribution(),
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="[&>.ant-card-body]:!p-5">
          <TrendChart
            title="积分发放/消耗趋势（近30日）"
            xLabels={pointsTrend?.data?.map((d) => d.date.slice(5)) ?? []}
            series={
              pointsTrend?.data
                ? [
                    {
                      name: '发放积分',
                      data: pointsTrend.data.map((d) => d.issued),
                      color: SUCCESS,
                    },
                    {
                      name: '消耗积分',
                      data: pointsTrend.data.map((d) => d.consumed),
                      color: WARNING,
                    },
                  ]
                : []
            }
            loading={pointsLoading}
            height={300}
            areaStyle
          />
        </Card>

        <Card className="[&>.ant-card-body]:!p-5">
          <ComparisonChart
            title="积分获取占比"
            type="vertical"
            data={
              pointsDist?.data?.map((d) => ({ name: d.name, value: d.value })) ?? []
            }
            loading={distLoading}
            height={300}
          />
        </Card>
      </div>

      <Card className="[&>.ant-card-body]:!p-5">
        <ComparisonChart
          title="广告展示/点击（近7日）"
          type="grouped"
          groupSeries={
            adStats?.data
              ? [
                  { name: '展示量', data: adStats.data.map((d) => d.impressions), color: SECONDARY },
                  { name: '点击量', data: adStats.data.map((d) => d.clicks), color: INFO },
                ]
              : undefined
          }
          groupLabels={adStats?.data?.map((d) => d.date.slice(5))}
          loading={adLoading}
          height={320}
        />
      </Card>
    </div>
  )
}

function AnalyticsOverviewPage() {
  const tabItems = [
    { key: 'overview', label: '核心指标概览', children: <OverviewTab /> },
    { key: 'content', label: '内容数据', children: <ContentTab /> },
    { key: 'users', label: '用户数据', children: <UsersTab /> },
    { key: 'points', label: '积分与广告数据', children: <PointsTab /> },
  ]

  return (
    <div className="flex flex-col gap-6">
      <h1 className="m-0 text-[28px] font-bold text-text-primary leading-tight">数据看板</h1>

      <Tabs
        defaultActiveKey="overview"
        items={tabItems}
        size="large"
        className="[&_.ant-tabs-nav]:!mb-0"
      />
    </div>
  )
}

export default AnalyticsOverviewPage
