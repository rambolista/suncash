import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'

const emptyForm = { minimum_account: '', maximum_account: '', email_address: '', amount: '' }

const statusBadge = (status) => {
  switch (status) {
    case 'APPROVED': return { text: 'APPROVED', className: 'bg-success-subtle text-success' }
    case 'PENDING': return { text: 'WAITING FOR APPROVAL', className: 'bg-warning-subtle text-warning' }
    case 'REJECTED': return { text: 'REJECTED', className: 'bg-danger-subtle text-danger' }
    default: return { text: 'NOT SET UP', className: 'bg-secondary-subtle text-secondary' }
  }
}

const SetMainReserveAccountPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = useMemo(() => getModulePermission(currentUser, '/float-management/set-main-reserve-account'), [currentUser])

  const [account, setAccount] = useState(null)
  const [values, setValues] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const canAdd = Boolean(modulePermission.can_add)
  const canEdit = Boolean(modulePermission.can_edit)

  const load = () => {
    setLoading(true)
    ApiService.getMainReserveAccountSettings()
      .then((data) => {
        setAccount(data)
        setValues({
          minimum_account: data?.minimum_account ?? '',
          maximum_account: data?.maximum_account ?? '',
          email_address: data?.email_address ?? '',
          amount: data?.repl_amount ?? '',
        })
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load main reserve account.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const set = (name, value) => setValues((prev) => ({ ...prev, [name]: value }))

  const isApproved = account?.status === 'APPROVED'
  const isPending = account?.status === 'PENDING'
  const canSubmitNew = !account || account.status === 'REJECTED'

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setFormError('')
    setErrors({})
    try {
      if (isApproved) {
        await ApiService.updateMainReserveAccountSettings(values)
        showNotification({ title: 'Success', message: 'Main reserve account updated successfully.', variant: 'success' })
      } else {
        await ApiService.setupMainReserveAccount(values)
        showNotification({ title: 'Success', message: 'Main reserve account requested successfully.', variant: 'success' })
      }
      load()
    } catch (err) {
      if (err?.errors) setErrors(Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])))
      setFormError(err?.message || 'Failed to save main reserve account.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingState />

  const badge = statusBadge(account?.status)
  const canEditForm = (isApproved && canEdit) || (canSubmitNew && canAdd)

  return (
    <>
      <PageBreadcrumb title="Set Main Reserve Account" subtitle="Float Management" />
      <Card>
        <Card.Header className="d-flex align-items-center justify-content-between">
          <div>
            <h5 className="mb-1">Main Reserve Account Setup</h5>
            <p className="text-muted mb-0 small">The company-wide float pool that funds every merchant&apos;s store float replenishment.</p>
          </div>
          <span className={`badge ${badge.className} badge-label`}>{badge.text}</span>
        </Card.Header>
        <Card.Body>
          {formError && <Alert variant="danger">{formError}</Alert>}
          {isPending && (
            <Alert variant="info" className="py-2 small">
              This request is waiting for approval on the <strong>Main Reserve Account</strong> page before it becomes active.
            </Alert>
          )}
          <Form onSubmit={handleSubmit} noValidate>
            <fieldset disabled={!canEditForm} className="border-0 p-0 m-0">
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Minimum Threshold ($) *</Form.Label>
                    <Form.Control type="number" step="0.01" value={values.minimum_account} onChange={(e) => set('minimum_account', e.target.value)} isInvalid={!!errors.minimum_account} />
                    <Form.Control.Feedback type="invalid">{errors.minimum_account}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Maximum Threshold ($) *</Form.Label>
                    <Form.Control type="number" step="0.01" value={values.maximum_account} onChange={(e) => set('maximum_account', e.target.value)} isInvalid={!!errors.maximum_account} />
                    <Form.Control.Feedback type="invalid">{errors.maximum_account}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                {canSubmitNew && (
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Opening Amount ($) *</Form.Label>
                      <Form.Control type="number" step="0.01" value={values.amount} onChange={(e) => set('amount', e.target.value)} isInvalid={!!errors.amount} />
                      <Form.Control.Feedback type="invalid">{errors.amount}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                )}
                {isApproved && (
                  <Col md={6}>
                    <Form.Label>Current Balance</Form.Label>
                    <Form.Control value={`BSD ${Number(account?.amount || 0).toLocaleString()}`} disabled readOnly />
                  </Col>
                )}
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Notification Email *</Form.Label>
                    <Form.Control type="email" value={values.email_address} onChange={(e) => set('email_address', e.target.value)} isInvalid={!!errors.email_address} />
                    <Form.Control.Feedback type="invalid">{errors.email_address}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            </fieldset>
          </Form>
        </Card.Body>
        {canEditForm && (
          <Card.Footer className="d-flex justify-content-end">
            <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving...' : isApproved ? 'Save Changes' : 'Setup Account'}
            </Button>
          </Card.Footer>
        )}
      </Card>
    </>
  )
}

export default SetMainReserveAccountPage
