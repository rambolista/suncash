import { useEffect, useState } from 'react'
import { Button, Col, Form, Row, Spinner } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const emptyForm = { minimum_account: '', maximum_account: '', email_address: '' }

const FloatAccountPanel = ({ merchant, editable }) => {
  const { showNotification } = useNotificationContext()
  const [state, setState] = useState(null)
  const [values, setValues] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  const load = () => {
    if (!merchant) return
    setLoading(true)
    ApiService.getMerchantFloatAccount(merchant.id)
      .then((data) => {
        setState(data)
        const source = data?.approved_account || data?.latest_request
        setValues({
          minimum_account: source?.minimum_account ?? '',
          maximum_account: source?.maximum_account ?? '',
          email_address: source?.email_address ?? '',
        })
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load store float account.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchant])

  const handleToggle = async () => {
    setSubmitting(true)
    try {
      const result = await ApiService.toggleMerchantFloatAccount(merchant.id)
      showNotification({ title: 'Success', message: result?.message || 'Store float setting updated.', variant: 'success' })
      load()
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to update store float setting.', variant: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  const hasApproved = !!state?.approved_account
  const latestStatus = state?.latest_request?.status
  const canRequest = !latestStatus || latestStatus === 'REJECTED'

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})
    try {
      if (hasApproved) {
        await ApiService.updateMerchantFloatAccount(merchant.id, values)
        showNotification({ title: 'Success', message: 'Store float account updated successfully.', variant: 'success' })
      } else {
        await ApiService.requestMerchantFloatAccount(merchant.id, values)
        showNotification({ title: 'Success', message: 'Store float account requested successfully.', variant: 'success' })
      }
      load()
    } catch (err) {
      setErrors(err?.errors ?? {})
      showNotification({ title: 'Failed', message: err?.message || 'Failed to save store float account.', variant: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="text-center py-4"><Spinner size="sm" /></div>

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between border rounded p-3 mb-3">
        <div>
          <div className="fw-medium">Store float feature</div>
          <div className="text-muted small">{state?.enabled ? 'Enabled for this merchant' : 'Disabled for this merchant'}</div>
        </div>
        {editable && (
          <Button variant={state?.enabled ? 'outline-danger' : 'outline-success'} size="sm" onClick={handleToggle} disabled={submitting}>
            {state?.enabled ? 'Disable' : 'Enable'}
          </Button>
        )}
      </div>

      {latestStatus && latestStatus !== 'APPROVED' && (
        <div className="alert alert-info py-2 small mb-3">
          Latest request status: <strong>{latestStatus}</strong>
        </div>
      )}

      {editable && (hasApproved || canRequest) && (
        <Form onSubmit={handleSubmit} noValidate>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Minimum Amount <span className="text-danger">*</span></Form.Label>
                <Form.Control type="number" min="0" step="0.01" value={values.minimum_account} onChange={(e) => setValues((prev) => ({ ...prev, minimum_account: e.target.value }))} isInvalid={!!errors.minimum_account} />
                <Form.Control.Feedback type="invalid">{errors.minimum_account?.[0]}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Maximum Amount <span className="text-danger">*</span></Form.Label>
                <Form.Control type="number" min="0" step="0.01" value={values.maximum_account} onChange={(e) => setValues((prev) => ({ ...prev, maximum_account: e.target.value }))} isInvalid={!!errors.maximum_account} />
                <Form.Control.Feedback type="invalid">{errors.maximum_account?.[0]}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label>Notification E-mail <span className="text-danger">*</span></Form.Label>
                <Form.Control type="email" value={values.email_address} onChange={(e) => setValues((prev) => ({ ...prev, email_address: e.target.value }))} isInvalid={!!errors.email_address} />
                <Form.Control.Feedback type="invalid">{errors.email_address?.[0]}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          <div className="d-flex justify-content-end mt-3">
            <Button variant="primary" size="sm" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : hasApproved ? 'Save changes' : 'Submit request'}
            </Button>
          </div>
        </Form>
      )}
    </div>
  )
}

export default FloatAccountPanel
