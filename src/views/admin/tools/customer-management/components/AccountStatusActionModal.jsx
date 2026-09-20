import { useEffect, useState } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'

const TITLES = { locked: 'Lock Account', restricted: 'Restrict Account', restore: 'Restore Account' }
const CONFIRM_LABELS = { locked: 'Lock Account', restricted: 'Restrict Account', restore: 'Restore Account' }
const VARIANTS = { locked: 'danger', restricted: 'warning', restore: 'success' }

/** Shared Lock/Restrict/Restore form — same 3 fields (reason, case reference, note) for all 3 actions, matching legacy's shared `#lockRestrictModal`. */
const AccountStatusActionModal = ({ show, onHide, actionType, reasons, onSubmit, onSaved }) => {
  const [reasonId, setReasonId] = useState('')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (show) {
      setReasonId('')
      setReference('')
      setNote('')
      setError('')
    }
  }, [show, actionType])

  if (!actionType) return null

  const handleSubmit = async () => {
    if (!reasonId || !reference.trim() || !note.trim()) {
      setError('Please check your details.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const reasonLabel = reasons.find((r) => String(r.id) === String(reasonId))?.reason || ''
      const result = await onSubmit({ reasonId, reasonLabel, reference: reference.trim(), note: note.trim() })
      onSaved?.(result)
      onHide()
    } catch (err) {
      setError(err?.errors ? Object.values(err.errors)[0]?.[0] : (err?.message || 'Unable to update account status.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{TITLES[actionType]}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" className="py-2 small mb-3">{error}</Alert>}
        <Form.Group className="mb-3">
          <Form.Label>Reason</Form.Label>
          <Form.Select value={reasonId} onChange={(e) => setReasonId(e.target.value)}>
            <option value="">- SELECT -</option>
            {reasons.map((r) => <option key={r.id} value={r.id}>{r.reason}</option>)}
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Case / Reference</Form.Label>
          <Form.Control value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. ticket or case number" />
        </Form.Group>
        <Form.Group>
          <Form.Label>Note</Form.Label>
          <Form.Control as="textarea" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={submitting}>Cancel</Button>
        <Button variant={VARIANTS[actionType]} onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Saving...' : CONFIRM_LABELS[actionType]}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default AccountStatusActionModal
