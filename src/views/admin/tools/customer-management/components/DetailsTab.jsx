import { useEffect, useState } from 'react'
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import { formatDateTime } from '@/utils/reportHelpers'
import ArchiveTransactionsTable from '../../../customers/archive/components/ArchiveTransactionsTable'

const ReadOnlyField = ({ label, value }) => (
  <Form.Group as={Row} className="mb-2">
    <Form.Label column sm={5} className="text-muted small">{label}</Form.Label>
    <Col sm={7}><Form.Control size="sm" value={value ?? '—'} disabled readOnly /></Col>
  </Form.Group>
)

const today = () => new Date().toISOString().slice(0, 10)

const DetailsTab = ({ customerId, detail, canEdit, onSaved }) => {
  const { showNotification } = useNotificationContext()
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [notes, setNotes] = useState([])
  const [noteTitle, setNoteTitle] = useState('')
  const [noteBody, setNoteBody] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  const [transactions, setTransactions] = useState([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState(today())
  const [filtering, setFiltering] = useState(false)
  const [exporting, setExporting] = useState('')

  useEffect(() => {
    if (!detail) return
    setForm({
      first_name: detail.first_name || '',
      middle_name: detail.middle_name || '',
      last_name: detail.last_name || '',
      email: detail.email || '',
      gender: detail.gender || '',
      country: detail.country || '',
      birthday: detail.birthday ? detail.birthday.slice(0, 10) : '',
      address1: detail.address1 || '',
      address2: detail.address2 || '',
      zip: detail.zip || '',
      customer_tag: detail.customer_tag || '',
      risk_rating: detail.risk_rating || '',
      sms_notification: Boolean(detail.sms_notification),
      email_notification: Boolean(detail.email_notification),
      is_locked: Boolean(detail.is_locked),
      is_card_beta_user: Boolean(detail.is_card_beta_user),
      is_pep: Boolean(detail.is_pep),
    })
    setNotes(Array.isArray(detail.notes) ? detail.notes : [])
    setTransactions(Array.isArray(detail.transactions) ? detail.transactions : [])
  }, [detail])

  if (!form) return null

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const handleSave = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      await ApiService.updateCustomerManagement(customerId, form)
      showNotification({ title: 'Success', message: 'Customer profile has been updated.', variant: 'success' })
      onSaved?.()
    } catch (err) {
      setError(err?.errors ? Object.values(err.errors)[0]?.[0] : (err?.message || 'Unable to save changes.'))
    } finally {
      setSaving(false)
    }
  }

  const handleAddNote = async () => {
    if (!noteTitle.trim() || !noteBody.trim()) {
      showNotification({ title: 'Failed', message: 'Please fill in both the title and the note.', variant: 'danger' })
      return
    }
    setAddingNote(true)
    try {
      await ApiService.addCustomerManagementNote(customerId, { title: noteTitle.trim(), note: noteBody.trim() })
      const data = await ApiService.getCustomerManagementDetail(customerId)
      setNotes(Array.isArray(data?.notes) ? data.notes : [])
      setNoteTitle('')
      setNoteBody('')
      showNotification({ title: 'Success', message: 'Note has been added.', variant: 'success' })
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to add note.', variant: 'danger' })
    } finally {
      setAddingNote(false)
    }
  }

  const applyFilter = () => {
    if (!from || !to) {
      showNotification({ title: 'Failed', message: 'Please fill in both dates.', variant: 'danger' })
      return
    }
    setFiltering(true)
    ApiService.getCustomerManagementTransactions(customerId, from, to)
      .then((data) => setTransactions(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to filter transactions.', variant: 'danger' }))
      .finally(() => setFiltering(false))
  }

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const { blob, filename } = await ApiService.exportCustomerManagementTransactions(customerId, format, from || undefined, to || undefined)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || `Failed to export ${format.toUpperCase()}.`, variant: 'danger' })
    } finally {
      setExporting('')
    }
  }

  return (
    <>
      <Card className="mb-3">
        <Card.Header><h5 className="mb-0">Profile</h5></Card.Header>
        <Card.Body>
          {error && <Alert variant="danger" className="py-2 small mb-3">{error}</Alert>}
          <fieldset disabled={!canEdit}>
            <Form onSubmit={handleSave}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-2"><Form.Label className="small text-muted">First Name</Form.Label><Form.Control size="sm" value={form.first_name} onChange={(e) => updateField('first_name', e.target.value)} /></Form.Group>
                  <Form.Group className="mb-2"><Form.Label className="small text-muted">Middle Name</Form.Label><Form.Control size="sm" value={form.middle_name} onChange={(e) => updateField('middle_name', e.target.value)} /></Form.Group>
                  <Form.Group className="mb-2"><Form.Label className="small text-muted">Last Name</Form.Label><Form.Control size="sm" value={form.last_name} onChange={(e) => updateField('last_name', e.target.value)} /></Form.Group>
                  <ReadOnlyField label="Mobile Number" value={detail?.mobile} />
                  <Form.Group className="mb-2"><Form.Label className="small text-muted">Email</Form.Label><Form.Control size="sm" type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} /></Form.Group>
                  <Form.Group className="mb-2"><Form.Label className="small text-muted">Gender</Form.Label>
                    <Form.Select size="sm" value={form.gender} onChange={(e) => updateField('gender', e.target.value)}>
                      <option value="">—</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-2"><Form.Label className="small text-muted">Birthday</Form.Label><Form.Control size="sm" type="date" value={form.birthday} onChange={(e) => updateField('birthday', e.target.value)} /></Form.Group>
                  <Form.Group className="mb-2"><Form.Label className="small text-muted">Country</Form.Label><Form.Control size="sm" value={form.country} onChange={(e) => updateField('country', e.target.value)} /></Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-2"><Form.Label className="small text-muted">Address 1</Form.Label><Form.Control size="sm" value={form.address1} onChange={(e) => updateField('address1', e.target.value)} /></Form.Group>
                  <Form.Group className="mb-2"><Form.Label className="small text-muted">Address 2</Form.Label><Form.Control size="sm" value={form.address2} onChange={(e) => updateField('address2', e.target.value)} /></Form.Group>
                  <Form.Group className="mb-2"><Form.Label className="small text-muted">Zip</Form.Label><Form.Control size="sm" value={form.zip} onChange={(e) => updateField('zip', e.target.value)} /></Form.Group>
                  <ReadOnlyField label="Island" value={detail?.island_name} />
                  <ReadOnlyField label="City" value={detail?.city_name} />
                  <Form.Group className="mb-2"><Form.Label className="small text-muted">Shortcode</Form.Label><Form.Control size="sm" value={form.customer_tag} onChange={(e) => updateField('customer_tag', e.target.value)} /></Form.Group>
                  <Form.Group className="mb-2"><Form.Label className="small text-muted">Risk Rating</Form.Label>
                    <Form.Select size="sm" value={form.risk_rating} onChange={(e) => updateField('risk_rating', e.target.value)}>
                      <option value="">—</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </Form.Select>
                  </Form.Group>
                  <ReadOnlyField label="Occupation" value={detail?.occupation_name} />
                  <ReadOnlyField label="Position Level" value={detail?.employment_position_level_name} />
                </Col>
              </Row>

              <Row className="mt-2">
                <Col md={6}>
                  <ReadOnlyField label="Bank Topup Account" value={detail?.suncash_bank_account} />
                  <ReadOnlyField label="KYC Status" value={detail?.kyc_status} />
                </Col>
                <Col md={6}>
                  <ReadOnlyField label="Date Account Created" value={formatDateTime(detail?.created_date)} />
                  <ReadOnlyField label="Status" value={detail?.status} />
                </Col>
              </Row>

              <Row className="mt-2 g-3">
                <Col md={3}><Form.Check type="switch" label="SMS Notification" checked={form.sms_notification} onChange={(e) => updateField('sms_notification', e.target.checked)} /></Col>
                <Col md={3}><Form.Check type="switch" label="Email Notification" checked={form.email_notification} onChange={(e) => updateField('email_notification', e.target.checked)} /></Col>
                <Col md={3}><Form.Check type="switch" label="Lock Profile" checked={form.is_locked} onChange={(e) => updateField('is_locked', e.target.checked)} /></Col>
                <Col md={3}><Form.Check type="switch" label="Card Beta User" checked={form.is_card_beta_user} onChange={(e) => updateField('is_card_beta_user', e.target.checked)} /></Col>
              </Row>

              <Row className="mt-2">
                <Col md={6}>
                  <Form.Label className="small text-muted d-block">Politically Exposed Person (PEP)</Form.Label>
                  <Form.Check inline type="radio" name="is_pep" label="Yes" checked={form.is_pep} onChange={() => updateField('is_pep', true)} />
                  <Form.Check inline type="radio" name="is_pep" label="No" checked={!form.is_pep} onChange={() => updateField('is_pep', false)} />
                </Col>
              </Row>

              {canEdit && (
                <Button type="submit" variant="primary" className="mt-3" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </Form>
          </fieldset>
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Header><h5 className="mb-0">Notes</h5></Card.Header>
        <Card.Body>
          {notes.length === 0 && <p className="text-muted small mb-3">No notes yet.</p>}
          {notes.map((n) => (
            <div key={n.id} className="border rounded p-2 mb-2">
              <div className="fw-semibold small">{n.title}</div>
              <div className="small">{n.note}</div>
              <div className="text-muted fs-xxs">{formatDateTime(n.create_date)}</div>
            </div>
          ))}
          {canEdit && (
            <Row className="g-2 mt-2">
              <Col md={3}><Form.Control size="sm" placeholder="Title" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} /></Col>
              <Col md={6}><Form.Control size="sm" placeholder="Note" value={noteBody} onChange={(e) => setNoteBody(e.target.value)} /></Col>
              <Col md="auto">
                <Button size="sm" variant="secondary" disabled={addingNote} onClick={handleAddNote}>
                  <Icon icon="plus" className="me-1" /> {addingNote ? 'Adding...' : 'Add Note'}
                </Button>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>

      <Card>
        <Card.Header><h5 className="mb-0">Transaction History</h5></Card.Header>
        <Card.Body>
          <Row className="g-2 align-items-end mb-3">
            <Col md={3}>
              <Form.Label className="small text-muted mb-1">Start Date</Form.Label>
              <Form.Control size="sm" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Col>
            <Col md={3}>
              <Form.Label className="small text-muted mb-1">End Date</Form.Label>
              <Form.Control size="sm" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </Col>
            <Col md="auto">
              <Button size="sm" variant="primary" disabled={filtering} onClick={applyFilter}>
                <Icon icon="filter" className="me-1" /> {filtering ? 'Filtering...' : 'Apply Filters'}
              </Button>
            </Col>
            <Col md="auto" className="ms-auto d-flex gap-2">
              <Button size="sm" variant="outline-secondary" disabled={exporting !== ''} onClick={() => handleExport('pdf')}>
                <Icon icon="file-type-pdf" className="me-1" /> {exporting === 'pdf' ? 'Exporting...' : 'Export to PDF'}
              </Button>
              <Button size="sm" variant="outline-success" disabled={exporting !== ''} onClick={() => handleExport('csv')}>
                <Icon icon="file-type-xls" className="me-1" /> {exporting === 'csv' ? 'Exporting...' : 'Export to Excel'}
              </Button>
            </Col>
          </Row>
          <ArchiveTransactionsTable data={transactions} />
        </Card.Body>
      </Card>
    </>
  )
}

export default DetailsTab
