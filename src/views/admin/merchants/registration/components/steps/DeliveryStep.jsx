import { Alert, Button, Form, Table } from 'react-bootstrap'
import { useWizard } from 'react-use-wizard'
import Icon from '@/components/wrappers/Icon'

export const DeliveryFields = ({ values, errors, setField }) => (
  <div className="table-responsive">
    <Table borderless className="align-middle mb-0">
      <thead>
        <tr className="text-uppercase fs-xs text-muted">
          <th>Deliver</th>
          <th>Frequency</th>
          <th>Recipients</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="align-top" style={{ width: 160 }}>
            <Form.Check type="checkbox" id="via_sms" name="via_sms" label="Via SMS" checked={values.via_sms} onChange={setField} />
          </td>
          <td className="align-top" style={{ width: 200 }}>
            <Form.Check type="checkbox" id="sms_daily" name="sms_daily" label="Daily" checked={values.sms_daily} onChange={setField} />
            <Form.Check type="checkbox" id="sms_weekly" name="sms_weekly" label="Weekly" checked={values.sms_weekly} onChange={setField} />
            <Form.Check type="checkbox" id="sms_monthly" name="sms_monthly" label="Monthly" checked={values.sms_monthly} onChange={setField} />
            {errors.sms_daily && <div className="small text-danger">{errors.sms_daily}</div>}
          </td>
          <td className="align-top">
            <Form.Control size="sm" className="mb-2" name="sms_primary" placeholder="Primary mobile number" value={values.sms_primary} onChange={setField} isInvalid={!!errors.sms_primary} />
            <Form.Control size="sm" name="sms_secondary" placeholder="Secondary mobile number" value={values.sms_secondary} onChange={setField} />
            {errors.sms_primary && <div className="small text-danger">{errors.sms_primary}</div>}
          </td>
        </tr>
        <tr>
          <td className="align-top">
            <Form.Check type="checkbox" id="via_email" name="via_email" label="Via e-mail" checked={values.via_email} onChange={setField} />
          </td>
          <td className="align-top">
            <Form.Check type="checkbox" id="email_daily" name="email_daily" label="Daily" checked={values.email_daily} onChange={setField} />
            <Form.Check type="checkbox" id="email_weekly" name="email_weekly" label="Weekly" checked={values.email_weekly} onChange={setField} />
            <Form.Check type="checkbox" id="email_monthly" name="email_monthly" label="Monthly" checked={values.email_monthly} onChange={setField} />
            {errors.email_daily && <div className="small text-danger">{errors.email_daily}</div>}
          </td>
          <td className="align-top">
            <Form.Control size="sm" className="mb-2" name="email_primary" placeholder="Primary e-mail" value={values.email_primary} onChange={setField} isInvalid={!!errors.email_primary} />
            <Form.Control size="sm" name="email_secondary" placeholder="Secondary e-mail" value={values.email_secondary} onChange={setField} />
            {errors.email_primary && <div className="small text-danger">{errors.email_primary}</div>}
          </td>
        </tr>
        <tr>
          <td className="align-top">
            <Form.Check type="checkbox" id="via_hardcopy" name="via_hardcopy" label="Via Hardcopy" checked={values.via_hardcopy} onChange={setField} />
          </td>
          <td className="align-top">
            <Form.Check type="checkbox" id="hardcopy_daily" name="hardcopy_daily" label="Daily" checked={values.hardcopy_daily} onChange={setField} />
            <Form.Check type="checkbox" id="hardcopy_weekly" name="hardcopy_weekly" label="Weekly" checked={values.hardcopy_weekly} onChange={setField} />
            <Form.Check type="checkbox" id="hardcopy_monthly" name="hardcopy_monthly" label="Monthly" checked={values.hardcopy_monthly} onChange={setField} />
            {errors.hardcopy_daily && <div className="small text-danger">{errors.hardcopy_daily}</div>}
          </td>
          <td className="align-top">
            <Form.Control as="textarea" rows={2} size="sm" name="hardcopy_address" placeholder="Complete delivery address" value={values.hardcopy_address} onChange={setField} isInvalid={!!errors.hardcopy_address} />
            {errors.hardcopy_address && <div className="small text-danger">{errors.hardcopy_address}</div>}
          </td>
        </tr>
      </tbody>
    </Table>
    {errors.via_sms && <Alert variant="danger" className="mt-2 py-2">{errors.via_sms}</Alert>}
  </div>
)

export const StepDelivery = (props) => {
  const { nextStep, previousStep } = useWizard()
  return (
    <div className="pt-4">
      <DeliveryFields {...props} />
      <div className="d-flex justify-content-between mt-4">
        <Button variant="light" onClick={previousStep}><Icon icon="arrow-left" className="me-1" /> Back</Button>
        <Button variant="primary" onClick={() => { if (props.validateStep('delivery')) nextStep() }}>
          Next: Alert Settings <Icon icon="arrow-right" className="ms-1" />
        </Button>
      </div>
    </div>
  )
}
