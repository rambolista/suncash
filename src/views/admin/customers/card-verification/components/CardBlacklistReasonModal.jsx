import { useEffect, useState } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const CardBlacklistReasonModal = ({ show, onHide, card, reasons, onDone }) => {
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
      const result = await ApiService.blacklistCardVerification(card.id, reason)
      showNotification({ title: 'Success', message: result?.message || 'Card has been blacklisted.', variant: 'success' })
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
        <Modal.Title>Blacklist card</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" className="py-2 small mb-3">{error}</Alert>}
        <p>
          Are you sure you want to blacklist <strong>{card?.cardholder_name}</strong>&apos;s card? This also adds the card's
          details to the global card blacklist, screening it against future link attempts. Please select a reason:
        </p>
        <Form.Select value={reason} onChange={(e) => setReason(e.target.value)} isInvalid={!reason && !!error}>
          <option value="">--Select--</option>
          {reasons.map((r) => <option key={r} value={r}>{r}</option>)}
        </Form.Select>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={submitting}>Cancel</Button>
        <Button variant="dark" onClick={handleConfirm} disabled={submitting}>
          {submitting ? 'Please wait...' : 'Blacklist'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default CardBlacklistReasonModal
