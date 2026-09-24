import { Card, CardBody } from 'react-bootstrap'
import { LEGEND_STATUSES, STATUS_COLORS, STATUS_LABELS } from '../paymentActions'

const StatusLegend = () => (
  <Card className="h-100">
    <CardBody>
      <h6 className="mb-3">Status Legend</h6>
      <div className="d-flex flex-wrap gap-3">
        {LEGEND_STATUSES.map((status) => (
          <span key={status} className="d-flex align-items-center gap-2 small">
            <span className="rounded-circle d-inline-block" style={{ width: 10, height: 10, backgroundColor: STATUS_COLORS[status] }} />
            {STATUS_LABELS[status]}
          </span>
        ))}
      </div>
    </CardBody>
  </Card>
)

export default StatusLegend
