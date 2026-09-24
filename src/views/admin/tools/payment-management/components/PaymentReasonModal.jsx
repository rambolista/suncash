import { useEffect, useState } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import { useNotificationContext } from '@/context/useNotificationContext'

/** Generic reason-required confirm (Return/Reject/Cancel), same shape as `ConfirmActionModal` plus a mandatory reason field. */
const PaymentReasonModal = ({ show, onHide, title, prompt, confirmLabel, confirmVariant = 'danger', onConfirm, onDone }) => {
  const { showNotification } = useNotificationContext()
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (show) {
      setReason('')
      setError('')
    }
  }, [show])

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const result = await onConfirm(reason.trim())
      showNotification({ title: 'Success', message: result?.message || 'Payment has been updated.', variant: 'success' })
      onDone?.()
      onHide()
    } catch (err) {
      setError(err?.errors?.reason?.[0] || err?.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" className="py-2 small mb-3">{error}</Alert>}
        <p>{prompt}</p>
        <Form.Group>
          <Form.Label>Reason</Form.Label>
          <Form.Control as="textarea" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} isInvalid={!reason.trim() && !!error} />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={submitting}>Cancel</Button>
        <Button variant={confirmVariant} onClick={handleConfirm} disabled={submitting}>
          {submitting ? 'Please wait...' : confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default PaymentReasonModal
