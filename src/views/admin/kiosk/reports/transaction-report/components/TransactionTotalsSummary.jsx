import { Col, Row } from 'react-bootstrap'
import { money } from './format'

const METRICS = [
  { key: 'total_cash_received', label: 'Total Cash Received', money: true },
  { key: 'total_fees', label: 'Total Fees', money: true },
  { key: 'total_vat', label: 'Total VAT', money: true },
  { key: 'grand_total_fees', label: 'Grand Total Fees', money: true },
  { key: 'total_product_amount', label: 'Total Product Amount', money: true },
  { key: 'transaction_count', label: 'Total Transaction Count', money: false },
]

const TransactionTotalsSummary = ({ totals }) => (
  <Row className="g-3 mb-3">
    {METRICS.map((m) => (
      <Col key={m.key} md={4} lg={2}>
        <div className="border rounded p-2 h-100">
          <div className="text-muted fs-xxs text-uppercase">{m.label}</div>
          <div className="fw-semibold fs-lg">{m.money ? money(totals?.[m.key]) : (totals?.[m.key] ?? 0)}</div>
        </div>
      </Col>
    ))}
  </Row>
)

export default TransactionTotalsSummary
