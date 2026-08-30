import { useEffect, useState } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const RejectReasonModal = ({ show, onHide, customer, reasons, onDone }) => {
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
    if (!reason) {
      setError('Please select a reason.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const result = await ApiService.rejectKycUpgrade(customer.id, reason)
      showNotification({ title: 'Success', message: result?.message || 'Customer has been rejected.', variant: 'success' })
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
        <Modal.Title>Reject customer</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" className="py-2 small mb-3">{error}</Alert>}
        <p>Are you sure you want to reject <strong>{customer?.name}</strong>&apos;s KYC upgrade request? Please select a reason:</p>
        <Form.Select value={reason} onChange={(e) => setReason(e.target.value)} isInvalid={!reason && !!error}>
          <option value="">Select a reason...</option>
          {reasons.map((r) => <option key={r} value={r}>{r}</option>)}
        </Form.Select>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={submitting}>Cancel</Button>
        <Button variant="danger" onClick={handleConfirm} disabled={submitting}>
          {submitting ? 'Please wait...' : 'Reject'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default RejectReasonModal
