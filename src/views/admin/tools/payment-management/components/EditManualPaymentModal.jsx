import { useEffect, useState } from 'react'
import { Alert, Button, Col, Form, Modal, Row } from 'react-bootstrap'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result).split(',')[1] || '')
  reader.onerror = reject
  reader.readAsDataURL(file)
})

const EditManualPaymentModal = ({ show, payment, types, methods, clients, onHide, onDone }) => {
  const { showNotification } = useNotificationContext()
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(null)
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!show || !payment) return
    setLoading(true)
    setError('')
    setFile(null)
    setFileName('')
    ApiService.getPaymentManagementDetail(payment.id)
      .then((detail) => setForm({
        payment_type_id: String(detail.payment_type_id || ''),
        client_record_id: detail.merchant_id ? String(detail.merchant_id) : '',
        company_name: detail.company_name || '',
        payment_method_id: String(detail.payment_method_id || ''),
        amount: detail.amount ? String(detail.amount).replace(/,/g, '') : '',
        settlement_start: detail.settlement_start || '',
        settlement_end: detail.settlement_end || '',
        external_reference: detail.external_reference || '',
        prepared_by: detail.prepared_by || '',
        notes: detail.notes || '',
        supporting_doc_name: detail.supporting_doc_name,
      }))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load payment.', variant: 'danger' }))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, payment])

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const handleCompanyChange = (value) => {
    const match = clients.find((c) => c.company_name.toLowerCase() === value.toLowerCase())
    setForm((f) => ({ ...f, company_name: value, client_record_id: match ? String(match.client_record_id) : '' }))
  }

  const handleFile = async (selected) => {
    if (!selected) {
      setFile(null)
      setFileName('')
      return
    }
    setFileName(selected.name)
    setFile(await readFileAsBase64(selected))
  }

  const handleSave = async () => {
    if (form.settlement_end < form.settlement_start) {
      setError('Settlement Period End must be on or after the Start date.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = { ...form, client_record_id: form.client_record_id || null }
      if (file) {
        payload.document = file
        payload.document_name = fileName
      }
      const result = await ApiService.updatePaymentManagement(payment.id, payload)
      showNotification({ title: 'Success', message: result?.message || 'Manual payment has been updated.', variant: 'success' })
      onDone?.()
      onHide()
    } catch (err) {
      setError(err?.errors ? Object.values(err.errors)[0]?.[0] : (err?.message || 'Unable to update manual payment.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Edit Manual Payment — {payment?.transaction_id}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading || !form ? <LoadingState message="Loading payment..." /> : (
          <>
            {error && <Alert variant="danger" className="py-2 small mb-3">{error}</Alert>}
            <Row className="g-3">
              <Col md={6}>
                <Form.Label>Payment Type *</Form.Label>
                <Form.Select value={form.payment_type_id} onChange={(e) => set('payment_type_id', e.target.value)}>
                  <option value="">Select payment type</option>
                  {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Form.Select>
              </Col>
              <Col md={6}>
                <Form.Label>Company Name *</Form.Label>
                <Form.Control list="pm-edit-clients" autoComplete="off" value={form.company_name} onChange={(e) => handleCompanyChange(e.target.value)} />
                <datalist id="pm-edit-clients">
                  {clients.map((c) => <option key={c.client_record_id} value={c.company_name} />)}
                </datalist>
              </Col>
              <Col md={6}>
                <Form.Label>Payment Method *</Form.Label>
                <Form.Select value={form.payment_method_id} onChange={(e) => set('payment_method_id', e.target.value)}>
                  <option value="">Select payment method</option>
                  {methods.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </Form.Select>
              </Col>
              <Col md={6}>
                <Form.Label>Amount *</Form.Label>
                <Form.Control type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => set('amount', e.target.value)} />
              </Col>
              <Col md={6}>
                <Form.Label>Settlement Period Start *</Form.Label>
                <Form.Control type="date" value={form.settlement_start} onChange={(e) => set('settlement_start', e.target.value)} />
              </Col>
              <Col md={6}>
                <Form.Label>Settlement Period End *</Form.Label>
                <Form.Control type="date" value={form.settlement_end} onChange={(e) => set('settlement_end', e.target.value)} />
              </Col>
              <Col md={6}>
                <Form.Label>External Report / Reference No.</Form.Label>
                <Form.Control value={form.external_reference} onChange={(e) => set('external_reference', e.target.value)} />
              </Col>
              <Col md={6}>
                <Form.Label>Prepared By *</Form.Label>
                <Form.Control value={form.prepared_by} onChange={(e) => set('prepared_by', e.target.value)} />
              </Col>
              <Col md={12}>
                <Form.Label>Supporting Report</Form.Label>
                <Form.Control type="file" accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,image/*" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
                <Form.Text className="text-muted">
                  {form.supporting_doc_name ? `Current file: ${form.supporting_doc_name}. Leave blank to keep it.` : 'Upload the settlement report or other supporting document.'}
                </Form.Text>
              </Col>
              <Col md={12}>
                <Form.Label>Notes</Form.Label>
                <Form.Control as="textarea" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
              </Col>
            </Row>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={saving}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={saving || loading}>{saving ? 'Saving...' : 'Save Changes'}</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default EditManualPaymentModal
