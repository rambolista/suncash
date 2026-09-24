import { Card, CardBody } from 'react-bootstrap'
import Icon from '@/components/wrappers/Icon'
import { PROCESS_FLOW, STATUS_COLORS } from '../paymentActions'

const PaymentProcessFlow = () => (
  <Card className="h-100">
    <CardBody>
      <h6 className="mb-3">Payment Process Flow</h6>
      <div className="d-flex align-items-center flex-wrap gap-1">
        {PROCESS_FLOW.map((step, index) => (
          <div key={step.status} className="d-flex align-items-center gap-1">
            <div className="d-flex flex-column align-items-center" style={{ width: 78 }}>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white mb-1"
                style={{ width: 34, height: 34, backgroundColor: STATUS_COLORS[step.status] }}
              >
                <Icon icon={step.icon} style={{ fontSize: '1rem' }} />
              </div>
              <small className="text-center text-muted" style={{ fontSize: '0.7rem', lineHeight: 1.15 }}>{step.label}</small>
            </div>
            {index < PROCESS_FLOW.length - 1 && <Icon icon="arrow-right" className="text-muted mb-3" />}
          </div>
        ))}
      </div>
    </CardBody>
  </Card>
)

export default PaymentProcessFlow
