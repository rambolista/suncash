import { useEffect, useState } from 'react'
import { Alert, Button, Col, Form, Modal, Row } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const DRAW_TYPES = [
  { value: 'weekly_draw', label: 'Weekly Draw' },
  { value: 'grand_draw', label: 'Grand Draw' },
  { value: 'instant_prize', label: 'Instant Prize' },
  { value: 'wu_draw', label: 'AC Prize' },
  { value: 'ps5_draw', label: 'PS5 Prize' },
]

const emptyForm = {
  merchant_id: '',
  branch_id: '',
  item_description: '',
  quantity: '',
  draw_type: 'weekly_draw',
  draw_date: '',
  is_instant_reusable: false,
}

const PromoItemModal = ({ show, onHide, item, onSaved }) => {
  const { showNotification } = useNotificationContext()
  const [values, setValues] = useState(emptyForm)
  const [merchants, setMerchants] = useState([])
  const [branches, setBranches] = useState([])
  const [imageFile, setImageFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!show) return
    ApiService.getPromoMerchants().then((data) => setMerchants(Array.isArray(data) ? data : []))
    setValues(item ? {
      merchant_id: item.merchant_id ?? '',
      branch_id: item.branch_id ?? '',
      item_description: item.item_description ?? '',
      quantity: item.quantity ?? '',
      draw_type: item.draw_type ?? 'weekly_draw',
      draw_date: item.draw_date ?? '',
      is_instant_reusable: Boolean(item.is_instant_reusable),
    } : emptyForm)
    setImageFile(null)
    setErrors({})
    setFormError('')
  }, [show, item])

  useEffect(() => {
    if (!values.merchant_id) { setBranches([]); return }
    ApiService.getPromoBranches(values.merchant_id).then((data) => setBranches(Array.isArray(data) ? data : []))
  }, [values.merchant_id])

  const set = (name, value) => setValues((prev) => ({ ...prev, [name]: value }))

  const handleSave = async () => {
    if (!item && !imageFile) {
      setErrors({ image: 'An item image is required.' })
      return
    }

    setSubmitting(true)
    setFormError('')
    setErrors({})
    try {
      const payload = new FormData()
      Object.entries(values).forEach(([key, value]) => payload.append(key, value === true ? '1' : value === false ? '0' : value))
      if (imageFile) payload.append('image', imageFile)

      if (item) {
        await ApiService.updatePromoItem(item.id, payload)
      } else {
        await ApiService.createPromoItem(payload)
      }
      showNotification({ title: 'Success', message: `Promo item ${item ? 'updated' : 'added'} successfully.`, variant: 'success' })
      onSaved?.()
      onHide()
    } catch (err) {
      if (err?.errors) setErrors(Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])))
      setFormError(err?.message || 'Failed to save promo item.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{item ? 'Edit Promo Item' : 'Add Promo Item'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {formError && <Alert variant="danger">{formError}</Alert>}
        <Row className="g-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Merchant *</Form.Label>
              <Form.Select value={values.merchant_id} onChange={(e) => { set('merchant_id', e.target.value); set('branch_id', '') }} isInvalid={!!errors.merchant_id}>
                <option value="">--SELECT--</option>
                {merchants.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </Form.Select>
              <Form.Control.Feedback type="invalid">{errors.merchant_id}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Branch *</Form.Label>
              <Form.Select value={values.branch_id} onChange={(e) => set('branch_id', e.target.value)} isInvalid={!!errors.branch_id} disabled={!values.merchant_id}>
                <option value="">--SELECT--</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Form.Select>
              <Form.Control.Feedback type="invalid">{errors.branch_id}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={12}>
            <Form.Group>
              <Form.Label>Item Description *</Form.Label>
              <Form.Control value={values.item_description} onChange={(e) => set('item_description', e.target.value)} isInvalid={!!errors.item_description} />
              <Form.Control.Feedback type="invalid">{errors.item_description}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Quantity *</Form.Label>
              <Form.Control type="number" value={values.quantity} onChange={(e) => set('quantity', e.target.value)} isInvalid={!!errors.quantity} disabled={['weekly_draw', 'wu_draw'].includes(values.draw_type)} />
              <Form.Control.Feedback type="invalid">{errors.quantity}</Form.Control.Feedback>
              {['weekly_draw', 'wu_draw'].includes(values.draw_type) && <div className="form-text">This draw type is always a single prize.</div>}
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Draw Type *</Form.Label>
              <Form.Select
                value={values.draw_type}
                onChange={(e) => {
                  set('draw_type', e.target.value)
                  if (['weekly_draw', 'wu_draw'].includes(e.target.value)) set('quantity', 1)
                }}
                isInvalid={!!errors.draw_type}
              >
                {DRAW_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Draw Date</Form.Label>
              <Form.Control type="datetime-local" value={values.draw_date?.slice(0, 16) || ''} onChange={(e) => set('draw_date', e.target.value)} />
            </Form.Group>
          </Col>
          {values.draw_type === 'instant_prize' && (
            <Col md={6} className="d-flex align-items-end">
              <Form.Check
                type="checkbox"
                id="item_is_instant_reusable"
                label="Reusable (can be won more than once)"
                checked={values.is_instant_reusable}
                onChange={(e) => set('is_instant_reusable', e.target.checked)}
              />
            </Col>
          )}
          <Col md={12}>
            <Form.Group>
              <Form.Label>Item Image {!item && '*'}</Form.Label>
              <Form.Control type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} isInvalid={!!errors.image} />
              <Form.Control.Feedback type="invalid">{errors.image}</Form.Control.Feedback>
              {!item && <div className="form-text">An image is required when adding a new promo item.</div>}
              {item?.image_url && !imageFile && (
                <div className="mt-2">
                  <img src={item.image_url} alt="Current" style={{ width: 64, height: 64, objectFit: 'cover' }} className="rounded border" />
                </div>
              )}
            </Form.Group>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={onHide} disabled={submitting}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={submitting}>
          {submitting ? 'Saving...' : item ? 'Save Changes' : 'Add Promo Item'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default PromoItemModal
