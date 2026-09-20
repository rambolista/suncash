import { useEffect, useState } from 'react'
import { Alert, Button, Col, Form, Image, Modal, Row } from 'react-bootstrap'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

/** `scanned_id` is stored either as a full URL or as a raw base64 image blob, inconsistently across rows — render whichever it is. */
const scannedIdSrc = (value) => {
  if (!value) return null
  return /^https?:\/\//i.test(value) ? value : `data:image/jpeg;base64,${value}`
}

const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result).split(',')[1] || '')
  reader.onerror = reject
  reader.readAsDataURL(file)
})

const IdFields = ({ prefix, values, onChange, disabled, showIssueDate }) => (
  <>
    <Form.Group className="mb-2">
      <Form.Label className="small text-muted">ID Card Type</Form.Label>
      <Form.Control size="sm" disabled={disabled} value={values.type || ''} onChange={(e) => onChange('type', e.target.value)} />
    </Form.Group>
    <Form.Group className="mb-2">
      <Form.Label className="small text-muted">ID Card Number</Form.Label>
      <Form.Control size="sm" disabled={disabled} value={values.num || ''} onChange={(e) => onChange('num', e.target.value)} />
    </Form.Group>
    <Form.Group className="mb-2">
      <Form.Label className="small text-muted">Expiry</Form.Label>
      <Form.Control size="sm" disabled={disabled} value={values.expiry || ''} onChange={(e) => onChange('expiry', e.target.value)} />
    </Form.Group>
    {showIssueDate && (
      <Form.Group className="mb-2">
        <Form.Label className="small text-muted">Issue Date</Form.Label>
        <Form.Control size="sm" disabled={disabled} value={values.issueDate || ''} onChange={(e) => onChange('issueDate', e.target.value)} />
      </Form.Group>
    )}
    <Form.Group className="mb-2">
      <Form.Label className="small text-muted">Replace Photo</Form.Label>
      <Form.Control size="sm" type="file" accept="image/*" disabled={disabled} onChange={(e) => onChange('file', e.target.files?.[0] || null)} />
    </Form.Group>
  </>
)

const ScannedIdsModal = ({ show, onHide, customerId, canEdit }) => {
  const { showNotification } = useNotificationContext()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [primary, setPrimary] = useState({ type: '', num: '', expiry: '', issueDate: '', file: null })
  const [secondary, setSecondary] = useState({ type: '', num: '', expiry: '', file: null })
  const [primaryPreview, setPrimaryPreview] = useState(null)
  const [secondaryPreview, setSecondaryPreview] = useState(null)

  useEffect(() => {
    if (!show) return
    setLoading(true)
    setError('')
    ApiService.getCustomerManagementScannedIds(customerId)
      .then((result) => {
        setData(result)
        setPrimary({ type: result?.id_card_type || '', num: result?.id_card_num || '', expiry: result?.id_card_expiry || '', issueDate: result?.id_card_issue_date || '', file: null })
        setSecondary({ type: result?.secondary_id_card_type || '', num: result?.secondary_id_card_num || '', expiry: result?.secondary_id_card_expiry || '', file: null })
        setPrimaryPreview(null)
        setSecondaryPreview(null)
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Customer scanned ids not found.', variant: 'danger' }))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, customerId])

  const updatePrimary = async (key, value) => {
    if (key === 'file' && value) {
      setPrimaryPreview(URL.createObjectURL(value))
      value = await readFileAsBase64(value)
    }
    setPrimary((current) => ({ ...current, [key]: value }))
  }

  const updateSecondary = async (key, value) => {
    if (key === 'file' && value) {
      setSecondaryPreview(URL.createObjectURL(value))
      value = await readFileAsBase64(value)
    }
    setSecondary((current) => ({ ...current, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const payload = {
        id_card_type: primary.type,
        id_card_num: primary.num,
        id_card_expiry: primary.expiry,
        id_card_issue_date: primary.issueDate,
      }
      if (primary.file) payload.scanned_id = primary.file
      if (data?.has_secondary_id) {
        payload.secondary_id_card_type = secondary.type
        payload.secondary_id_card_num = secondary.num
        payload.secondary_id_card_expiry = secondary.expiry
        if (secondary.file) payload.secondary_scanned_id = secondary.file
      }
      const result = await ApiService.updateCustomerManagementScannedIds(customerId, payload)
      showNotification({ title: 'Success', message: result?.message || "Customer scanned ID's has been updated.", variant: 'success' })
      onHide()
    } catch (err) {
      setError(err?.errors ? Object.values(err.errors)[0]?.[0] : (err?.message || "Unable to update scanned ID's."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Scanned ID&apos;s</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? <LoadingState message="Loading scanned IDs..." /> : (
          <>
            {error && <Alert variant="danger" className="py-2 small mb-3">{error}</Alert>}
            <Row>
              <Col md={6}>
                <h6>Primary ID</h6>
                {(primaryPreview || scannedIdSrc(data?.scanned_id))
                  ? <Image src={primaryPreview || scannedIdSrc(data.scanned_id)} thumbnail style={{ maxWidth: 220 }} className="mb-2" />
                  : <p className="text-muted small">No scanned ID on file.</p>}
                <IdFields prefix="primary" values={primary} onChange={updatePrimary} disabled={!canEdit} showIssueDate />
              </Col>
              {data?.has_secondary_id && (
                <Col md={6}>
                  <h6>Secondary ID</h6>
                  {(secondaryPreview || scannedIdSrc(data?.secondary_scanned_id))
                    ? <Image src={secondaryPreview || scannedIdSrc(data.secondary_scanned_id)} thumbnail style={{ maxWidth: 220 }} className="mb-2" />
                    : <p className="text-muted small">No secondary scanned ID on file.</p>}
                  <IdFields prefix="secondary" values={secondary} onChange={updateSecondary} disabled={!canEdit} />
                </Col>
              )}
            </Row>
          </>
        )}
      </Modal.Body>
      {canEdit && !loading && (
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={saving}>Close</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </Modal.Footer>
      )}
    </Modal>
  )
}

export default ScannedIdsModal
