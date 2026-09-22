import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

/**
 * Legacy's "Import from Excel" wipes the entire blocked_list table before
 * inserting the uploaded rows — not replicated (see ComplianceService PHP
 * doc). This only adds rows; anything already on the list, including PEP
 * flags set via Customer Management, is left alone.
 */
const ComplianceImportModal = ({ show, onHide, onImported }) => {
  const { showNotification } = useNotificationContext()
  const fileInputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (show) {
      setFile(null)
      setError('')
      setResult(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [show])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!file) return
    setSubmitting(true)
    setError('')
    setResult(null)
    try {
      const response = await ApiService.importComplianceList(file)
      setResult(response)
      showNotification({ title: 'Success', message: response?.message || 'Successfully uploaded.', variant: 'success' })
      onImported?.()
    } catch (err) {
      setError(err?.errors?.file?.[0] || err?.message || 'Failed to import blocked list.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Import from Excel</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Body>
          {error && <Alert variant="danger" className="py-2 small mb-3">{error}</Alert>}
          {result && (
            <Alert variant="success" className="py-2 small mb-3">
              Imported {result.imported} entr{result.imported === 1 ? 'y' : 'ies'}
              {result.skipped > 0 ? `, skipped ${result.skipped} invalid row${result.skipped === 1 ? '' : 's'}` : ''}.
            </Alert>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Upload an Excel File *</Form.Label>
            <Form.Control ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
          </Form.Group>

          <p className="small mb-1 text-primary fw-semibold">Excel Template Format</p>
          <p className="small text-muted mb-0">Columns: Name, Other Info, Type (PEP, WATCH, or COUNTRY).</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onHide} disabled={submitting}>Close</Button>
          <Button variant="primary" type="submit" disabled={submitting || !file}>{submitting ? 'Uploading...' : 'Upload'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default ComplianceImportModal
