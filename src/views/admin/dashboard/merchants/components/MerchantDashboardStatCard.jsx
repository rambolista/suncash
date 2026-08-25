import { CountUp } from '@/components/wrappers/CountUp'
import Icon from '@/components/wrappers/Icon'
import clsx from 'clsx'
import { Card, CardBody } from 'react-bootstrap'

const MerchantDashboardStatCard = ({ metric, value, canOpen, onOpen }) => (
  <Card
    className={clsx('h-100 border border-body-secondary shadow-sm rounded-3 overflow-hidden', canOpen ? 'cursor-pointer' : 'opacity-75')}
    onClick={canOpen ? onOpen : undefined}
    role={canOpen ? 'button' : undefined}
  >
    <CardBody className="d-flex flex-column gap-2 p-3 h-100 bg-body">
      <div className="d-flex align-items-start justify-content-between gap-2">
        <div>
          <div className="text-muted text-uppercase fw-semibold mb-1" style={{ fontSize: '0.68rem', letterSpacing: '.04em' }}>{metric.label}</div>
          <h4 className="mb-1">
            <CountUp start={0} end={Number(value) || 0} duration={1.2} />
          </h4>
          <p className="text-muted mb-0 small" style={{ lineHeight: 1.35 }}>{metric.description}</p>
        </div>
        <div
          className={clsx('rounded-circle d-inline-flex align-items-center justify-content-center flex-shrink-0', metric.bgClass)}
          style={{ width: 44, height: 44 }}
        >
          <Icon icon={metric.icon} className={clsx(metric.colorClass)} style={{ fontSize: '1.2rem' }} />
        </div>
      </div>
    </CardBody>
  </Card>
)

export default MerchantDashboardStatCard
