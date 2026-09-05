import { Col, Row } from 'react-bootstrap'
import { money } from './format'

const METRICS = [
  { key: 'total_cash_collected', label: 'Total Cash-In Amount' },
  { key: 'total_cash_dispensed', label: 'Total Cash-Out Amount' },
  { key: 'total_partner_deposits', label: 'Total Partner Deposits' },
  { key: 'total_partner_withdrawals', label: 'Total Partner Withdrawals' },
  { key: 'principal_due_to_suncash', label: 'Principal Due to SunCash' },
  { key: 'total_fees', label: 'Total Fees' },
  { key: 'total_vat', label: 'Total VAT' },
  { key: 'total_commission', label: 'Total Commission' },
  { key: 'total_net_settlement', label: 'Net Settlement' },
]

const PartnerSettlementTotalsSummary = ({ totals }) => (
  <Row className="g-3 mb-3">
    {METRICS.map((m) => (
      <Col key={m.key} md={4} lg={3}>
        <div className="border rounded p-2 h-100">
          <div className="text-muted fs-xxs text-uppercase">{m.label}</div>
          <div className="fw-semibold fs-lg">{money(totals?.[m.key])}</div>
        </div>
      </Col>
    ))}
    <Col md={4} lg={3}>
      <div className="border rounded p-2 h-100">
        <div className="text-muted fs-xxs text-uppercase">Total Transaction Count</div>
        <div className="fw-semibold fs-lg">{totals?.total_transaction_count ?? 0}</div>
      </div>
    </Col>
  </Row>
)

export default PartnerSettlementTotalsSummary
