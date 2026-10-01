import { useEffect, useState } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import ApiService from '@/services/ApiService'

const AddBlacklistModal = ({ show, onHide, onSaved }) => {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (show) {
      setName('')
      setError('')
    }
  }, [show])

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Please check input fields.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await ApiService.addWuBlacklist(name.trim())
      onSaved?.()
      onHide()
    } catch (err) {
      setError(err?.errors ? Object.values(err.errors)[0]?.[0] : (err?.message || 'Not Successfully Blacklisted'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Add to Blacklist</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" className="py-2 small mb-3">{error}</Alert>}
        <Form.Group>
          <Form.Label>Name</Form.Label>
          <Form.Control value={name} onChange={(e) => setName(e.target.value)} />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={submitting}>Close</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Adding...' : 'Add'}</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default AddBlacklistModal
