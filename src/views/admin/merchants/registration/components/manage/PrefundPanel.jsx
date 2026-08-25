import { useState } from 'react'
import { Alert, Button, Form } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const PrefundPanel = ({ merchant, editable, onMerchantChanged }) => {
  const { showNotification } = useNotificationContext()
  const [type, setType] = useState('credit')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})
    try {
      const result = await ApiService.adjustMerchantPrefund(merchant.id, { type, amount, description })
      showNotification({ title: 'Success', message: result?.message || 'Prefund balance updated successfully.', variant: 'success' })
      setAmount('')
      setDescription('')
      onMerchantChanged?.()
    } catch (err) {
      setErrors(err?.errors ?? {})
      showNotification({ title: 'Failed', message: err?.message || 'Failed to update prefund balance.', variant: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <p className="text-muted small">
        Current balance: <strong>{Number(merchant?.client_prefund ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
      </p>
      {!editable ? (
        <Alert variant="secondary" className="mb-0 py-2 small">You don't have permission to adjust this merchant's prefund balance.</Alert>
      ) : (
        <Form onSubmit={handleSubmit} noValidate>
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
          <Form.Group className="mb-3">
            <Form.Label>Description <span className="text-danger">*</span></Form.Label>
            <Form.Control as="textarea" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} isInvalid={!!errors.description} />
            <Form.Control.Feedback type="invalid">{errors.description?.[0]}</Form.Control.Feedback>
          </Form.Group>
          <div className="d-flex justify-content-end">
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : type === 'credit' ? 'Credit balance' : 'Debit balance'}
            </Button>
          </div>
        </Form>
      )}
    </div>
  )
}

export default PrefundPanel
