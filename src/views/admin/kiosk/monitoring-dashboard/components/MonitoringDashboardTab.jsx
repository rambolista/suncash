import { ButtonGroup, Col, Row, ToggleButton } from 'react-bootstrap'
import StatusProgressChart from '@/views/admin/dashboard/components/StatusProgressChart'
import MonitoringStatCard from './MonitoringStatCard'

const TYPE_SCOPES = [
  { value: '', label: 'All' },
  { value: 'kiosk', label: 'Kiosk' },
  { value: 'atm', label: 'ATM' },
]

const METRICS = [
  { key: 'total', label: 'Total Kiosks', description: 'All reporting terminals', icon: 'device-desktop', variant: 'primary', bgClass: 'bg-primary-subtle' },
  { key: 'online', label: 'Online', description: 'Heartbeat within range', icon: 'circle-check', variant: 'success', bgClass: 'bg-success-subtle', statusFilter: 'online' },
  { key: 'offline', label: 'Offline', description: 'Missed heartbeat', icon: 'plug-off', variant: 'danger', bgClass: 'bg-danger-subtle', statusFilter: 'offline' },
  { key: 'needs_replenishment', label: 'Needs Replenishment', description: 'ATM dispenser cash running low', icon: 'coin', variant: 'warning', bgClass: 'bg-warning-subtle', issueFilter: 'needs_replenishment' },
  { key: 'needs_cash_collection', label: 'Collect Cash', description: 'Acceptor approaching or at its clearing threshold', icon: 'archive', variant: 'danger', bgClass: 'bg-danger-subtle', issueFilter: 'needs_cash_collection' },
  { key: 'jammed', label: 'Jammed', description: 'Acceptor, dispenser, or recycler fault', icon: 'alert-triangle', variant: 'dark', bgClass: 'bg-dark-subtle', issueFilter: 'jammed' },
  { key: 'printer_issue', label: 'Printer Issues', description: 'Fault stopping printing (jam, cover open, spooling)', icon: 'printer', variant: 'info', bgClass: 'bg-info-subtle', issueFilter: 'printer_issue' },
  { key: 'paper_low', label: 'Low Paper', description: 'Receipt paper needs a refill', icon: 'file-alert', variant: 'warning', bgClass: 'bg-warning-subtle', issueFilter: 'paper_low' },
]

const CONNECTIVITY_METRICS = [
  { key: 'online', label: 'Online', chartColor: 'success', statusFilter: 'online' },
  { key: 'offline', label: 'Offline', chartColor: 'danger', statusFilter: 'offline' },
]

const TERMINAL_TYPE_METRICS = [
  { key: 'kiosk', label: 'Kiosk', chartColor: 'primary', typeFilter: 'kiosk' },
  { key: 'atm', label: 'ATM', chartColor: 'info', typeFilter: 'atm' },
]

const ISSUE_METRICS = [
  { key: 'needs_replenishment', label: 'Needs Replenishment', chartColor: 'warning', issueFilter: 'needs_replenishment' },
  { key: 'needs_cash_collection', label: 'Collect Cash', chartColor: 'danger', issueFilter: 'needs_cash_collection' },
  { key: 'jammed', label: 'Jammed', chartColor: 'dark', issueFilter: 'jammed' },
  { key: 'printer_issue', label: 'Printer Issues', chartColor: 'info', issueFilter: 'printer_issue' },
  { key: 'paper_low', label: 'Low Paper', chartColor: 'warning', issueFilter: 'paper_low' },
]

/** Stat-tile + donut-chart summary for the Monitoring Dashboard's "Dashboard" tab. */
const MonitoringDashboardTab = ({ stats, typeScope, onTypeScopeChange, onOpenList, onOpenType }) => (
  <>
    <div className="d-flex justify-content-start mb-3">
      <ButtonGroup>
        {TYPE_SCOPES.map((scope) => (
          <ToggleButton
            key={scope.value || 'all'}
            id={`monitoring-type-scope-${scope.value || 'all'}`}
            type="radio"
            variant="outline-primary"
            checked={typeScope === scope.value}
            value={scope.value}
            onChange={() => onTypeScopeChange(scope.value)}
          >
            {scope.label}
          </ToggleButton>
        ))}
      </ButtonGroup>
    </div>

    <Row className="g-3 row-cols-1 row-cols-sm-2 row-cols-lg-4">
      {METRICS.map((metric) => (
        <Col key={metric.key}>
          <MonitoringStatCard metric={metric} value={stats?.[metric.key] || 0} onOpen={() => onOpenList(metric.statusFilter || '', metric.issueFilter || '')} />
        </Col>
      ))}
    </Row>

    <Row className="g-3 mt-0">
      <Col xl={4}>
        <StatusProgressChart
          title="Connectivity"
          description="Online vs. offline terminals."
          metrics={CONNECTIVITY_METRICS}
          counts={stats}
          canAccess={() => true}
          onOpen={(metric) => onOpenList(metric.statusFilter || '', '')}
        />
      </Col>
      <Col xl={4}>
        <StatusProgressChart
          title="Terminal Type"
          description="Kiosk vs. ATM split."
          metrics={TERMINAL_TYPE_METRICS}
          counts={stats}
          canAccess={() => true}
          onOpen={(metric) => onOpenType(metric.typeFilter)}
        />
      </Col>
      <Col xl={4}>
        <StatusProgressChart
          title="Hardware Issues"
          description="Breakdown of flagged issues among online terminals."
          metrics={ISSUE_METRICS}
          counts={stats}
          canAccess={() => true}
          onOpen={(metric) => onOpenList('', metric.issueFilter || '')}
        />
      </Col>
    </Row>
  </>
)

export default MonitoringDashboardTab
