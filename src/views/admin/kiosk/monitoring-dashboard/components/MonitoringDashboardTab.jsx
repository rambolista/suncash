import { Col, Row } from 'react-bootstrap'
import StatusProgressChart from '@/views/admin/dashboard/components/StatusProgressChart'
import MonitoringStatCard from './MonitoringStatCard'

const METRICS = [
  { key: 'total', label: 'Total Kiosks', description: 'All reporting terminals', icon: 'device-desktop', variant: 'primary', bgClass: 'bg-primary-subtle' },
  { key: 'online', label: 'Online', description: 'Heartbeat within range', icon: 'circle-check', variant: 'success', bgClass: 'bg-success-subtle', statusFilter: 'online' },
  { key: 'offline', label: 'Offline', description: 'Missed heartbeat', icon: 'plug-off', variant: 'danger', bgClass: 'bg-danger-subtle', statusFilter: 'offline' },
  { key: 'needs_replenishment', label: 'Needs Replenishment', description: 'ATM dispenser cash running low', icon: 'coin', variant: 'warning', bgClass: 'bg-warning-subtle', issueFilter: 'needs_replenishment' },
  { key: 'full', label: 'Full', description: 'Cash acceptor needs collection', icon: 'archive', variant: 'danger', bgClass: 'bg-danger-subtle', issueFilter: 'full' },
  { key: 'jammed', label: 'Jammed', description: 'Acceptor, dispenser, or recycler fault', icon: 'alert-triangle', variant: 'dark', bgClass: 'bg-dark-subtle', issueFilter: 'jammed' },
  { key: 'printer_issue', label: 'Printer Issues', description: 'Receipt paper path fault', icon: 'printer', variant: 'info', bgClass: 'bg-info-subtle', issueFilter: 'printer_issue' },
]

const CONNECTIVITY_METRICS = [
  { key: 'online', label: 'Online', chartColor: 'success', statusFilter: 'online' },
  { key: 'offline', label: 'Offline', chartColor: 'danger', statusFilter: 'offline' },
]

const ISSUE_METRICS = [
  { key: 'needs_replenishment', label: 'Needs Replenishment', chartColor: 'warning', issueFilter: 'needs_replenishment' },
  { key: 'full', label: 'Full', chartColor: 'danger', issueFilter: 'full' },
  { key: 'jammed', label: 'Jammed', chartColor: 'dark', issueFilter: 'jammed' },
  { key: 'printer_issue', label: 'Printer Issues', chartColor: 'info', issueFilter: 'printer_issue' },
]

/** Stat-tile + donut-chart summary for the Monitoring Dashboard's "Dashboard" tab. */
const MonitoringDashboardTab = ({ stats, onOpenList }) => (
  <>
    <Row className="g-3 row-cols-1 row-cols-sm-2 row-cols-lg-4">
      {METRICS.map((metric) => (
        <Col key={metric.key}>
          <MonitoringStatCard metric={metric} value={stats?.[metric.key] || 0} onOpen={() => onOpenList(metric.statusFilter || '', metric.issueFilter || '')} />
        </Col>
      ))}
    </Row>

    <Row className="g-3 mt-0">
      <Col xl={6}>
        <StatusProgressChart
          title="Connectivity"
          description="Online vs. offline terminals."
          metrics={CONNECTIVITY_METRICS}
          counts={stats}
          canAccess={() => true}
          onOpen={(metric) => onOpenList(metric.statusFilter || '', '')}
        />
      </Col>
      <Col xl={6}>
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
