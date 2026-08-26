import { useEffect, useState } from 'react'
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import ConfirmActionModal from '../../components/ConfirmActionModal'

const emptyForm = {
  dba_name: '', suntag_shortcode: '', require_second_auth: false,
  sole_proprietorship: '', business_license_no: '', company_address: '', island: '', country: '',
  head_office_telephone_no1: '', business_email_address: '', business_website: '',
  primary_contact: '', p_telephone_no: '', p_email_address: '', secondary_contact: '', s_telephone_no: '', s_email_address: '',
  cert_issue_date: '', purpose: '', activities: '',
}

const statusBadge = (status) => {
  switch (status) {
    case 'A': return { text: 'APPROVED', className: 'bg-success-subtle text-success' }
    case 'P': return { text: 'PENDING', className: 'bg-warning-subtle text-warning' }
    case 'V': return { text: 'REJECTED', className: 'bg-danger-subtle text-danger' }
    default: return { text: status || 'UNKNOWN', className: 'bg-secondary-subtle text-secondary' }
  }
}

const InitialInfoPage = ({ merchantId, canEdit, onBack }) => {
  const { showNotification } = useNotificationContext()
  const [loading, setLoading] = useState(true)
  const [merchant, setMerchant] = useState(null)
  const [documents, setDocuments] = useState([])
  const [values, setValues] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [editing, setEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)

  const [proprietorships, setProprietorships] = useState([])
  const [islands, setIslands] = useState([])
  const [countries, setCountries] = useState([])

  const load = () => {
    setLoading(true)
    ApiService.getCharity(merchantId)
      .then((data) => {
        setMerchant(data.merchant)
        setDocuments(data.documents || [])
        const app = data.application || {}
        setValues({
          dba_name: data.merchant?.dba_name || '',
          suntag_shortcode: data.merchant?.suntag_shortcode || '',
          require_second_auth: Boolean(data.merchant?.require_second_auth),
          sole_proprietorship: app.sole_proprietorship || '',
          business_license_no: app.business_license_no || '',
          company_address: app.company_address || '',
          island: app.island || '',
          country: app.country || '',
          head_office_telephone_no1: app.head_office_telephone_no1 || '',
          business_email_address: app.business_email_address || '',
          business_website: app.business_website || '',
          primary_contact: app.primary_contact || '',
          p_telephone_no: app.p_telephone_no || '',
          p_email_address: app.p_email_address || '',
          secondary_contact: app.secondary_contact || '',
          s_telephone_no: app.s_telephone_no || '',
          s_email_address: app.s_email_address || '',
          cert_issue_date: app.cert_issue_date || '',
          purpose: app.purpose || '',
          activities: app.activities || '',
        })
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load charity.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    ApiService.getMerchantTypeSoleProprietorships('charity').then((data) => setProprietorships(Array.isArray(data) ? data : []))
    ApiService.getMerchantTypeIslands().then((data) => setIslands(Array.isArray(data) ? data : []))
    ApiService.getMerchantTypeCountries().then((data) => setCountries(Array.isArray(data) ? data : []))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchantId])

  const set = (name, value) => setValues((prev) => ({ ...prev, [name]: value }))

  const handleSave = async () => {
    setSubmitting(true)
    setFormError('')
    setErrors({})
    try {
      await ApiService.updateCharity(merchantId, values)
      showNotification({ title: 'Success', message: 'Charity updated successfully.', variant: 'success' })
      setEditing(false)
      load()
    } catch (err) {
      if (err?.errors) setErrors(Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])))
      setFormError(err?.message || 'Failed to update charity.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingState />

  const badge = statusBadge(merchant?.registration_status)
  const isPending = merchant?.registration_status === 'P'

  return (
    <>
      <PageBreadcrumb title="Charity Initial Info" subtitle="Charity Management" />
      <Button variant="light" size="sm" className="mb-3" onClick={onBack}>
        <Icon icon="arrow-left" className="me-1" /> Back to list
      </Button>

      <Card className="mb-3">
        <Card.Header className="d-flex align-items-center justify-content-between">
          <div>
            <h5 className="mb-1">{merchant?.dba_name || 'Charity Initial Info'}</h5>
            <p className="text-muted mb-0 small">Client ID: {merchant?.client_id}</p>
          </div>
          <span className={`badge ${badge.className} badge-label`}>{badge.text}</span>
        </Card.Header>
        <Card.Body>
          {formError && <Alert variant="danger">{formError}</Alert>}
          <Form noValidate>
            <fieldset disabled={!editing} className="border-0 p-0 m-0">
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Charity / Church Name *</Form.Label>
                    <Form.Control value={values.dba_name} onChange={(e) => set('dba_name', e.target.value)} isInvalid={!!errors.dba_name} />
                    <Form.Control.Feedback type="invalid">{errors.dba_name}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Charity or Church</Form.Label>
                    <Form.Select value={values.sole_proprietorship} onChange={(e) => set('sole_proprietorship', e.target.value)}>
                      <option value="">--SELECT--</option>
                      {proprietorships.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Short Code</Form.Label>
                    <Form.Control value={values.suntag_shortcode} onChange={(e) => set('suntag_shortcode', e.target.value)} />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Charity License No.</Form.Label>
                    <Form.Control value={values.business_license_no} onChange={(e) => set('business_license_no', e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Charity Certificate Issue Date</Form.Label>
                    <Form.Control type="date" value={values.cert_issue_date} onChange={(e) => set('cert_issue_date', e.target.value)} />
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Company Address</Form.Label>
                    <Form.Control value={values.company_address} onChange={(e) => set('company_address', e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Island</Form.Label>
                    <Form.Select value={values.island} onChange={(e) => set('island', e.target.value)}>
                      <option value="">--SELECT--</option>
                      {islands.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Country</Form.Label>
                    <Form.Select value={values.country} onChange={(e) => set('country', e.target.value)}>
                      <option value="">--SELECT--</option>
                      {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Head Office Telephone</Form.Label>
                    <Form.Control value={values.head_office_telephone_no1} onChange={(e) => set('head_office_telephone_no1', e.target.value)} />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Charity Email</Form.Label>
                    <Form.Control type="email" value={values.business_email_address} onChange={(e) => set('business_email_address', e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Charity Website</Form.Label>
                    <Form.Control value={values.business_website} onChange={(e) => set('business_website', e.target.value)} />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Primary Contact</Form.Label>
                    <Form.Control value={values.primary_contact} onChange={(e) => set('primary_contact', e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Primary Contact Phone</Form.Label>
                    <Form.Control value={values.p_telephone_no} onChange={(e) => set('p_telephone_no', e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Primary Contact Email</Form.Label>
                    <Form.Control type="email" value={values.p_email_address} onChange={(e) => set('p_email_address', e.target.value)} />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Secondary Contact</Form.Label>
                    <Form.Control value={values.secondary_contact} onChange={(e) => set('secondary_contact', e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Secondary Contact Phone</Form.Label>
                    <Form.Control value={values.s_telephone_no} onChange={(e) => set('s_telephone_no', e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Secondary Contact Email</Form.Label>
                    <Form.Control type="email" value={values.s_email_address} onChange={(e) => set('s_email_address', e.target.value)} />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Purpose</Form.Label>
                    <Form.Control as="textarea" rows={2} value={values.purpose} onChange={(e) => set('purpose', e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Activities</Form.Label>
                    <Form.Control as="textarea" rows={2} value={values.activities} onChange={(e) => set('activities', e.target.value)} />
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Check
                    type="checkbox"
                    id="require_second_auth"
                    label="Require Two-Factor Authentication"
                    checked={values.require_second_auth}
                    onChange={(e) => set('require_second_auth', e.target.checked)}
                  />
                </Col>
              </Row>
            </fieldset>
          </Form>

          <div className="mt-4">
            <h6 className="mb-2">Documents</h6>
            {documents.length ? (
              <ul className="list-unstyled mb-0">
                {documents.map((doc) => (
                  <li key={doc.id} className="mb-1">
                    <a href={doc.file_url} target="_blank" rel="noreferrer">
                      <Icon icon="file-text" className="me-1" /> {doc.file_field || doc.file_type || `Document #${doc.id}`}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted small mb-0">No documents uploaded yet.</p>
            )}
          </div>
        </Card.Body>
        <Card.Footer className="d-flex justify-content-between">
          <div className="d-flex gap-2">
            {isPending && canEdit && (
              <>
                <Button variant="outline-success" onClick={() => setConfirmAction('approve')}>Approve</Button>
                <Button variant="outline-danger" onClick={() => setConfirmAction('reject')}>Reject</Button>
              </>
            )}
          </div>
          {canEdit && (
            editing ? (
              <div className="d-flex gap-2">
                <Button variant="light" onClick={() => { setEditing(false); load() }} disabled={submitting}>Cancel</Button>
                <Button variant="primary" onClick={handleSave} disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</Button>
              </div>
            ) : (
              <Button variant="primary" onClick={() => setEditing(true)}>Edit</Button>
            )
          )}
        </Card.Footer>
      </Card>

      <ConfirmActionModal
        show={confirmAction === 'approve'}
        onHide={() => setConfirmAction(null)}
        title="Approve charity"
        message={`This will approve ${merchant?.dba_name || 'this charity'}'s registration and create its default branch. Continue?`}
        confirmLabel="Approve"
        confirmVariant="success"
        successMessage="Charity approved successfully."
        onConfirm={() => ApiService.approveCharity(merchantId)}
        onDone={onBack}
      />
      <ConfirmActionModal
        show={confirmAction === 'reject'}
        onHide={() => setConfirmAction(null)}
        title="Reject charity"
        message={`This will reject ${merchant?.dba_name || 'this charity'}'s registration. Continue?`}
        confirmLabel="Reject"
        confirmVariant="danger"
        successMessage="Charity rejected successfully."
        onConfirm={() => ApiService.rejectCharity(merchantId)}
        onDone={onBack}
      />
    </>
  )
}

export default InitialInfoPage
