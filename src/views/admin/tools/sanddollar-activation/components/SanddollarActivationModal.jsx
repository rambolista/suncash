import { useEffect, useState } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import ApiService from '@/services/ApiService'

const EMPTY = { merchant_id: '', activation_code: '', custom_name: '' }

const SanddollarActivationModal = ({ show, onHide, merchants, onSaved }) => {
  const [form, setForm] = useState(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (show) {
      setForm(EMPTY)
      setError('')
    }
  }, [show])

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const handleSubmit = async () => {
    if (!form.merchant_id) {
      setError('Merchant cannot be empty.')
      return
    }
    if (!form.activation_code.trim()) {
      setError('Activation code cannot be empty.')
      return
    }
    if (!form.custom_name.trim()) {
      setError('Custom name cannot be empty.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await ApiService.activateSanddollarAccount({
        ...form,
        activation_code: form.activation_code.trim(),
        custom_name: form.custom_name.trim(),
      })
      onSaved?.()
      onHide()
    } catch (err) {
      setError(err?.errors ? Object.values(err.errors)[0]?.[0] : (err?.message || 'Unable to activate sanddollar account.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Add Sanddollar Account</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" className="py-2 small mb-3">{error}</Alert>}
        <Form.Group className="mb-3">
          <Form.Label>Merchant</Form.Label>
          <Form.Select value={form.merchant_id} onChange={(e) => updateField('merchant_id', e.target.value)}>
            <option value="">List of Merchant</option>
            {merchants.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Activation Code</Form.Label>
          <Form.Control value={form.activation_code} onChange={(e) => updateField('activation_code', e.target.value)} />
        </Form.Group>
        <Form.Group>
          <Form.Label>Custom Name</Form.Label>
          <Form.Control value={form.custom_name} onChange={(e) => updateField('custom_name', e.target.value)} />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={submitting}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Activating...' : 'Activate Device'}</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default SanddollarActivationModal
