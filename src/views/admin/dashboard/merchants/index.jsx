import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, ButtonGroup, Card, CardBody, Col, Row } from 'react-bootstrap'
import { useNavigate } from 'react-router'
import LoadingState from '@/components/LoadingState'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { canAccessModule } from '@/utils/modulePermissions'
import { accountStatusMetrics, dashboardMetrics, entityTypeMetrics, registrationStatusMetrics } from './components/dashboardMetrics'
import MerchantDashboardStatCard from './components/MerchantDashboardStatCard'
import StatusProgressChart from './components/StatusProgressChart'

const PERIOD_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
]

const MerchantDashboardPage = () => {
  const navigate = useNavigate()
  const currentUser = useCurrentUser()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('all')

  useEffect(() => {
    let active = true
    setLoading(true)

    ApiService.getMerchantDashboardStats(period === 'all' ? undefined : period)
      .then((response) => {
        if (!active) return
        setStats({
          totals: response?.totals || {},
          statusTotals: response?.status_totals || {},
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

  const totalTrackedRecords = Number(stats?.totals?.merchants || 0)

  const openDashboardRoute = (metric) => {
    const search = new URLSearchParams(metric.filter || {}).toString()

    navigate({
      pathname: metric.route,
      search: search ? `?${search}` : '',
    })
  }

  return (
    <>
      <PageBreadcrumb title="Dashboard" subtitle="Merchant Overview" />

      {error ? <Alert variant="danger">{error}</Alert> : null}

      <Card className="border-0 shadow-sm mb-3">
        <CardBody className="py-3">
          <Row className="align-items-center g-2">
            <Col lg={8}>
              <h5 className="mb-1">Merchant statistics overview</h5>
              <p className="text-muted mb-0 small">
                Monitor merchant accounts, activation status, and registration approvals in one place.
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
                  {period === 'all' ? 'Total Merchants' : `Total Merchants (${PERIOD_OPTIONS.find((option) => option.value === period)?.label})`}
                </div>
                <div className="h3 fw-bold mb-0">{totalTrackedRecords.toLocaleString()}</div>
              </div>
            </Col>
          </Row>
        </CardBody>
      </Card>

      {loading ? <LoadingState message="Loading merchant dashboard..." /> : (
        <>
          <Row className="g-3">
            {dashboardMetrics.map((metric) => {
              const canOpen = canAccessModule(currentUser, metric.route)

              return (
                <Col xxl={2} xl={4} md={6} sm={6} key={metric.key}>
                  <MerchantDashboardStatCard
                    metric={metric}
                    value={stats?.totals?.[metric.key] || 0}
                    canOpen={canOpen}
                    onOpen={() => openDashboardRoute(metric)}
                  />
                </Col>
              )
            })}
          </Row>

          <Row className="g-3 mt-0">
            <Col xl={4}>
              <StatusProgressChart
                title="Account status"
                description="Active vs. inactive merchant accounts."
                metrics={accountStatusMetrics}
                counts={stats?.statusTotals?.account_status}
                canAccess={(metric) => canAccessModule(currentUser, metric.route)}
                onOpen={openDashboardRoute}
              />
            </Col>
            <Col xl={4}>
              <StatusProgressChart
                title="Registration status"
                description="Approved vs. pending merchant registrations."
                metrics={registrationStatusMetrics}
                counts={stats?.statusTotals?.registration_status}
                canAccess={(metric) => canAccessModule(currentUser, metric.route)}
                onOpen={openDashboardRoute}
              />
            </Col>
            <Col xl={4}>
              <StatusProgressChart
                title="Entity type"
                description="Breakdown of merchants by entity type."
                metrics={entityTypeMetrics}
                counts={stats?.statusTotals?.entity_type}
                canAccess={(metric) => canAccessModule(currentUser, metric.route)}
                onOpen={openDashboardRoute}
                useEdgeAlignedLabels
              />
            </Col>
          </Row>
        </>
      )}
    </>
  )
}

export default MerchantDashboardPage
