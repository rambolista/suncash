import { useEffect, useState } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'

const EMPTY = { business_billpay_banks_id: '', account_name: '', account_no: '' }

const BankAccountFormModal = ({ show, onHide, banks, initial, onSubmit, onSaved }) => {
  const [form, setForm] = useState(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (show) {
      setForm(initial ? {
        business_billpay_banks_id: String(initial.business_billpay_banks_id),
        account_name: initial.account_name || '',
        account_no: initial.account_no || '',
      } : EMPTY)
      setError('')
    }
  }, [show, initial])

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const handleSubmit = async () => {
    if (!form.business_billpay_banks_id) {
      setError('Please select a bank.')
      return
    }
    if (!form.account_name.trim()) {
      setError('Please enter the bank account name.')
      return
    }
    if (!form.account_no.trim()) {
      setError('Please enter the bank account number.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const saved = await onSubmit({ ...form, account_name: form.account_name.trim(), account_no: form.account_no.trim() })
      onSaved?.(saved)
      onHide()
    } catch (err) {
      setError(err?.errors ? Object.values(err.errors)[0]?.[0] : (err?.message || 'Unable to save bank account.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{initial ? 'Edit' : 'Add'} Bank Account</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" className="py-2 small mb-3">{error}</Alert>}
        <Form.Group className="mb-3">
          <Form.Label>Bank and Branch</Form.Label>
          <Form.Select value={form.business_billpay_banks_id} onChange={(e) => updateField('business_billpay_banks_id', e.target.value)}>
            <option value="">- SELECT -</option>
            {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Bank Account Name</Form.Label>
          <Form.Control value={form.account_name} onChange={(e) => updateField('account_name', e.target.value)} />
        </Form.Group>
        <Form.Group>
          <Form.Label>Bank Account Number</Form.Label>
          <Form.Control value={form.account_no} onChange={(e) => updateField('account_no', e.target.value)} />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={submitting}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default BankAccountFormModal
