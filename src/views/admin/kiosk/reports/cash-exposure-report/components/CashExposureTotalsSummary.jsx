import { Col, Row } from 'react-bootstrap'
import { money } from './format'

const METRICS = [
  { key: 'total_acceptor', label: 'Total Cash in Acceptors' },
  { key: 'total_dispenser', label: 'Total Cash Dispensers' },
  { key: 'total_reserve', label: 'Total Cash Reserve' },
  { key: 'total_reject', label: 'Total Cash Reject Bin' },
]

const CashExposureTotalsSummary = ({ totals }) => (
  <Row className="g-3 mb-3">
    {METRICS.map((m) => (
      <Col key={m.key} md={4} lg={2}>
        <div className="border rounded p-2 h-100">
          <div className="text-muted fs-xxs text-uppercase">{m.label}</div>
          <div className="fw-semibold fs-lg">{money(totals?.[m.key])}</div>
        </div>
      </Col>
    ))}
    <Col md={4} lg={4}>
      <div className="border border-primary rounded p-2 h-100">
        <div className="text-muted fs-xxs text-uppercase">Total Cash Exposure</div>
        <div className="fw-bold fs-lg">{money(totals?.total_exposure)}</div>
      </div>
    </Col>
  </Row>
)

export default CashExposureTotalsSummary
