import { useEffect, useState } from 'react'
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import ConfirmActionModal from '../../components/ConfirmActionModal'
import OwnersPanel from './OwnersPanel'

const emptyForm = {
  dba_name: '', trade_name: '', suntag_shortcode: '', risk_rating: 'low', business_size: '', require_second_auth: false,
  sole_proprietorship: '', name_of_parent_company: '', business_license_no: '', company_address: '', island: '', country: '',
  head_office_telephone_no1: '', head_office_telephone_no2: '', business_email_address: '', business_website: '',
  primary_contact: '', p_telephone_no: '', p_email_address: '', secondary_contact: '', s_telephone_no: '', s_email_address: '',
  name_of_primary_guarantor: '', name_of_secondary_guarantor: '', service_categories: [], tin: '', tin_expiry: '',
  sales_representative: '', assets_description: '', description: '', monthly_amt_of_payments: '', monthly_frequency_of_withdrawals: '',
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
  const [owners, setOwners] = useState([])
  const [values, setValues] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [editing, setEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)

  const [proprietorships, setProprietorships] = useState([])
  const [categories, setCategories] = useState([])
  const [islands, setIslands] = useState([])
  const [countries, setCountries] = useState([])

  const load = () => {
    setLoading(true)
    ApiService.getBusiness(merchantId)
      .then((data) => {
        setMerchant(data.merchant)
        setOwners(data.owners || [])
        const app = data.application || {}
        setValues({
          dba_name: data.merchant?.dba_name || '',
          trade_name: data.merchant?.trade_name || '',
          suntag_shortcode: data.merchant?.suntag_shortcode || '',
          risk_rating: data.merchant?.risk_rating || 'low',
          business_size: data.merchant?.business_size || '',
          require_second_auth: Boolean(data.merchant?.require_second_auth),
          sole_proprietorship: app.sole_proprietorship || '',
          name_of_parent_company: app.name_of_parent_company || '',
          business_license_no: app.business_license_no || '',
          company_address: app.company_address || '',
          island: app.island || '',
          country: app.country || '',
          head_office_telephone_no1: app.head_office_telephone_no1 || '',
          head_office_telephone_no2: app.head_office_telephone_no2 || '',
          business_email_address: app.business_email_address || '',
          business_website: app.business_website || '',
          primary_contact: app.primary_contact || '',
          p_telephone_no: app.p_telephone_no || '',
          p_email_address: app.p_email_address || '',
          secondary_contact: app.secondary_contact || '',
          s_telephone_no: app.s_telephone_no || '',
          s_email_address: app.s_email_address || '',
          name_of_primary_guarantor: app.name_of_primary_guarantor || '',
          name_of_secondary_guarantor: app.name_of_secondary_guarantor || '',
          service_categories: app.service_categories || [],
          tin: app.tin || '',
          tin_expiry: app.tin_expiry || '',
          sales_representative: app.sales_representative || '',
          assets_description: app.assets_description || '',
          description: app.description || '',
          monthly_amt_of_payments: app.monthly_amt_of_payments || '',
          monthly_frequency_of_withdrawals: app.monthly_frequency_of_withdrawals || '',
        })
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load business.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    ApiService.getMerchantTypeSoleProprietorships('business').then((data) => setProprietorships(Array.isArray(data) ? data : []))
    ApiService.getMerchantTypeBusinessCategories().then((data) => setCategories(Array.isArray(data) ? data : []))
    ApiService.getMerchantTypeIslands().then((data) => setIslands(Array.isArray(data) ? data : []))
    ApiService.getMerchantTypeCountries().then((data) => setCountries(Array.isArray(data) ? data : []))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchantId])

  const set = (name, value) => setValues((prev) => ({ ...prev, [name]: value }))

  const toggleCategory = (id) => {
    setValues((prev) => ({
      ...prev,
      service_categories: prev.service_categories.includes(id)
        ? prev.service_categories.filter((c) => c !== id)
        : [...prev.service_categories, id],
    }))
  }

  const handleSave = async () => {
    setSubmitting(true)
    setFormError('')
    setErrors({})
    try {
      await ApiService.updateBusiness(merchantId, values)
      showNotification({ title: 'Success', message: 'Business updated successfully.', variant: 'success' })
      setEditing(false)
      load()
    } catch (err) {
      if (err?.errors) setErrors(Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])))
      setFormError(err?.message || 'Failed to update business.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingState />

  const badge = statusBadge(merchant?.registration_status)
  const isPending = merchant?.registration_status === 'P'

  return (
    <>
      <PageBreadcrumb title="Business Initial Info" subtitle="Business Management" />
      <Button variant="light" size="sm" className="mb-3" onClick={onBack}>
        <Icon icon="arrow-left" className="me-1" /> Back to list
      </Button>

      <Card className="mb-3">
        <Card.Header className="d-flex align-items-center justify-content-between">
          <div>
            <h5 className="mb-1">{merchant?.dba_name || 'Business Initial Info'}</h5>
            <p className="text-muted mb-0 small">Client ID: {merchant?.client_id}</p>
          </div>
          <span className={`badge ${badge.className} badge-label`}>{badge.text}</span>
        </Card.Header>
        <Card.Body>
          {formError && <Alert variant="danger">{formError}</Alert>}
          <Form noValidate>
            <fieldset disabled={!editing} className="border-0 p-0 m-0">
              <Row className="g-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Business Name *</Form.Label>
                    <Form.Control value={values.dba_name} onChange={(e) => set('dba_name', e.target.value)} isInvalid={!!errors.dba_name} />
                    <Form.Control.Feedback type="invalid">{errors.dba_name}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Trade Name</Form.Label>
                    <Form.Control value={values.trade_name} onChange={(e) => set('trade_name', e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Parent Company</Form.Label>
                    <Form.Control value={values.name_of_parent_company} onChange={(e) => set('name_of_parent_company', e.target.value)} />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Business Type</Form.Label>
                    <Form.Select value={values.sole_proprietorship} onChange={(e) => set('sole_proprietorship', e.target.value)}>
                      <option value="">--SELECT--</option>
                      {proprietorships.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Business License No.</Form.Label>
                    <Form.Control value={values.business_license_no} onChange={(e) => set('business_license_no', e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Short Code</Form.Label>
                    <Form.Control value={values.suntag_shortcode} onChange={(e) => set('suntag_shortcode', e.target.value)} />
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
                    <Form.Label>Business Email</Form.Label>
                    <Form.Control type="email" value={values.business_email_address} onChange={(e) => set('business_email_address', e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Business Website</Form.Label>
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
                    <Form.Label>Primary Guarantor</Form.Label>
                    <Form.Control value={values.name_of_primary_guarantor} onChange={(e) => set('name_of_primary_guarantor', e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Secondary Guarantor</Form.Label>
                    <Form.Control value={values.name_of_secondary_guarantor} onChange={(e) => set('name_of_secondary_guarantor', e.target.value)} />
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Label className="small text-muted">Service Categories</Form.Label>
                  <div className="d-flex flex-wrap gap-2 border rounded p-2" style={{ maxHeight: 140, overflowY: 'auto' }}>
                    {categories.map((cat) => (
                      <Form.Check
                        key={cat.id}
                        type="checkbox"
                        id={`cat-${cat.id}`}
                        label={cat.name}
                        checked={values.service_categories.includes(cat.id)}
                        onChange={() => toggleCategory(cat.id)}
                      />
                    ))}
                  </div>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label>TIN</Form.Label>
                    <Form.Control value={values.tin} onChange={(e) => set('tin', e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>TIN Expiry</Form.Label>
                    <Form.Control type="date" value={values.tin_expiry} onChange={(e) => set('tin_expiry', e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Risk Rating</Form.Label>
                    <Form.Select value={values.risk_rating} onChange={(e) => set('risk_rating', e.target.value)}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Business Size</Form.Label>
                    <Form.Control value={values.business_size} onChange={(e) => set('business_size', e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Monthly Amount of Payments</Form.Label>
                    <Form.Control value={values.monthly_amt_of_payments} onChange={(e) => set('monthly_amt_of_payments', e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Monthly Frequency of Withdrawals</Form.Label>
                    <Form.Control value={values.monthly_frequency_of_withdrawals} onChange={(e) => set('monthly_frequency_of_withdrawals', e.target.value)} />
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Source of Assets Description</Form.Label>
                    <Form.Control as="textarea" rows={2} value={values.assets_description} onChange={(e) => set('assets_description', e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Description</Form.Label>
                    <Form.Control as="textarea" rows={2} value={values.description} onChange={(e) => set('description', e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Sales Representative</Form.Label>
                    <Form.Control value={values.sales_representative} onChange={(e) => set('sales_representative', e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={6} className="d-flex align-items-end">
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

          <Alert variant="secondary" className="mt-3 mb-0 py-2 small">
            <Icon icon="shield-check" className="me-1" /> Compliance screening is not configured in this environment.
          </Alert>
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

      <OwnersPanel merchantId={merchantId} owners={owners} canEdit={canEdit} onSaved={load} />

      <ConfirmActionModal
        show={confirmAction === 'approve'}
        onHide={() => setConfirmAction(null)}
        title="Approve business"
        message={`This will approve ${merchant?.dba_name || 'this business'}'s registration and create its default branch. Continue?`}
        confirmLabel="Approve"
        confirmVariant="success"
        successMessage="Business approved successfully."
        onConfirm={() => ApiService.approveBusiness(merchantId)}
        onDone={onBack}
      />
      <ConfirmActionModal
        show={confirmAction === 'reject'}
        onHide={() => setConfirmAction(null)}
        title="Reject business"
        message={`This will reject ${merchant?.dba_name || 'this business'}'s registration. Continue?`}
        confirmLabel="Reject"
        confirmVariant="danger"
        successMessage="Business rejected successfully."
        onConfirm={() => ApiService.rejectBusiness(merchantId)}
        onDone={onBack}
      />
    </>
  )
}

export default InitialInfoPage
