import EChart from '@/components/wrappers/EChart'
import { getColor } from '@/utils/helpers'
import { PieChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useMemo } from 'react'
import { Card, CardBody } from 'react-bootstrap'

const chartExtensions = [PieChart, TooltipComponent, CanvasRenderer]

const buildChartOptions = (title, metrics, counts, useEdgeAlignedLabels = false) => {
  const totalActual = metrics.reduce((sum, metric) => sum + Number(counts?.[metric.key] || 0), 0)
  const zeroSliceVisualValue = totalActual > 0 ? Math.max(totalActual * 0.03, 1) : 1
  const chartData = metrics.map((metric) => ({
    actualValue: Number(counts?.[metric.key] || 0),
    value: Number(counts?.[metric.key] || 0) > 0 ? Number(counts?.[metric.key] || 0) : zeroSliceVisualValue,
    name: metric.label,
    metricKey: metric.key,
    itemStyle: {
      color: getColor(metric.chartColor || 'primary'),
      borderRadius: 8,
    },
    label: {
      show: true,
      formatter: ({ name, data }) => `${name}\n${data?.actualValue ?? 0}`,
      color: getColor('secondary-color'),
      fontSize: 11,
      lineHeight: 15,
    },
  }))

  return {
    tooltip: {
      trigger: 'item',
      padding: [8, 15],
      backgroundColor: getColor('secondary-bg'),
      borderColor: getColor('border-color'),
      borderWidth: 1,
      textStyle: {
        color: getColor('light-text-emphasis'),
      },
      formatter: ({ name, data }) => {
        const actualValue = Number(data?.actualValue || 0)
        const share = totalActual > 0 ? Math.round((actualValue / totalActual) * 100) : 0
        return `${name}<br/>Count: ${actualValue}<br/>Share: ${share}%`
      },
    },
    textStyle: {
      fontFamily: getComputedStyle(document.body).fontFamily,
    },
    series: [
      {
        name: title,
        type: 'pie',
        radius: [56, 92],
        center: ['50%', '52%'],
        minAngle: 4,
        stillShowZeroSum: true,
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: getColor('body-bg'),
          borderWidth: 2,
        },
        label: useEdgeAlignedLabels
          ? {
              alignTo: 'edge',
              edgeDistance: 10,
              bleedMargin: 6,
            }
          : undefined,
        labelLine: {
          length: 10,
          length2: useEdgeAlignedLabels ? 0 : 8,
          smooth: true,
        },
        data: chartData,
      },
    ],
  }
}

const StatusProgressChart = ({ title, description, metrics, counts, onOpen, canAccess, useEdgeAlignedLabels = false }) => {
  const total = useMemo(
    () => metrics.reduce((sum, metric) => sum + Number(counts?.[metric.key] || 0), 0),
    [counts, metrics],
  )

  const onEvents = {
    click: (params) => {
      const metric = metrics.find((item) => item.label === params?.name || item.key === params?.data?.metricKey)
      if (metric && canAccess(metric)) {
        onOpen(metric)
      }
    },
  }

  return (
    <Card className="border-0 shadow-sm h-100">
      <CardBody className="py-3">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h6 className="mb-1">{title}</h6>
            <p className="text-muted small mb-0">{description}</p>
          </div>
          <div className="text-end">
            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.68rem', letterSpacing: '.04em' }}>Total</div>
            <div className="h5 mb-0">{total.toLocaleString()}</div>
          </div>
        </div>
        <div dir="ltr">
          <EChart
            extensions={chartExtensions}
            getOptions={() => buildChartOptions(title, metrics, counts, useEdgeAlignedLabels)}
            onEvents={onEvents}
            style={{ height: 290 }}
          />
        </div>
      </CardBody>
    </Card>
  )
}

export default StatusProgressChart
