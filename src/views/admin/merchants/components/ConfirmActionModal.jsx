import { useState } from 'react'
import { Alert, Button, Modal } from 'react-bootstrap'
import { useNotificationContext } from '@/context/useNotificationContext'

/** Generic approve/reject confirmation dialog shared by Business Management and Charity Management. */
const ConfirmActionModal = ({ show, onHide, title, message, confirmLabel, confirmVariant = 'primary', successMessage, onConfirm, onDone }) => {
  const { showNotification } = useNotificationContext()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    setSubmitting(true)
    setError('')
    try {
      const result = await onConfirm()
      showNotification({ title: 'Success', message: result?.message || successMessage, variant: 'success' })
      onDone?.()
      onHide()
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.')
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
        <p className="mb-0">{message}</p>
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

export default ConfirmActionModal
