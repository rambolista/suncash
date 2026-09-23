import { Card, CardBody } from 'react-bootstrap'
import { CountUp } from '@/components/wrappers/CountUp'
import Icon from '@/components/wrappers/Icon'

/**
 * A bolder, more colorful variant of the shared `DashboardStatCard` — a tinted
 * background + a colored left border instead of just a colored icon badge,
 * and a bigger title, per request. Kept local to this page rather than
 * changing the shared card (which the main Dashboard also uses).
 */
const MonitoringStatCard = ({ metric, value, onOpen }) => (
  <Card
    role="button"
    onClick={onOpen}
    className={`h-100 border-0 shadow-sm cursor-pointer border-start border-4 border-${metric.variant} ${metric.bgClass}`}
  >
    <CardBody className="d-flex align-items-start justify-content-between gap-2 p-3">
      <div>
        <div className="text-uppercase fw-bold mb-1" style={{ fontSize: '0.95rem', letterSpacing: '.02em' }}>{metric.label}</div>
        <h3 className="mb-1">
          <CountUp start={0} end={Number(value) || 0} duration={1.2} />
        </h3>
        <p className="mb-0 small text-muted" style={{ lineHeight: 1.3 }}>{metric.description}</p>
      </div>
      <div
        className={`rounded-circle d-inline-flex align-items-center justify-content-center flex-shrink-0 bg-${metric.variant}`}
        style={{ width: 48, height: 48 }}
      >
        <Icon icon={metric.icon} className="text-white" style={{ fontSize: '1.3rem' }} />
      </div>
    </CardBody>
  </Card>
)

export default MonitoringStatCard
