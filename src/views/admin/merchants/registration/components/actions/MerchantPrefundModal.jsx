import { useState } from 'react'
import { Button, Form, Modal } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const MerchantPrefundModal = ({ show, onHide, merchant, onDone }) => {
  const { showNotification } = useNotificationContext()
  const [type, setType] = useState('credit')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const reset = () => {
    setType('credit')
    setAmount('')
    setDescription('')
    setErrors({})
  }

  const handleHide = () => {
    reset()
    onHide()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})
    try {
      const result = await ApiService.adjustMerchantPrefund(merchant.id, { type, amount, description })
      showNotification({ title: 'Success', message: result?.message || 'Prefund balance updated successfully.', variant: 'success' })
      onDone?.()
      handleHide()
    } catch (err) {
      setErrors(err?.errors ?? {})
      showNotification({ title: 'Failed', message: err?.message || 'Failed to update prefund balance.', variant: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={handleHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Merchant Prefund — {merchant?.dba_name || merchant?.legal_name}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Body>
          <p className="text-muted small">
            Current balance: <strong>{Number(merchant?.client_prefund ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
          </p>
          <Form.Group className="mb-3">
            <Form.Label>Type</Form.Label>
            <div className="d-flex gap-3">
              <Form.Check type="radio" id="prefund-credit" label="Credit (add funds)" checked={type === 'credit'} onChange={() => setType('credit')} />
              <Form.Check type="radio" id="prefund-debit" label="Debit (deduct funds)" checked={type === 'debit'} onChange={() => setType('debit')} />
            </div>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Amount <span className="text-danger">*</span></Form.Label>
            <Form.Control type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} isInvalid={!!errors.amount} />
            <Form.Control.Feedback type="invalid">{errors.amount?.[0]}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group>
            <Form.Label>Description <span className="text-danger">*</span></Form.Label>
            <Form.Control as="textarea" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} isInvalid={!!errors.description} />
            <Form.Control.Feedback type="invalid">{errors.description?.[0]}</Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleHide} disabled={submitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : type === 'credit' ? 'Credit balance' : 'Debit balance'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default MerchantPrefundModal
