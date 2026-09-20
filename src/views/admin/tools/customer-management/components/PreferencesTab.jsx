import { useEffect, useState } from 'react'
import { Button, Card, Col, Form, Row } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

/** Legacy's "Prereference" widget — rides the same profile-save endpoint as the Cardholder Profile form (legacy has no separate save action for these two toggles). */
const PreferencesTab = ({ customerId, detail, canEdit, onSaved }) => {
  const { showNotification } = useNotificationContext()
  const [smsNotification, setSmsNotification] = useState(false)
  const [emailNotification, setEmailNotification] = useState(false)
  const [saving, setSaving] = useState(false)

  const [christmasPromo, setChristmasPromo] = useState(false)
  const [loadingPromo, setLoadingPromo] = useState(true)
  const [savingPromo, setSavingPromo] = useState(false)

  useEffect(() => {
    if (!detail) return
    setSmsNotification(Boolean(detail.sms_notification))
    setEmailNotification(Boolean(detail.email_notification))
  }, [detail])

  useEffect(() => {
    setLoadingPromo(true)
    ApiService.getCustomerManagementPromoStatus(customerId)
      .then((result) => setChristmasPromo(Boolean(result?.is_active)))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Unable to load Christmas Promotion status.', variant: 'danger' }))
      .finally(() => setLoadingPromo(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId])

  const handleSave = async () => {
    setSaving(true)
    try {
      await ApiService.updateCustomerManagement(customerId, { sms_notification: smsNotification, email_notification: emailNotification })
      showNotification({ title: 'Success', message: 'Preferences have been updated.', variant: 'success' })
      onSaved?.()
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Unable to save preferences.', variant: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePromo = async (checked) => {
    setChristmasPromo(checked)
    setSavingPromo(true)
    try {
      await ApiService.updateCustomerManagementPromoStatus(customerId, checked)
      showNotification({ title: 'Success', message: 'Preferences have been updated.', variant: 'success' })
    } catch (err) {
      setChristmasPromo(!checked)
      showNotification({ title: 'Failed', message: err?.message || 'Unable to save Christmas Promotion status.', variant: 'danger' })
    } finally {
      setSavingPromo(false)
    }
  }

  return (
    <Card>
      <Card.Header><h5 className="mb-0">Preferences</h5></Card.Header>
      <Card.Body>
        <fieldset disabled={!canEdit}>
          <Row className="g-3">
            <Col md={3}>
              <Form.Check type="switch" label="SMS Notification" checked={smsNotification} onChange={(e) => setSmsNotification(e.target.checked)} />
            </Col>
            <Col md={3}>
              <Form.Check type="switch" label="Email Notification" checked={emailNotification} onChange={(e) => setEmailNotification(e.target.checked)} />
            </Col>
            <Col md={3}>
              <Form.Check type="switch" label="Christmas Promotion" checked={christmasPromo} disabled={loadingPromo || savingPromo} onChange={(e) => handleTogglePromo(e.target.checked)} />
            </Col>
          </Row>
          {canEdit && (
            <Button variant="primary" className="mt-3" disabled={saving} onClick={handleSave}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </fieldset>
      </Card.Body>
    </Card>
  )
}

export default PreferencesTab
