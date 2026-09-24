import EChart from '@/components/wrappers/EChart'
import Icon from '@/components/wrappers/Icon'
import { getColor } from '@/utils/helpers'
import { BarChart, LineChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { Card, CardBody, CardHeader, CardTitle, Col, ProgressBar, Row } from 'react-bootstrap'

const chartExtensions = [LineChart, BarChart, TooltipComponent, CanvasRenderer]

const buildOptions = (trend) => ({
  tooltip: {
    trigger: 'axis',
    padding: [8, 15],
    backgroundColor: getColor('secondary-bg'),
    borderColor: getColor('border-color'),
    borderWidth: 1,
    textStyle: { color: getColor('light-text-emphasis') },
  },
  legend: { data: ['Paid Amount', 'Pending', 'Approved'], top: 15, textStyle: { color: getColor('body-color') } },
  textStyle: { fontFamily: getComputedStyle(document.body).fontFamily },
  xAxis: {
    data: trend.map((t) => t.date),
    axisLine: { lineStyle: { type: 'dashed', color: getColor('border-color') } },
    axisLabel: { show: true, color: getColor('secondary-color') },
    splitLine: { lineStyle: { color: getColor('border-color'), type: 'dashed' } },
  },
  yAxis: {
    axisLine: { lineStyle: { type: 'dashed', color: getColor('border-color') } },
    axisLabel: { show: true, color: getColor('secondary-color') },
    splitLine: { show: false },
  },
  grid: { left: 25, right: 25, bottom: 25, top: 60, containLabel: true },
  series: [
    { name: 'Paid Amount', type: 'line', smooth: true, itemStyle: { color: getColor('success') }, symbol: 'emptyCircle', symbolSize: 5, data: trend.map((t) => t.paid_amount) },
    { name: 'Pending', type: 'bar', barWidth: 12, itemStyle: { borderRadius: [5, 5, 0, 0], color: getColor('warning') }, data: trend.map((t) => t.pending_count) },
    { name: 'Approved', type: 'bar', barWidth: 12, itemStyle: { borderRadius: [5, 5, 0, 0], color: getColor('secondary') }, data: trend.map((t) => t.approved_count) },
  ],
})

/** "Payment Statistics" — cloned from the Dashboard's Order Statistics widget: trend chart (status + paid amount over date) on the left, Payment Type breakdown mini-cards on the right. */
const PaymentStatisticsWidget = ({ trend, byType, totalPaidAmount }) => (
  <Card>
    <CardHeader className="border-dashed">
      <CardTitle as="h4">Payment Statistics</CardTitle>
    </CardHeader>
    <CardBody className="p-0">
      <Row className="g-0">
        <Col xxl={8} className="border-end border-dashed">
          <EChart extensions={chartExtensions} getOptions={() => buildOptions(trend)} style={{ height: 380 }} />
        </Col>
        <Col xxl={4}>
          <div className="p-3 bg-light-subtle border-bottom border-dashed">
            <h4 className="fs-sm mb-1">Total Paid (period)</h4>
            <small className="text-muted fs-xs mb-0">${totalPaidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} across all payment types</small>
          </div>
          <Row xs={1} md={2} xxl={2} className="g-1 p-1">
            {byType.length === 0 && <Col><p className="text-muted small p-2 mb-0">No payments in this period.</p></Col>}
            {byType.map((t) => (
              <Col key={t.name}>
                <Card className="rounded-0 border shadow-none border-dashed mb-0">
                  <CardBody>
                    <div className="mb-3 d-flex justify-content-between align-items-center">
                      <h5 className="fs-xl mb-0">${t.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h5>
                      <span>{t.percentage}% <Icon icon="chart-pie" className="text-muted" /></span>
                    </div>
                    <p className="text-muted mb-2"><span>{t.name}</span></p>
                    <ProgressBar now={t.percentage} variant="secondary" style={{ height: '0.25rem' }} aria-label={t.name} />
                  </CardBody>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>
    </CardBody>
  </Card>
)

export default PaymentStatisticsWidget
