import { useEffect, useState } from 'react'
import { Alert, Button, Col, Form, Modal, Row } from 'react-bootstrap'
import GeoPromoZoneMap from '@/components/maps/GeoPromoZoneMap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const emptyForm = {
  promo_amount: '',
  promo_description: '',
  promo_country: '',
  date_from: '',
  date_to: '',
  coordinates: [],
}

const GeoPromoModal = ({ show, onHide, promo, readOnly, countries, onSaved }) => {
  const { showNotification } = useNotificationContext()
  const [values, setValues] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!show) return
    setValues(promo ? {
      promo_amount: promo.promo_amount ?? '',
      promo_description: promo.promo_description ?? '',
      promo_country: promo.promo_country ?? '',
      date_from: promo.date_from ?? '',
      date_to: promo.date_to ?? '',
      coordinates: Array.isArray(promo.coordinates) ? promo.coordinates : [],
    } : emptyForm)
    setErrors({})
    setFormError('')
  }, [show, promo])

  const set = (name, value) => setValues((prev) => ({ ...prev, [name]: value }))

  const handleSave = async () => {
    setSubmitting(true)
    setFormError('')
    setErrors({})
    try {
      if (promo) {
        await ApiService.updateGeoPromo(promo.id, values)
      } else {
        await ApiService.createGeoPromo(values)
      }
      showNotification({ title: 'Success', message: `Sign up promotion zone ${promo ? 'updated' : 'added'} successfully.`, variant: 'success' })
      onSaved?.()
      onHide()
    } catch (err) {
      if (err?.errors) setErrors(Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])))
      setFormError(err?.message || 'Failed to save sign up promotion zone.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{readOnly ? 'View' : promo ? 'Edit' : 'Add'} Sign Up Promotion Zone</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {formError && <Alert variant="danger">{formError}</Alert>}
        <fieldset disabled={readOnly} className="border-0 p-0 m-0">
          <GeoPromoZoneMap coordinates={values.coordinates} onChange={(coords) => set('coordinates', coords)} readOnly={readOnly} />
          {errors.coordinates && <div className="text-danger small mt-1">{errors.coordinates}</div>}
          <Row className="g-3 mt-1">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Bonus Amount ($) *</Form.Label>
                <Form.Control type="number" step="0.01" value={values.promo_amount} onChange={(e) => set('promo_amount', e.target.value)} isInvalid={!!errors.promo_amount} />
                <Form.Control.Feedback type="invalid">{errors.promo_amount}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Country *</Form.Label>
                <Form.Select value={values.promo_country} onChange={(e) => set('promo_country', e.target.value)} isInvalid={!!errors.promo_country}>
                  <option value="">--SELECT--</option>
                  <option value="All">All</option>
                  {countries.map((c) => <option key={c.country_id} value={c.name}>{c.name}</option>)}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.promo_country}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label>Description *</Form.Label>
                <Form.Control value={values.promo_description} onChange={(e) => set('promo_description', e.target.value)} isInvalid={!!errors.promo_description} />
                <Form.Control.Feedback type="invalid">{errors.promo_description}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Date From *</Form.Label>
                <Form.Control type="date" value={values.date_from} onChange={(e) => set('date_from', e.target.value)} isInvalid={!!errors.date_from} />
                <Form.Control.Feedback type="invalid">{errors.date_from}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Date To *</Form.Label>
                <Form.Control type="date" value={values.date_to} onChange={(e) => set('date_to', e.target.value)} isInvalid={!!errors.date_to} />
                <Form.Control.Feedback type="invalid">{errors.date_to}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
        </fieldset>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={onHide}>{readOnly ? 'Close' : 'Cancel'}</Button>
        {!readOnly && (
          <Button variant="primary" onClick={handleSave} disabled={submitting}>
            {submitting ? 'Saving...' : promo ? 'Save Changes' : 'Add Zone'}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  )
}

export default GeoPromoModal
