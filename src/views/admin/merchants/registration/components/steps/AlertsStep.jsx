import { Button, Col, Form, Row, Table } from 'react-bootstrap'
import { useWizard } from 'react-use-wizard'
import Icon from '@/components/wrappers/Icon'

export const AlertsFields = ({ values, errors, setField }) => (
  <>
    <p className="text-muted">You can set up an alert when the merchant balance hits a critical level.</p>
    <Row className="g-3 mb-3">
      <Col md={4}>
        <Form.Group>
          <Form.Label>Amount</Form.Label>
          <Form.Control name="alert_amount" value={values.alert_amount} onChange={setField} isInvalid={!!errors.alert_amount} />
          <Form.Control.Feedback type="invalid">{errors.alert_amount}</Form.Control.Feedback>
        </Form.Group>
      </Col>
    </Row>
    <div className="table-responsive">
      <Table borderless className="align-middle mb-0">
        <thead>
          <tr className="text-uppercase fs-xs text-muted">
            <th>Remind Me</th>
            <th>Every</th>
            <th>Recipients (comma separated)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="align-top" style={{ width: 160 }}>
              <Form.Check type="checkbox" id="alert_sms" name="alert_sms" label="SMS" checked={values.alert_sms} onChange={setField} />
            </td>
            <td className="align-top" style={{ width: 160 }}>
              <div className="input-group input-group-sm">
                <Form.Control name="alert_sms_hour" value={values.alert_sms_hour} onChange={setField} isInvalid={!!errors.alert_sms_hour} />
                <span className="input-group-text">hours</span>
              </div>
              {errors.alert_sms_hour && <div className="small text-danger">{errors.alert_sms_hour}</div>}
            </td>
            <td className="align-top">
              <Form.Control size="sm" name="alert_sms_recipients" value={values.alert_sms_recipients} onChange={setField} isInvalid={!!errors.alert_sms_recipients} />
              {errors.alert_sms_recipients && <div className="small text-danger">{errors.alert_sms_recipients}</div>}
            </td>
          </tr>
          <tr>
            <td className="align-top">
              <Form.Check type="checkbox" id="alert_email" name="alert_email" label="e-mail" checked={values.alert_email} onChange={setField} />
            </td>
            <td className="align-top">
              <div className="input-group input-group-sm">
                <Form.Control name="alert_email_hour" value={values.alert_email_hour} onChange={setField} isInvalid={!!errors.alert_email_hour} />
                <span className="input-group-text">hours</span>
              </div>
              {errors.alert_email_hour && <div className="small text-danger">{errors.alert_email_hour}</div>}
            </td>
            <td className="align-top">
              <Form.Control size="sm" name="alert_email_recipients" value={values.alert_email_recipients} onChange={setField} isInvalid={!!errors.alert_email_recipients} />
              {errors.alert_email_recipients && <div className="small text-danger">{errors.alert_email_recipients}</div>}
            </td>
          </tr>
        </tbody>
      </Table>
    </div>
  </>
)

export const StepAlerts = (props) => {
  const { nextStep, previousStep } = useWizard()
  return (
    <div className="pt-4">
      <AlertsFields {...props} />
      <div className="d-flex justify-content-between mt-4">
        <Button variant="light" onClick={previousStep}><Icon icon="arrow-left" className="me-1" /> Back</Button>
        <Button variant="primary" onClick={() => { if (props.validateStep('alerts')) nextStep() }}>
          Next: Other Info <Icon icon="arrow-right" className="ms-1" />
        </Button>
      </div>
    </div>
  )
}
