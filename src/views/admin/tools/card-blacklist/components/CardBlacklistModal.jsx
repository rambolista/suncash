import { useEffect, useState } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import ApiService from '@/services/ApiService'

const EMPTY = { name: '', card_num: '', card_type: '', exp: '', validation_type: '' }

const VALIDATION_TYPES = [
  { value: 'except_name', label: 'Except Name' },
  { value: 'name_only', label: 'Only Name' },
  { value: 'all', label: 'All Fields' },
]

const CardBlacklistModal = ({ show, onHide, entry, onSaved }) => {
  const [form, setForm] = useState(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!show) return
    setForm(entry ? {
      name: entry.name || '',
      card_num: entry.last_4_digit_number || '',
      card_type: entry.card_type || '',
      exp: entry.expiry_date || '',
      validation_type: entry.validation_type || '',
    } : EMPTY)
    setError('')
  }, [show, entry])

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const needsName = form.validation_type === 'all' || form.validation_type === 'name_only'
  const needsCard = form.validation_type === 'all' || form.validation_type === 'except_name'

  const handleSubmit = async () => {
    if (!form.validation_type) {
      setError('Please Select Validation Type.')
      return
    }
    if (needsName && !form.name.trim()) {
      setError('Please check name.')
      return
    }
    if (needsCard && !form.card_num.trim()) {
      setError('Please check last 4 digit number.')
      return
    }
    if (needsCard && !form.card_type.trim()) {
      setError('Please check card type.')
      return
    }
    if (needsCard && !form.exp.trim()) {
      setError('Please check card type.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      if (entry) {
        await ApiService.updateCardBlacklist(entry.id, form)
      } else {
        await ApiService.createCardBlacklist(form)
      }
      onSaved?.()
      onHide()
    } catch (err) {
      setError(err?.errors ? Object.values(err.errors)[0]?.[0] : (err?.message || 'Unable to save card blacklist.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{entry ? 'Edit Blacklist' : 'Add to Blacklist'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" className="py-2 small mb-3">{error}</Alert>}
        <Form.Group className="mb-3">
          <Form.Label>Validation Type</Form.Label>
          <Form.Select value={form.validation_type} onChange={(e) => updateField('validation_type', e.target.value)}>
            <option value="">--Select--</option>
            {VALIDATION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Name on Card{needsName && ' *'}</Form.Label>
          <Form.Control value={form.name} onChange={(e) => updateField('name', e.target.value)} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Last 4 Digit Number{needsCard && ' *'}</Form.Label>
          <Form.Control value={form.card_num} onChange={(e) => updateField('card_num', e.target.value)} maxLength={4} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Card Type{needsCard && ' *'}</Form.Label>
          <Form.Control value={form.card_type} onChange={(e) => updateField('card_type', e.target.value)} />
        </Form.Group>
        <Form.Group>
          <Form.Label>Card Expiry{needsCard && ' *'}</Form.Label>
          <Form.Control placeholder="MMYY" maxLength={4} value={form.exp} onChange={(e) => updateField('exp', e.target.value)} />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={submitting}>Close</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Saving...' : entry ? 'Update' : 'Add'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default CardBlacklistModal
