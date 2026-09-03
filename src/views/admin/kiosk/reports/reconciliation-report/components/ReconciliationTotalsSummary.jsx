import { Col, Row } from 'react-bootstrap'
import { money } from './format'

const METRICS = [
  { key: 'total_running_balance', label: 'Total Opening Balance' },
  { key: 'total_cash_in', label: 'Total Cash In' },
  { key: 'total_cash_out', label: 'Total Cash Out' },
  { key: 'total_fee', label: 'Total Fees' },
  { key: 'total_vat', label: 'Total Vat' },
  { key: 'total_credit_adjustments', label: 'Total Credit Adjustment' },
  { key: 'total_debit_adjustments', label: 'Total Debit Adjustment' },
  { key: 'total_cash_loaded', label: 'Total Cash Loaded' },
  { key: 'total_deposits', label: 'Total Deposits' },
  { key: 'total_cash_movement', label: 'Total Cash Movement' },
  { key: 'total_closing_net_balance', label: 'Total Closing Net Balance' },
]

const ReconciliationTotalsSummary = ({ totals }) => (
  <Row className="g-3 mb-3">
    {METRICS.map((m) => (
      <Col key={m.key} md={4} lg={3}>
        <div className="border rounded p-2 h-100">
          <div className="text-muted fs-xxs text-uppercase">{m.label}</div>
          <div className="fw-semibold fs-lg">{money(totals?.[m.key])}</div>
        </div>
      </Col>
    ))}
  </Row>
)

export default ReconciliationTotalsSummary
