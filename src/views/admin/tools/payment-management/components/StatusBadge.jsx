import { STATUS_COLORS, STATUS_LABELS } from '../paymentActions'

const StatusBadge = ({ status }) => (
  <span
    className="badge text-white"
    style={{ backgroundColor: STATUS_COLORS[status] || '#6c757d' }}
  >
    {STATUS_LABELS[status] || status}
  </span>
)

export default StatusBadge
