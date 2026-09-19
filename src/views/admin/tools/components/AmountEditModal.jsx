import { useEffect, useState } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'

/** Shared "edit the amount" modal for Tools > Transaction Fees / Transaction Limits — both are fixed lookup rows where only the numeric amount is ever editable. */
const AmountEditModal = ({ show, onHide, row, title, amountLabel, onSubmit, onSaved }) => {
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (show && row) {
      setAmount(String(row.amount ?? ''))
      setError('')
    }
  }, [show, row])

  const handleSubmit = async () => {
    if (amount === '' || Number.isNaN(Number(amount)) || Number(amount) < 0) {
      setError('Amount should be a valid non-negative number.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const updated = await onSubmit(row.id, Number(amount))
      onSaved?.(updated)
      onHide()
    } catch (err) {
      setError(err?.errors ? Object.values(err.errors)[0]?.[0] : (err?.message || 'Something went wrong. Please try again.'))
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
        <Form.Group>
          <Form.Label>{row?.label}</Form.Label>
          <Form.Control type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
          <Form.Text muted>{amountLabel}</Form.Text>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={submitting}>Close</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default AmountEditModal
