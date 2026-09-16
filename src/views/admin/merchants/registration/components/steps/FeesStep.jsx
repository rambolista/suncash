import { Alert, Button, Col, Form, Row, Table } from 'react-bootstrap'
import { useWizard } from 'react-use-wizard'
import Icon from '@/components/wrappers/Icon'
import { CHARGE_TO_OPTIONS, MAIN_TRANSACTION_TYPES } from '../../data/merchantReferenceData'

export const FeesFields = ({ values, errors, setField, setFee }) => {
  const feeErrorCount = Object.keys(errors).filter((key) => key.startsWith('fee_')).length

  const feeInput = (id, field, placeholder) => (
    <Form.Control
      size="sm"
      type="text"
      value={values.fees[id][field]}
      onChange={(e) => setFee(id, field, e.target.value)}
      placeholder={placeholder}
      isInvalid={!!errors[`fee_${field}_${id}`]}
    />
  )

  return (
    <>
      <Row className="g-3 mb-3">
        <Col md={4}>
          <Form.Group>
            <Form.Label>Revenue Share</Form.Label>
            <div className="input-group has-validation">
              <Form.Control name="revenue_value" value={values.revenue_value} onChange={setField} isInvalid={!!errors.revenue_value} placeholder="0.00" />
              <span className="input-group-text">%</span>
              <Form.Control.Feedback type="invalid">{errors.revenue_value}</Form.Control.Feedback>
            </div>
          </Form.Group>
        </Col>
      </Row>
      {feeErrorCount > 0 && (
        <Alert variant="danger" className="py-2">Some fee amounts aren&apos;t valid numbers — check the highlighted fields below.</Alert>
      )}
      <div className="fw-semibold text-uppercase fs-xs text-muted mb-2">Fees and Commissions</div>
      <div className="table-responsive">
        <Table size="sm" bordered className="align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>Transaction Type</th>
              <th style={{ width: 130 }}>Transaction Fee</th>
              <th style={{ width: 130 }}>Commission/Trans</th>
              <th style={{ width: 140 }}>Charge To</th>
            </tr>
          </thead>
          <tbody>
            {MAIN_TRANSACTION_TYPES.map((type) => (
              <tr key={type.id}>
                <td>{type.label}</td>
                <td>{feeInput(type.id, 'trans_fee', '0.00')}</td>
                <td>{feeInput(type.id, 'comms_per_trans', '0.00')}</td>
                <td>
                  {type.allowChargeTo ? (
                    <Form.Select size="sm" value={values.fees[type.id].charge_to} onChange={(e) => setFee(type.id, 'charge_to', e.target.value)}>
                      {CHARGE_TO_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </Form.Select>
                  ) : <span className="text-muted">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </>
  )
}

export const StepFees = (props) => {
  const { nextStep, previousStep } = useWizard()
  return (
    <div className="pt-4">
      <FeesFields {...props} />
      <div className="d-flex justify-content-between mt-4">
        <Button variant="light" onClick={previousStep}><Icon icon="arrow-left" className="me-1" /> Back</Button>
        <Button variant="primary" onClick={() => { if (props.validateStep('fees')) nextStep() }}>
          Next: Settlement <Icon icon="arrow-right" className="ms-1" />
        </Button>
      </div>
    </div>
  )
}
