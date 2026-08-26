import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const triggerDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

const SubAccountModal = ({ show, onHide, merchant }) => {
  const { showNotification } = useNotificationContext()
  const fileInputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [rowErrors, setRowErrors] = useState([])
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (show) {
      setFile(null)
      setError('')
      setRowErrors([])
      setResult(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [show])

  const handleDownloadTemplate = async () => {
    setDownloading(true)
    try {
      const { blob, filename } = await ApiService.downloadBusinessSubAccountTemplate()
      triggerDownload(blob, filename || 'Sub Account Sample.xlsx')
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to download the sample format.', variant: 'danger' })
    } finally {
      setDownloading(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!file) return
    setSubmitting(true)
    setError('')
    setRowErrors([])
    setResult(null)
    try {
      const response = await ApiService.importBusinessSubAccounts(merchant.id, file)
      setResult(response)
      showNotification({ title: 'Success', message: response?.message || 'Sub accounts imported successfully.', variant: 'success' })
    } catch (err) {
      if (Array.isArray(err?.errors?.rows)) {
        setRowErrors(err.errors.rows)
      } else {
        setError(err?.errors?.permission?.[0] || err?.errors?.file?.[0] || err?.message || 'Failed to import sub accounts.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Sub Account — {merchant?.dba_name || merchant?.legal_name}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Body>
          {error && <Alert variant="danger" className="py-2 small mb-3">{error}</Alert>}
          {rowErrors.length > 0 && (
            <Alert variant="danger" className="py-2 small mb-3">
              <ul className="mb-0 ps-3">
                {rowErrors.map((message, index) => <li key={index}>{message}</li>)}
              </ul>
            </Alert>
          )}
          {result && (
            <Alert variant="success" className="py-2 small mb-3">
              Imported {result.imported} sub account{result.imported === 1 ? '' : 's'}
              {result.skipped > 0 ? `, skipped ${result.skipped} already on file` : ''}.
            </Alert>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Upload an Excel File *</Form.Label>
            <Form.Control ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
          </Form.Group>

          <p className="small mb-1 text-primary fw-semibold">Excel Template Format</p>
          <p className="small text-muted">
            Please follow (Student ID Number, First Name, Last Name, Gender (Female/Male), Date of Birth (YYYY-MM-DD),
            Address, parent_1_email, parent_1_phone, parent_1_name, parent_2_email, parent_2_phone, parent_2_name,
            parent_3_email, parent_3_phone, parent_3_name, parent_4_email, parent_4_phone, parent_4_name) when uploading.
          </p>
          <Button variant="link" size="sm" className="p-0" disabled={downloading} onClick={handleDownloadTemplate}>
            {downloading ? 'Preparing...' : 'Download sample format'}
          </Button>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={submitting}>Close</Button>
          <Button variant="primary" type="submit" disabled={submitting || !file}>
            {submitting ? 'Uploading...' : 'Upload'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default SubAccountModal
