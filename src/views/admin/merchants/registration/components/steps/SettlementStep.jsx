import { Button, Col, Form, Row } from 'react-bootstrap'
import { useWizard } from 'react-use-wizard'
import Icon from '@/components/wrappers/Icon'
import { ACCOUNT_TYPES, BANKS, PAYMENT_MODES } from '../../data/merchantReferenceData'
import { Required } from './wizardConstants'

export const SettlementFields = ({ values, errors, setField, branchOptions, onBankChange, onBranchChange }) => (
  <Row className="g-3">
    <Col md={6}>
      <Form.Group>
        <Form.Label>Payment Mode <Required /></Form.Label>
        <Form.Select name="payment_mode" value={values.payment_mode} onChange={setField} isInvalid={!!errors.payment_mode}>
          {PAYMENT_MODES.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
        </Form.Select>
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>Account Type <Required /></Form.Label>
        <Form.Select name="account_type" value={values.account_type} onChange={setField}>
          {ACCOUNT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
        </Form.Select>
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>Bank Name <Required /></Form.Label>
        <Form.Select value={values.bank_name} onChange={(e) => onBankChange(e.target.value)} isInvalid={!!errors.bank_name}>
          <option value="">--SELECT--</option>
          {Object.keys(BANKS).map((bank) => <option key={bank} value={bank}>{bank}</option>)}
        </Form.Select>
        <Form.Control.Feedback type="invalid">{errors.bank_name}</Form.Control.Feedback>
      </Form.Group>
    </Col>
    <Col md={6}>
      <Form.Group>
        <Form.Label>Bank Branch <Required /></Form.Label>
        <Form.Select value={values.bank_branch} onChange={(e) => onBranchChange(e.target.value)} isInvalid={!!errors.bank_branch} disabled={!values.bank_name}>
          <option value="">--SELECT--</option>
          {branchOptions.map((branch) => <option key={branch} value={branch}>{branch}</option>)}
        </Form.Select>
        <Form.Control.Feedback type="invalid">{errors.bank_branch}</Form.Control.Feedback>
      </Form.Group>
    </Col>
    <Col md={4}>
      <Form.Group>
        <Form.Label>Account Name <Required /></Form.Label>
        <Form.Control name="account_name" value={values.account_name} onChange={setField} isInvalid={!!errors.account_name} />
        <Form.Control.Feedback type="invalid">{errors.account_name}</Form.Control.Feedback>
      </Form.Group>
    </Col>
    <Col md={4}>
      <Form.Group>
        <Form.Label>Account Number <Required /></Form.Label>
        <Form.Control name="account_number" value={values.account_number} onChange={setField} isInvalid={!!errors.account_number} />
        <Form.Control.Feedback type="invalid">{errors.account_number}</Form.Control.Feedback>
      </Form.Group>
    </Col>
    <Col md={4}>
      <Form.Group>
        <Form.Label>Routing Number</Form.Label>
        <Form.Control name="routing_number" value={values.routing_number} onChange={setField} readOnly />
      </Form.Group>
    </Col>
  </Row>
)

export const StepSettlement = (props) => {
  const { nextStep, previousStep } = useWizard()
  return (
    <div className="pt-4">
      <SettlementFields {...props} />
      <div className="d-flex justify-content-between mt-4">
        <Button variant="light" onClick={previousStep}><Icon icon="arrow-left" className="me-1" /> Back</Button>
        <Button variant="primary" onClick={() => { if (props.validateStep('settlement')) nextStep() }}>
          Next: Report Delivery <Icon icon="arrow-right" className="ms-1" />
        </Button>
      </div>
    </div>
  )
}
