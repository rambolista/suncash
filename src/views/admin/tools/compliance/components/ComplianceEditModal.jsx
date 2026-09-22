import { useEffect, useState } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

/** Legacy `#wEditBlockedList` — only Name and Other Info are actually editable; Status/Type/Type Description are read-only there too. */
const ComplianceEditModal = ({ show, onHide, entry, onSaved }) => {
  const { showNotification } = useNotificationContext()
  const [name, setName] = useState('')
  const [otherInfo, setOtherInfo] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (show && entry) {
      setName(entry.name || '')
      setOtherInfo(entry.other_info || '')
      setError('')
    }
  }, [show, entry])

  const handleSave = async () => {
    if (!name.trim() || !otherInfo.trim()) {
      setError('Name and Other Info are required.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await ApiService.updateComplianceEntry(entry.id, { name: name.trim(), other_info: otherInfo.trim() })
      showNotification({ title: 'Success', message: 'Blocked list entry updated successfully.', variant: 'success' })
      onSaved?.()
      onHide()
    } catch (err) {
      setError(err?.message || 'Failed to update entry.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Blocked List Edit</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" className="py-2 small mb-3">{error}</Alert>}
        <Form.Group className="mb-3">
          <Form.Label>Name</Form.Label>
          <Form.Control value={name} onChange={(e) => setName(e.target.value)} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Other Info</Form.Label>
          <Form.Control as="textarea" rows={3} maxLength={145} value={otherInfo} onChange={(e) => setOtherInfo(e.target.value)} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Type</Form.Label>
          <Form.Control value={entry?.type || ''} disabled />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={onHide} disabled={submitting}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ComplianceEditModal
