import { useEffect, useState } from 'react'
import { Alert, Button, ButtonGroup, Card, CardBody, Col, Row } from 'react-bootstrap'
import { useNavigate } from 'react-router'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import { canAccessModule } from '@/utils/modulePermissions'
import DashboardStatCard from '../components/DashboardStatCard'
import StatusProgressChart from '../components/StatusProgressChart'
import { accountStatusMetrics, customerTypeMetrics, dashboardMetrics, menuActivityConfig, verificationStatusMetrics } from './components/dashboardMetrics'
import MenuActivityCard from './components/MenuActivityCard'

const PERIOD_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
]

const CustomerOverviewPanel = ({ currentUser }) => {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('all')

  useEffect(() => {
    let active = true
    setLoading(true)

    ApiService.getCustomerDashboardStats(period === 'all' ? undefined : period)
      .then((response) => {
        if (!active) return
        setStats({
          totals: response?.totals || {},
          statusTotals: response?.status_totals || {},
          menus: response?.menus || {},
        })
        setError('')
      })
      .catch((loadError) => {
        if (!active) return
        setError(loadError?.message || 'Unable to load dashboard statistics.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [period])

  const totalTrackedRecords = Number(stats?.totals?.customers || 0)

  const openDashboardRoute = (metric) => {
    const search = new URLSearchParams(metric.filter || {}).toString()

    navigate({
      pathname: metric.route,
      search: search ? `?${search}` : '',
    })
  }

  return (
    <>
      {error ? <Alert variant="danger">{error}</Alert> : null}

      <Card className="border-0 shadow-sm mb-3">
        <CardBody className="py-3">
          <Row className="align-items-center g-2">
            <Col lg={8}>
              <h5 className="mb-1">Customer statistics overview</h5>
              <p className="text-muted mb-0 small">
                Monitor customer accounts, verification status, and registration types in one place.
                Click any card to open its corresponding view.
              </p>
              <ButtonGroup size="sm" className="mt-2">
                {PERIOD_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={period === option.value ? 'primary' : 'light'}
                    onClick={() => setPeriod(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </ButtonGroup>
            </Col>
            <Col lg={4}>
              <div className="rounded bg-body-tertiary py-2 px-3 text-lg-end">
                <div className="text-muted text-uppercase fs-xs fw-semibold mb-1">
                  {period === 'all' ? 'Total Customers' : `Total Customers (${PERIOD_OPTIONS.find((option) => option.value === period)?.label})`}
                </div>
                <div className="h3 fw-bold mb-0">{totalTrackedRecords.toLocaleString()}</div>
              </div>
            </Col>
          </Row>
        </CardBody>
      </Card>

      {loading ? <LoadingState message="Loading customer dashboard..." /> : (
        <>
          <Row className="g-3 row-cols-1 row-cols-md-5">
            {dashboardMetrics.map((metric) => {
              const canOpen = canAccessModule(currentUser, metric.route)

              return (
                <Col key={metric.key}>
                  <DashboardStatCard
                    metric={metric}
                    value={stats?.totals?.[metric.key] || 0}
                    canOpen={canOpen}
                    onOpen={() => openDashboardRoute(metric)}
                  />
                </Col>
              )
            })}
          </Row>

          <Row className="g-3 row-cols-1 row-cols-md-5 mt-1">
            {menuActivityConfig.map((config) => {
              const canOpen = canAccessModule(currentUser, config.route)

              return (
                <Col key={config.key}>
                  <MenuActivityCard
                    config={config}
                    counts={stats?.menus?.[config.key]}
                    canOpen={canOpen}
                    onOpen={() => openDashboardRoute({ route: config.route })}
                  />
                </Col>
              )
            })}
          </Row>

          <Row className="g-3 mt-0">
            <Col xl={4}>
              <StatusProgressChart
                title="Account status"
                description="Active vs. inactive customer accounts."
                metrics={accountStatusMetrics}
                counts={stats?.statusTotals?.account_status}
                canAccess={(metric) => canAccessModule(currentUser, metric.route)}
                onOpen={openDashboardRoute}
              />
            </Col>
            <Col xl={4}>
              <StatusProgressChart
                title="Verification status"
                description="Breakdown of customers by KYC upgrade status."
                metrics={verificationStatusMetrics}
                counts={stats?.statusTotals?.verification_status}
                canAccess={(metric) => canAccessModule(currentUser, metric.route)}
                onOpen={openDashboardRoute}
                useEdgeAlignedLabels
              />
            </Col>
            <Col xl={4}>
              <StatusProgressChart
                title="Customer type"
                description="New vs. existing customers."
                metrics={customerTypeMetrics}
                counts={stats?.statusTotals?.customer_type}
                canAccess={(metric) => canAccessModule(currentUser, metric.route)}
                onOpen={openDashboardRoute}
              />
            </Col>
          </Row>
        </>
      )}
    </>
  )
}

export default CustomerOverviewPanel
