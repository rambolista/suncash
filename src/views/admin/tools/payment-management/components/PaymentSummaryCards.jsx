import { Card, CardBody, Col, Row } from 'react-bootstrap'
import { CountUp } from '@/components/wrappers/CountUp'
import Icon from '@/components/wrappers/Icon'
import { STATUS_COLORS } from '../paymentActions'

const ICONS = { PENDING: 'clipboard-list', VERIFIED: 'circle-check', APPROVED: 'thumb-up', PAID: 'cash', FAILED: 'alert-triangle' }

/** The 5 status snapshot cards from legacy's `summary-grid` (Pending/Verified/Approved/Paid Today/Failed). */
const PaymentSummaryCards = ({ summary, onOpen }) => (
  <Row className="g-3 row-cols-1 row-cols-sm-2 row-cols-lg-5">
    {summary.map((s) => (
      <Col key={s.status}>
        <Card role="button" onClick={() => onOpen(s.status)} className="h-100 border-0 shadow-sm cursor-pointer border-start border-4" style={{ borderLeftColor: STATUS_COLORS[s.status] }}>
          <CardBody className="d-flex align-items-center gap-3 p-3">
            <div className="rounded-circle d-inline-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 44, height: 44, backgroundColor: STATUS_COLORS[s.status] }}>
              <Icon icon={ICONS[s.status]} className="text-white" style={{ fontSize: '1.2rem' }} />
            </div>
            <div>
              <div className="text-uppercase fw-bold text-muted" style={{ fontSize: '0.75rem', letterSpacing: '.02em' }}>{s.label}</div>
              <h4 className="mb-0"><CountUp start={0} end={s.count} duration={1} /></h4>
              <div className="small text-muted">${s.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
          </CardBody>
        </Card>
      </Col>
    ))}
  </Row>
)

export default PaymentSummaryCards
