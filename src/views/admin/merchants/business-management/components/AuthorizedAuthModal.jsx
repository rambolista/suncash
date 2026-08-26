import { useEffect, useState } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const AuthorizedAuthModal = ({ show, onHide, merchant, onDone }) => {
  const { showNotification } = useNotificationContext()
  const [limit, setLimit] = useState('')
  const [holdDays, setHoldDays] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (show) {
      setLimit(merchant?.reauth_amount_limit !== undefined && merchant?.reauth_amount_limit !== null ? String(merchant.reauth_amount_limit) : '')
      setHoldDays(merchant?.reauth_card_hold_days !== undefined && merchant?.reauth_card_hold_days !== null ? String(merchant.reauth_card_hold_days) : '')
      setError('')
    }
  }, [show, merchant])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const result = await ApiService.updateBusinessAuthorizedAuth(merchant.id, Number(limit), Number(holdDays))
      showNotification({ title: 'Success', message: result?.message || 'Authorized auth settings updated successfully.', variant: 'success' })
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
        <Modal.Title>Authorized Auth</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Body>
          {error && <Alert variant="danger" className="py-2 small mb-3">{error}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>Reauthorization Amount Limit *</Form.Label>
            <Form.Control type="number" step="0.01" min="0" value={limit} onChange={(e) => setLimit(e.target.value)} autoFocus required />
          </Form.Group>
          <Form.Group>
            <Form.Label>Reauthorization Card Hold Days *</Form.Label>
            <Form.Control type="number" step="1" min="0" value={holdDays} onChange={(e) => setHoldDays(e.target.value)} required />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={submitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={submitting || limit === '' || holdDays === ''}>
            {submitting ? 'Saving...' : 'Save'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default AuthorizedAuthModal
