import { useEffect, useState } from 'react'
import { Alert, Button, Col, Form, Modal, Row } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const emptyForm = {
  owner_name: '', dob: '', mobile_number: '', position_level: '', signatory_rights: '',
  id_type: '', id_number: '', expiry_date: '', s_id_type: '', s_id_number: '', s_expiry_date: '',
}

const SIGNATORY_BANDS = ['Below $5,000', '$5,000 - $10,000', '$10,000 - $20,000', '$20,000 - $30,000', 'Above $30,000']

const OwnerFormModal = ({ show, onHide, merchantId, owner, onSaved }) => {
  const { showNotification } = useNotificationContext()
  const [values, setValues] = useState(emptyForm)
  const [idTypes, setIdTypes] = useState([])
  const [positionLevels, setPositionLevels] = useState([])
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!show) return
    setValues(owner ? {
      owner_name: owner.owner_name || '',
      dob: owner.dob || '',
      mobile_number: owner.mobile_number || '',
      position_level: owner.position_level || '',
      signatory_rights: owner.signatory_rights || '',
      id_type: owner.id_type || '',
      id_number: owner.id_number || '',
      expiry_date: owner.expiry_date || '',
      s_id_type: owner.s_id_type || '',
      s_id_number: owner.s_id_number || '',
      s_expiry_date: owner.s_expiry_date || '',
    } : emptyForm)
    setErrors({})
    setFormError('')
    ApiService.getMerchantTypeIdTypes().then((data) => setIdTypes(Array.isArray(data) ? data : []))
    ApiService.getMerchantTypePositionLevels().then((data) => setPositionLevels(Array.isArray(data) ? data : []))
  }, [show, owner])

  const set = (name, value) => setValues((prev) => ({ ...prev, [name]: value }))

  const handleSave = async () => {
    setSubmitting(true)
    setFormError('')
    setErrors({})
    try {
      if (owner) {
        await ApiService.updateBusinessOwner(merchantId, owner.id, values)
      } else {
        await ApiService.addBusinessOwner(merchantId, values)
      }
      showNotification({ title: 'Success', message: `Owner ${owner ? 'updated' : 'added'} successfully.`, variant: 'success' })
      onSaved?.()
      onHide()
    } catch (err) {
      if (err?.errors) setErrors(Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])))
      setFormError(err?.message || 'Failed to save owner.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{owner ? 'Edit Owner' : 'Add Owner'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {formError && <Alert variant="danger">{formError}</Alert>}
        <Row className="g-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Full Name *</Form.Label>
              <Form.Control value={values.owner_name} onChange={(e) => set('owner_name', e.target.value)} isInvalid={!!errors.owner_name} />
              <Form.Control.Feedback type="invalid">{errors.owner_name}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label>Date of Birth *</Form.Label>
              <Form.Control type="date" value={values.dob} onChange={(e) => set('dob', e.target.value)} isInvalid={!!errors.dob} />
              <Form.Control.Feedback type="invalid">{errors.dob}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label>Mobile *</Form.Label>
              <Form.Control value={values.mobile_number} onChange={(e) => set('mobile_number', e.target.value)} isInvalid={!!errors.mobile_number} />
              <Form.Control.Feedback type="invalid">{errors.mobile_number}</Form.Control.Feedback>
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
              <Form.Label>Position Level *</Form.Label>
              <Form.Select value={values.position_level} onChange={(e) => set('position_level', e.target.value)} isInvalid={!!errors.position_level}>
                <option value="">--SELECT--</option>
                {positionLevels.map((p) => <option key={p.id} value={p.id}>{p.description}</option>)}
              </Form.Select>
              <Form.Control.Feedback type="invalid">{errors.position_level}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Signatory Rights</Form.Label>
              <Form.Select value={values.signatory_rights} onChange={(e) => set('signatory_rights', e.target.value)}>
                <option value="">--SELECT--</option>
                {SIGNATORY_BANDS.map((band) => <option key={band} value={band}>{band}</option>)}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={4}>
            <Form.Group>
              <Form.Label>Primary ID Type *</Form.Label>
              <Form.Select value={values.id_type} onChange={(e) => set('id_type', e.target.value)} isInvalid={!!errors.id_type}>
                <option value="">--SELECT--</option>
                {idTypes.map((t) => <option key={t.code} value={t.code}>{t.description}</option>)}
              </Form.Select>
              <Form.Control.Feedback type="invalid">{errors.id_type}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Primary ID Number *</Form.Label>
              <Form.Control value={values.id_number} onChange={(e) => set('id_number', e.target.value)} isInvalid={!!errors.id_number} />
              <Form.Control.Feedback type="invalid">{errors.id_number}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Primary ID Expiry *</Form.Label>
              <Form.Control type="date" value={values.expiry_date} onChange={(e) => set('expiry_date', e.target.value)} isInvalid={!!errors.expiry_date} />
              <Form.Control.Feedback type="invalid">{errors.expiry_date}</Form.Control.Feedback>
            </Form.Group>
          </Col>

          <Col md={4}>
            <Form.Group>
              <Form.Label>Secondary ID Type</Form.Label>
              <Form.Select value={values.s_id_type} onChange={(e) => set('s_id_type', e.target.value)}>
                <option value="">--SELECT--</option>
                {idTypes.map((t) => <option key={t.code} value={t.code}>{t.description}</option>)}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Secondary ID Number</Form.Label>
              <Form.Control value={values.s_id_number} onChange={(e) => set('s_id_number', e.target.value)} />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Secondary ID Expiry</Form.Label>
              <Form.Control type="date" value={values.s_expiry_date} onChange={(e) => set('s_expiry_date', e.target.value)} />
            </Form.Group>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={onHide} disabled={submitting}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={submitting}>
          {submitting ? 'Saving...' : owner ? 'Save Changes' : 'Add Owner'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default OwnerFormModal
