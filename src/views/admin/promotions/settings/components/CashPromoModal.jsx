import { useEffect, useState } from 'react'
import { Alert, Button, Col, Form, Modal, Row } from 'react-bootstrap'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const DRAW_TYPES = [
  { value: 'weekly_draw', label: 'Weekly Draw' },
  { value: 'instant_prize', label: 'Instant Prize' },
]

const TARGET_TYPES = [
  { value: 'all', label: 'All Islands' },
  { value: 'island', label: 'Single Island' },
  { value: 'multiple', label: 'Multiple Islands' },
  { value: 'percentage', label: 'Percentage Split' },
]

const emptyForm = {
  price: '',
  quantity: '',
  description: '',
  draw_type: 'weekly_draw',
  draw_date: '',
  is_instant_reusable: false,
  target_group_type: 'all',
  target_group_islands: [],
  target_group_allocations: [],
}

const CashPromoModal = ({ show, onHide, setting, islands, onSaved }) => {
  const { showNotification } = useNotificationContext()
  const [values, setValues] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!show) return
    if (setting) {
      const islandIds = setting.target_group_type === 'island' || setting.target_group_type === 'multiple'
        ? String(setting.target_group || '').split(',').filter(Boolean).map(Number)
        : []
      const allocations = setting.target_group_type === 'percentage'
        ? String(setting.target_group || '').split(',').filter(Boolean).map((pair) => {
          const [islandId, percentage] = pair.split('-')
          return { island_id: Number(islandId), percentage: Number(percentage) }
        })
        : []
      setValues({
        price: setting.price ?? '',
        quantity: setting.quantity ?? '',
        description: setting.description ?? '',
        draw_type: setting.draw_type ?? 'weekly_draw',
        draw_date: setting.draw_date ?? '',
        is_instant_reusable: Boolean(setting.is_instant_reusable),
        target_group_type: setting.target_group_type || 'all',
        target_group_islands: islandIds,
        target_group_allocations: allocations,
      })
    } else {
      setValues(emptyForm)
    }
    setErrors({})
    setFormError('')
  }, [show, setting])

  const set = (name, value) => setValues((prev) => ({ ...prev, [name]: value }))

  const toggleIsland = (islandId) => {
    setValues((prev) => ({
      ...prev,
      target_group_islands: prev.target_group_islands.includes(islandId)
        ? prev.target_group_islands.filter((id) => id !== islandId)
        : [...prev.target_group_islands, islandId],
    }))
  }

  const addAllocation = () => {
    const availableIsland = islands.find((island) => !values.target_group_allocations.some((row) => row.island_id === island.id))
    if (!availableIsland) return
    setValues((prev) => ({
      ...prev,
      target_group_allocations: [...prev.target_group_allocations, { island_id: availableIsland.id, percentage: 0 }],
    }))
  }

  const updateAllocation = (index, field, value) => {
    setValues((prev) => ({
      ...prev,
      target_group_allocations: prev.target_group_allocations.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    }))
  }

  const removeAllocation = (index) => {
    setValues((prev) => ({ ...prev, target_group_allocations: prev.target_group_allocations.filter((_, i) => i !== index) }))
  }

  const totalPercentage = values.target_group_allocations.reduce((sum, row) => sum + Number(row.percentage || 0), 0)

  const handleSave = async () => {
    setSubmitting(true)
    setFormError('')
    setErrors({})
    try {
      if (setting) {
        await ApiService.updateCashPromoSetting(setting.id, values)
      } else {
        await ApiService.createCashPromoSetting(values)
      }
      showNotification({ title: 'Success', message: `Cash promo ${setting ? 'updated' : 'added'} successfully.`, variant: 'success' })
      onSaved?.()
      onHide()
    } catch (err) {
      if (err?.errors) setErrors(Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])))
      setFormError(err?.message || 'Failed to save cash promo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{setting ? 'Edit Cash Promo' : 'Add Cash Promo'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {formError && <Alert variant="danger">{formError}</Alert>}
        <Row className="g-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Prize Amount ($) *</Form.Label>
              <Form.Control type="number" step="0.01" value={values.price} onChange={(e) => set('price', e.target.value)} isInvalid={!!errors.price} />
              <Form.Control.Feedback type="invalid">{errors.price}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Quantity *</Form.Label>
              <Form.Control type="number" value={values.quantity} onChange={(e) => set('quantity', e.target.value)} isInvalid={!!errors.quantity} disabled={!!setting} />
              <Form.Control.Feedback type="invalid">{errors.quantity}</Form.Control.Feedback>
              {setting && <div className="form-text">Quantity can&apos;t be changed after creation (remaining: {setting.remaining_quantity}).</div>}
            </Form.Group>
          </Col>
          <Col md={12}>
            <Form.Group>
              <Form.Label>Description *</Form.Label>
              <Form.Control value={values.description} onChange={(e) => set('description', e.target.value)} isInvalid={!!errors.description} />
              <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Draw Type *</Form.Label>
              <Form.Select value={values.draw_type} onChange={(e) => set('draw_type', e.target.value)} isInvalid={!!errors.draw_type}>
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
            <Col md={12}>
              <Form.Check
                type="checkbox"
                id="is_instant_reusable"
                label="Reusable (can be won more than once)"
                checked={values.is_instant_reusable}
                onChange={(e) => set('is_instant_reusable', e.target.checked)}
              />
            </Col>
          )}
          <Col md={12}>
            <Form.Group>
              <Form.Label>Target Group</Form.Label>
              <Form.Select value={values.target_group_type} onChange={(e) => set('target_group_type', e.target.value)}>
                {TARGET_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Form.Select>
            </Form.Group>
          </Col>

          {(values.target_group_type === 'island' || values.target_group_type === 'multiple') && (
            <Col md={12}>
              <Form.Label className="small text-muted">Select island(s)</Form.Label>
              <div className="d-flex flex-wrap gap-2">
                {islands.map((island) => (
                  <Form.Check
                    key={island.id}
                    type={values.target_group_type === 'island' ? 'radio' : 'checkbox'}
                    id={`island-${island.id}`}
                    name="target_island"
                    label={island.name}
                    checked={values.target_group_islands.includes(island.id)}
                    onChange={() => (values.target_group_type === 'island'
                      ? set('target_group_islands', [island.id])
                      : toggleIsland(island.id))}
                  />
                ))}
              </div>
              {errors.target_group && <div className="text-danger small mt-1">{errors.target_group}</div>}
            </Col>
          )}

          {values.target_group_type === 'percentage' && (
            <Col md={12}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Form.Label className="small text-muted mb-0">Island allocations</Form.Label>
                <Button size="sm" variant="light" onClick={addAllocation} disabled={values.target_group_allocations.length >= islands.length}>
                  <Icon icon="plus" className="me-1" /> Add island
                </Button>
              </div>
              {values.target_group_allocations.map((row, index) => (
                <Row key={index} className="g-2 mb-2 align-items-center">
                  <Col xs={6}>
                    <Form.Select value={row.island_id} onChange={(e) => updateAllocation(index, 'island_id', Number(e.target.value))}>
                      {islands.map((island) => <option key={island.id} value={island.id}>{island.name}</option>)}
                    </Form.Select>
                  </Col>
                  <Col xs={4}>
                    <div className="input-group">
                      <Form.Control type="number" value={row.percentage} onChange={(e) => updateAllocation(index, 'percentage', Number(e.target.value))} />
                      <span className="input-group-text">%</span>
                    </div>
                  </Col>
                  <Col xs={2}>
                    <Button variant="light" size="sm" className="btn-icon rounded-circle" onClick={() => removeAllocation(index)}>
                      <Icon icon="trash" className="text-danger" />
                    </Button>
                  </Col>
                </Row>
              ))}
              <div className={`small ${totalPercentage > 100 ? 'text-danger' : 'text-muted'}`}>Total: {totalPercentage}%</div>
              {errors.target_group && <div className="text-danger small mt-1">{errors.target_group}</div>}
            </Col>
          )}
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={onHide} disabled={submitting}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={submitting}>
          {submitting ? 'Saving...' : setting ? 'Save Changes' : 'Add Cash Promo'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default CashPromoModal
