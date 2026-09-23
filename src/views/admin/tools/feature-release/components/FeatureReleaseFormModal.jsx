import { useEffect, useState } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import Select from '@/components/wrappers/Select'

/** Legacy's Feature Type dropdown has always had exactly this one option — replicated as-is. */
const FEATURE_TYPES = [{ value: 'cardApplication', label: 'Card Application' }]

const EMPTY = { feature_type: 'cardApplication', scope: 'all', release_date: '', islands: [] }

const toDatetimeLocal = (value) => (value ? String(value).replace(' ', 'T').slice(0, 16) : '')

const FeatureReleaseFormModal = ({ show, onHide, islands, initial, onSubmit, onSaved }) => {
  const [form, setForm] = useState(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (show) {
      setForm(initial ? {
        feature_type: initial.feature_type,
        scope: initial.scope,
        release_date: toDatetimeLocal(initial.release_date),
        islands: initial.island_ids || [],
      } : EMPTY)
      setError('')
    }
  }, [show, initial])

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const islandOptions = islands.map((i) => ({ value: i.id, label: i.name }))

  const handleSubmit = async () => {
    if (!form.feature_type) {
      setError('Please select a feature type.')
      return
    }
    if (!form.release_date) {
      setError('Please select a release date.')
      return
    }
    if (form.scope === 'specific' && form.islands.length === 0) {
      setError('Please select at least one island.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const saved = await onSubmit(form)
      onSaved?.(saved)
      onHide()
    } catch (err) {
      setError(err?.errors ? Object.values(err.errors)[0]?.[0] : (err?.message || 'Unable to save feature release.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{initial ? 'Edit' : 'Add'} Feature</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" className="py-2 small mb-3">{error}</Alert>}
        <Form.Group className="mb-3">
          <Form.Label>Feature Type</Form.Label>
          <Form.Select value={form.feature_type} onChange={(e) => updateField('feature_type', e.target.value)}>
            {FEATURE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Scope</Form.Label>
          <Form.Select value={form.scope} onChange={(e) => updateField('scope', e.target.value)}>
            <option value="all">All Islands</option>
            <option value="specific">Specific Islands</option>
          </Form.Select>
        </Form.Group>
        {form.scope === 'specific' && (
          <Form.Group className="mb-3">
            <Form.Label>Islands</Form.Label>
            <Select
              className="react-select"
              classNamePrefix="react-select"
              isMulti
              options={islandOptions}
              value={islandOptions.filter((opt) => form.islands.includes(opt.value))}
              onChange={(selected) => updateField('islands', Array.isArray(selected) ? selected.map((opt) => opt.value) : [])}
              placeholder="Select islands..."
            />
          </Form.Group>
        )}
        <Form.Group>
          <Form.Label>Release Date</Form.Label>
          <Form.Control type="datetime-local" value={form.release_date} onChange={(e) => updateField('release_date', e.target.value)} />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={submitting}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default FeatureReleaseFormModal
