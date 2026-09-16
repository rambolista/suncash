import { Alert, Button, Card } from 'react-bootstrap'
import { useWizard } from 'react-use-wizard'
import Icon from '@/components/wrappers/Icon'
import { entityTypeLabel } from '../../data/merchantReferenceData'
import { findStepIndexForErrors, STEPS } from './wizardConstants'

const ReviewRow = ({ icon, label, value }) => (
  <div className="d-flex gap-3 py-3 border-bottom">
    <span className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary flex-shrink-0" style={{ width: 36, height: 36 }}>
      <Icon icon={icon} />
    </span>
    <div>
      <div className="text-uppercase text-muted small" style={{ fontSize: '0.7rem', letterSpacing: '0.04em' }}>{label}</div>
      <div className="fw-medium">{value}</div>
    </div>
  </div>
)

export const StepReview = ({ values, onValidate, onSubmit, submitting, formError }) => {
  const { previousStep, goToStep } = useWizard()

  const feeCount = Object.values(values.fees).filter((fee) => String(fee.trans_fee ?? '').trim() !== '').length
  const deliveryMethods = [values.via_sms && 'SMS', values.via_email && 'e-mail', values.via_hardcopy && 'Hardcopy'].filter(Boolean)
  const alertMethods = [values.alert_sms && 'SMS', values.alert_email && 'e-mail'].filter(Boolean)
  const willAutoApprove = [5, 6].includes(Number(values.entity_type))

  const handleFileClick = () => {
    const validationErrors = onValidate()
    if (Object.keys(validationErrors).length > 0) {
      goToStep(findStepIndexForErrors(validationErrors, STEPS))
      return
    }
    onSubmit()
  }

  return (
    <div className="pt-4">
      {formError && <Alert variant="danger">{formError}</Alert>}
      <Card className="border">
        <Card.Body className="py-1 last-child-no-border">
          <ReviewRow icon="building-store" label="Merchant" value={`${values.merchant_id || '—'} — ${values.exact_legal_name || 'No legal name entered'} (${entityTypeLabel(values.entity_type)})${values.ezpay_merchant ? ' · Ezpay' : ''}`} />
          <ReviewRow icon="address-book" label="Contact" value={`${values.contactname || '—'} · ${values.contactmobile || '—'} · ${values.contactemail || '—'}`} />
          <ReviewRow icon="building-bank" label="Settlement" value={values.bank_name ? `${values.bank_name} — ${values.bank_branch || '—'} · Acct ${values.account_number || '—'}` : 'Not specified'} />
          <ReviewRow icon="report" label="Report delivery" value={deliveryMethods.length ? deliveryMethods.join(', ') : 'None selected'} />
          <ReviewRow icon="bell" label="Alerts" value={alertMethods.length ? alertMethods.join(', ') : 'None configured'} />
          <ReviewRow icon="wallet" label="Fee schedule" value={feeCount ? `${feeCount} transaction ${feeCount === 1 ? 'type' : 'types'} priced` : 'No fees configured yet'} />
        </Card.Body>
      </Card>
      <p className="small text-muted mt-3 mb-0">
        Registering will create this merchant with registration status <strong>{willAutoApprove ? 'Approved' : 'Pending'}</strong> and a portal login using the username above.
      </p>
      <div className="d-flex justify-content-between mt-4">
        <Button variant="light" onClick={previousStep} disabled={submitting}><Icon icon="arrow-left" className="me-1" /> Back</Button>
        <Button variant="success" onClick={handleFileClick} disabled={submitting}>
          <Icon icon="check" className="me-1" /> {submitting ? 'Saving…' : 'Save Registration'}
        </Button>
      </div>
    </div>
  )
}
