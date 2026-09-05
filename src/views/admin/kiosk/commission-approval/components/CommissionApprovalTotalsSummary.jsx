import { Col, Row } from 'react-bootstrap'
import { money } from './format'

const METRICS = [
  { key: 'total_volume', label: 'Total Transaction Volume' },
  { key: 'total_revenue', label: 'Total Revenue' },
  { key: 'total_commission_payments', label: 'Total Commission Payments' },
]

const CommissionApprovalTotalsSummary = ({ totals }) => (
  <Row className="g-3 mb-3">
    {METRICS.map((m) => (
      <Col key={m.key} md={4}>
        <div className="border rounded p-2 h-100">
          <div className="text-muted fs-xxs text-uppercase">{m.label}</div>
          <div className="fw-semibold fs-lg">{money(totals?.[m.key])}</div>
        </div>
      </Col>
    ))}
  </Row>
)

export default CommissionApprovalTotalsSummary
