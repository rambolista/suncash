import { useEffect, useState } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import { useNotificationContext } from '@/context/useNotificationContext'

/** Generic single-amount-field modal shared by every "Top Up" / "Request Replenishment" action. */
const AmountPromptModal = ({ show, onHide, title, helpText, submitLabel, successMessage, onSubmit, onDone }) => {
  const { showNotification } = useNotificationContext()
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (show) {
      setAmount('')
      setError('')
    }
  }, [show])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const result = await onSubmit(Number(amount))
      showNotification({ title: 'Success', message: result?.message || successMessage, variant: 'success' })
      onDone?.()
      onHide()
    } catch (err) {
      setError(err?.errors?.amount?.[0] || err?.message || 'Something went wrong. Please try again.')
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
          {helpText && <p className="text-muted small">{helpText}</p>}
          <Form.Group>
            <Form.Label>Amount (BSD) *</Form.Label>
            <Form.Control type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus required />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={submitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={submitting || !amount}>
            {submitting ? 'Please wait...' : submitLabel}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default AmountPromptModal
