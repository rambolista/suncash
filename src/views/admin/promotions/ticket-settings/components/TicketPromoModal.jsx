import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Col, Form, Modal, Row } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const WEEKLY = 'weekly_draw'
const dayOf = (value) => (value && !String(value).startsWith('0000') ? String(value).slice(0, 10) : '')
const toInput = (value) => (dayOf(value) ? String(value).replace(' ', 'T').slice(0, 16) : '')

// Legacy `normalizeTicketRemaining`: blank / invalid -> Total Count, and never above it.
const normalizeRemaining = (remaining, quantity) => {
  const qty = parseInt(quantity, 10) || 0
  const value = parseInt(remaining, 10)
  if (remaining === '' || remaining == null || Number.isNaN(value) || value < 0 || value > qty) return String(qty)
  return String(value)
}

const emptyForm = (options) => ({
  ticket_count: '',
  quantity: '',
  remaining_quantity: '',
  description: '',
  draw_type: options.draw_types[0]?.value ?? WEEKLY,
  draw_date: '',
  service: options.services[0]?.value ?? '',
  service_ref: options.service_refs[0]?.value ?? '',
})

const fromRow = (row, mode, options) => ({
  ...emptyForm(options),
  ticket_count: row.ticket_count ?? '',
  quantity: row.quantity ?? '',
  remaining_quantity: normalizeRemaining(row.remaining_quantity, row.quantity),
  description: row.description ?? '',
  // Copy always starts a new weekly draw (the only type the add form offers); the date must be re-picked.
  draw_type: mode === 'edit' ? row.draw_type : WEEKLY,
  draw_date: mode === 'edit' ? toInput(row.draw_date) : '',
  service: row.service ?? '',
  service_ref: row.service_ref ?? '',
})

/** mode: 'add' | 'copy' | 'edit' (edit also offers Delete). `rows` = the listed promos, for the one-promo-per-draw-day check. */
const TicketPromoModal = ({ show, onHide, mode, row, rows, options, canDelete, onSaved }) => {
  const { showNotification } = useNotificationContext()
  const [values, setValues] = useState(() => emptyForm(options))
  const [remainingTouched, setRemainingTouched] = useState(false)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirm, setConfirm] = useState(null) // { message, run }

  const editing = mode === 'edit'
  const weekly = values.draw_type === WEEKLY

  useEffect(() => {
    if (!show) return
    setValues(row ? fromRow(row, mode, options) : emptyForm(options))
    setRemainingTouched(mode === 'copy')
    setFormError('')
    setConfirm(null)
  }, [show, mode, row]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (name, value) => setValues((prev) => ({ ...prev, [name]: value }))

  const setQuantity = (value) => setValues((prev) => ({ ...prev, quantity: value, ...(remainingTouched || editing ? {} : { remaining_quantity: value }) }))

  const takenBy = useMemo(() => {
    const day = dayOf(values.draw_date)
    return day ? rows.find((r) => dayOf(r.draw_date) === day && (!editing || r.id !== row?.id)) : null
  }, [values.draw_date, rows, editing, row])

  const dateNote = takenBy
    ? `Ticket Promo ID ${takenBy.id} already uses this draw date. Please pick another date.`
    : mode === 'copy' && !values.draw_date && row
      ? `Pick a new draw date. The copied promo is set for ${dayOf(row.draw_date)}, and two ticket promos cannot share a draw date.`
      : ''

  const options_ = (list, current) => (list.some((o) => o.value === current) || !current ? list : [...list, { value: current, label: current }])

  const payload = () => {
    const instant = !weekly
    return {
      ...values,
      quantity: instant ? 1 : values.quantity,
      remaining_quantity: instant ? 1 : (values.remaining_quantity === '' ? values.quantity : values.remaining_quantity),
      draw_date: weekly ? values.draw_date : '',
    }
  }

  const invalid = () => {
    const p = payload()
    if (p.ticket_count === '' || parseInt(p.ticket_count, 10) <= 0) return 'Please check input fields. Invalid number of Tickets.'
    if (p.quantity === '' || parseInt(p.quantity, 10) <= 0) return 'Please check input fields. Invalid Total Count.'
    if (parseInt(p.remaining_quantity, 10) < 0 || Number.isNaN(parseInt(p.remaining_quantity, 10))) return 'Please check input fields. Invalid Remaining Count.'
    if (parseInt(p.remaining_quantity, 10) > parseInt(p.quantity, 10)) return 'Remaining Count cannot be higher than Total Count.'
    if (!p.description.trim()) return 'Please check input fields.'
    if (weekly && !p.draw_date) return 'Please check input fields. Invalid raffle date.'
    if (takenBy) return dateNote
    return ''
  }

  const save = async () => {
    setSubmitting(true)
    try {
      const body = payload()
      if (editing) await ApiService.updateTicketPromoSetting(row.id, body)
      else await ApiService.createTicketPromoSetting(body)
      showNotification({ title: 'Success', message: `Free Ticket Promo successfully ${editing ? 'updated' : 'added'}.`, variant: 'success' })
      onSaved()
      onHide()
    } catch (err) {
      setFormError(err?.message || 'Something went wrong.')
    } finally {
      setSubmitting(false)
      setConfirm(null)
    }
  }

  const remove = async () => {
    setSubmitting(true)
    try {
      await ApiService.deleteTicketPromoSetting(row.id)
      showNotification({ title: 'Success', message: 'Free Ticket Promo successfully deleted.', variant: 'success' })
      onSaved()
      onHide()
    } catch (err) {
      setFormError(err?.message || 'Something went wrong.')
    } finally {
      setSubmitting(false)
      setConfirm(null)
    }
  }

  const submit = () => {
    const problem = invalid()
    if (problem) return setFormError(problem)
    setFormError('')
    setConfirm({ message: `Are you sure you want to ${editing ? 'update' : 'add'} this Ticket Promo?`, run: save })
  }

  const title = { add: 'Add Ticket Promo Details', copy: 'Copy Ticket Promo Details', edit: 'Edit Ticket Promo Details' }[mode] ?? 'Add Ticket Promo Details'

  return (
    <>
      <Modal show={show && !confirm} onHide={onHide} centered size="lg">
        <Modal.Header closeButton><Modal.Title>{title}</Modal.Title></Modal.Header>
        <Modal.Body>
          {formError && <Alert variant="danger">{formError}</Alert>}
          <Row className="g-3">
            {editing && (
              <Col md={6}>
                <Form.Label>Id</Form.Label>
                <Form.Control value={row?.id ?? ''} readOnly />
              </Col>
            )}
            <Col md={6}>
              <Form.Label>Tickets *</Form.Label>
              <Form.Control type="number" min={1} placeholder="tickets per winner" value={values.ticket_count} onChange={(e) => set('ticket_count', e.target.value)} />
              <div className="form-text">Number of free raffle tickets each winner receives.</div>
            </Col>
            {weekly && (
              <>
                <Col md={6}>
                  <Form.Label>Total Count *</Form.Label>
                  <Form.Control type="number" min={1} placeholder="number of winners" value={values.quantity} onChange={(e) => setQuantity(e.target.value)} />
                  <div className="form-text">How many winners can claim this prize.</div>
                </Col>
                <Col md={6}>
                  <Form.Label>Remaining Count</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    placeholder="slots still open"
                    value={values.remaining_quantity}
                    onChange={(e) => { setRemainingTouched(true); set('remaining_quantity', e.target.value) }}
                  />
                  <div className="form-text">{editing ? 'Slots still claimable. Cannot be higher than Total Count.' : 'Slots still claimable. Follows Total Count unless you change it here.'}</div>
                </Col>
              </>
            )}
            <Col md={12}>
              <Form.Label>Description *</Form.Label>
              <Form.Control maxLength={100} value={values.description} onChange={(e) => set('description', e.target.value)} />
            </Col>
            {weekly && (
              <Col md={6}>
                <Form.Label>Draw Date *</Form.Label>
                <Form.Control type="datetime-local" value={values.draw_date} onChange={(e) => set('draw_date', e.target.value)} isInvalid={Boolean(takenBy)} />
                {dateNote && <div className={`form-text ${takenBy ? 'text-danger' : 'text-warning'}`}>{dateNote}</div>}
              </Col>
            )}
            <Col md={6}>
              <Form.Label>Service</Form.Label>
              <Form.Select value={values.service} onChange={(e) => set('service', e.target.value)}>
                {options_(options.services, values.service).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Form.Select>
            </Col>
            <Col md={6}>
              <Form.Label>Service Reference</Form.Label>
              <Form.Select value={values.service_ref} onChange={(e) => set('service_ref', e.target.value)}>
                {options_(options.service_refs, values.service_ref).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Form.Select>
            </Col>
            {editing && (
              <Col md={6}>
                <Form.Label>Promo Type</Form.Label>
                <Form.Control value={row?.promo_type ?? ''} readOnly />
              </Col>
            )}
            <Col md={6}>
              <Form.Label>Draw Type</Form.Label>
              <Form.Select value={values.draw_type} disabled={editing && !weekly} onChange={(e) => set('draw_type', e.target.value)}>
                {(editing && !weekly ? [{ value: values.draw_type, label: row?.draw_type_label }] : options.draw_types).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Form.Select>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="justify-content-between">
          <div>
            {editing && canDelete && (
              <Button variant="danger" disabled={submitting} onClick={() => setConfirm({ message: 'Are you sure you want to delete this Ticket Promo?', run: remove })}>Delete</Button>
            )}
          </div>
          <div className="d-flex gap-2">
            <Button variant="light" onClick={onHide} disabled={submitting}>Close</Button>
            <Button variant="success" onClick={submit} disabled={submitting}>{editing ? 'Update' : 'Add'}</Button>
          </div>
        </Modal.Footer>
      </Modal>

      <Modal show={show && Boolean(confirm)} onHide={() => setConfirm(null)} centered size="sm">
        <Modal.Body className="text-center py-4">{confirm?.message}</Modal.Body>
        <Modal.Footer className="justify-content-center">
          <Button variant="light" onClick={() => setConfirm(null)} disabled={submitting}>Cancel</Button>
          <Button variant="primary" onClick={() => confirm.run()} disabled={submitting}>{submitting ? 'Please wait...' : 'Yes'}</Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default TicketPromoModal
