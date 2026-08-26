import { useEffect, useState } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import { useNotificationContext } from '@/context/useNotificationContext'

/** Generic single-numeric-field settings modal shared by Card Hold Settings / Suncash Transaction Fee / GC Fee. */
const NumericFieldModal = ({ show, onHide, title, label, suffix, min = 0, max, step = '0.01', initialValue, errorKey, submitLabel = 'Save', successMessage, onSubmit, onDone }) => {
  const { showNotification } = useNotificationContext()
  const [value, setValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (show) {
      setValue(initialValue !== undefined && initialValue !== null ? String(initialValue) : '')
      setError('')
    }
  }, [show, initialValue])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const result = await onSubmit(Number(value))
      showNotification({ title: 'Success', message: result?.message || successMessage, variant: 'success' })
      onDone?.()
      onHide()
    } catch (err) {
      setError(err?.errors?.[errorKey]?.[0] || err?.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Body>
          {error && <Alert variant="danger" className="py-2 small mb-3">{error}</Alert>}
          <Form.Group>
            <Form.Label>{label} {suffix ? `(${suffix})` : ''} *</Form.Label>
            <Form.Control type="number" step={step} min={min} max={max} value={value} onChange={(e) => setValue(e.target.value)} autoFocus required />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={submitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={submitting || value === ''}>
            {submitting ? 'Saving...' : submitLabel}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default NumericFieldModal
