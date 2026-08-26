import { useEffect, useState } from 'react'
import { Alert, Button, Col, Form, Modal, Row } from 'react-bootstrap'
import Select from '@/components/wrappers/Select'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const emptyForm = { merchant_id: null, minimum_account: '', maximum_account: '', email_address: '' }

const CreateStoreFloatAccountModal = ({ show, onHide, onSaved }) => {
  const { showNotification } = useNotificationContext()
  const [merchants, setMerchants] = useState([])
  const [values, setValues] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!show) return
    setValues(emptyForm)
    setErrors({})
    setFormError('')
    ApiService.getMerchants().then((data) => setMerchants(Array.isArray(data) ? data : []))
  }, [show])

  const merchantOptions = merchants.map((m) => ({
    value: m.id,
    label: `${m.dba_name || m.legal_name || m.merchant_name || 'Merchant'} (${m.client_id})`,
  }))

  const set = (name, value) => setValues((prev) => ({ ...prev, [name]: value }))

  const handleSave = async () => {
    setSubmitting(true)
    setFormError('')
    setErrors({})
    try {
      await ApiService.createStoreFloatAccount(values)
      showNotification({ title: 'Success', message: 'Store float account requested successfully.', variant: 'success' })
      onSaved?.()
      onHide()
    } catch (err) {
      if (err?.errors) setErrors(Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])))
      setFormError(err?.message || 'Failed to request store float account.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Add Store Float Account</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {formError && <Alert variant="danger">{formError}</Alert>}
        <Row className="g-3">
          <Col md={12}>
            <Form.Group>
              <Form.Label>Merchant *</Form.Label>
              <Select
                className="react-select"
                classNamePrefix="react-select"
                options={merchantOptions}
                value={merchantOptions.find((o) => o.value === values.merchant_id) || null}
                onChange={(option) => set('merchant_id', option?.value ?? null)}
                placeholder="Search merchant by name or client ID..."
                isSearchable
                isClearable
              />
              {errors.merchant_id && <div className="text-danger small mt-1">{errors.merchant_id}</div>}
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Minimum Threshold ($) *</Form.Label>
              <Form.Control type="number" step="0.01" value={values.minimum_account} onChange={(e) => set('minimum_account', e.target.value)} isInvalid={!!errors.minimum_account} />
              <Form.Control.Feedback type="invalid">{errors.minimum_account}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Maximum Threshold ($) *</Form.Label>
              <Form.Control type="number" step="0.01" value={values.maximum_account} onChange={(e) => set('maximum_account', e.target.value)} isInvalid={!!errors.maximum_account} />
              <Form.Control.Feedback type="invalid">{errors.maximum_account}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={12}>
            <Form.Group>
              <Form.Label>Notification Email *</Form.Label>
              <Form.Control type="email" value={values.email_address} onChange={(e) => set('email_address', e.target.value)} isInvalid={!!errors.email_address} />
              <Form.Control.Feedback type="invalid">{errors.email_address}</Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={onHide} disabled={submitting}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={submitting || !values.merchant_id}>
          {submitting ? 'Saving...' : 'Request Account'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default CreateStoreFloatAccountModal
