import { Badge, Card, CardBody } from 'react-bootstrap'
import clsx from 'clsx'
import Icon from '@/components/wrappers/Icon'

const MenuActivityCard = ({ config, counts, canOpen, onOpen }) => {
  const total = config.segments.reduce((sum, segment) => sum + Number(counts?.[segment.key] || 0), 0)

  return (
    <Card
      className={clsx('h-100 border border-body-secondary shadow-sm', canOpen ? 'cursor-pointer' : 'opacity-75')}
      onClick={canOpen ? onOpen : undefined}
      role={canOpen ? 'button' : undefined}
    >
      <CardBody className="d-flex flex-column gap-2 p-3">
        <div className="d-flex align-items-center justify-content-between gap-2">
          <div className="d-flex align-items-center gap-2">
            <span className="rounded-circle d-inline-flex align-items-center justify-content-center flex-shrink-0 bg-primary-subtle" style={{ width: 36, height: 36 }}>
              <Icon icon={config.icon} className="text-primary" style={{ fontSize: '1rem' }} />
            </span>
            <span className="fw-semibold">{config.label}</span>
          </div>
          <span className="h5 mb-0">{total.toLocaleString()}</span>
        </div>
        <div className="d-flex flex-wrap gap-2">
          {config.segments.map((segment) => (
            <Badge key={segment.key} bg={segment.variant} className="fw-normal">
              {segment.label}: {Number(counts?.[segment.key] || 0).toLocaleString()}
            </Badge>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}

export default MenuActivityCard
