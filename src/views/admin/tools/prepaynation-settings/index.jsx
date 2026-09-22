import { useEffect, useState } from 'react'
import { Alert, Button, Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'

const PrepaynationSettingsPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const canEdit = Boolean(getModulePermission(currentUser, '/tools/prepaynation-settings').can_edit)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [replenishBalance, setReplenishBalance] = useState('')
  const [notificationAddress, setNotificationAddress] = useState('')

  const load = () => {
    setLoading(true)
    ApiService.getPrepaySettings()
      .then((data) => {
        setReplenishBalance(String(data?.replenish_balance ?? ''))
        setNotificationAddress(data?.notification_address ?? '')
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load Prepaynation settings.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (replenishBalance === '' || Number.isNaN(Number(replenishBalance)) || Number(replenishBalance) < 0) {
      setError('Please enter a valid replenish amount.')
      return
    }
    if (!notificationAddress.trim()) {
      setError('Please enter at least one notification email address.')
      return
    }

    setSubmitting(true)
    try {
      await ApiService.updatePrepaySettings({ replenish_balance: Number(replenishBalance), notification_address: notificationAddress.trim() })
      showNotification({ title: 'Success', message: 'Successfully updated.', variant: 'success' })
      load()
    } catch (err) {
      setError(err?.errors ? Object.values(err.errors)[0]?.[0] : (err?.message || 'Unable to save Prepaynation settings.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageBreadcrumb title="Prepaynation Settings" subtitle="Tools" />

      <Card>
        <CardBody>
          {loading ? <LoadingState message="Loading Prepaynation settings..." /> : (
            <>
              {error && <Alert variant="danger" className="py-2 small mb-3">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Row className="g-3 align-items-end">
                  <Col md={3}>
                    <Form.Label>Replenish Amount</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      value={replenishBalance}
                      onChange={(e) => setReplenishBalance(e.target.value)}
                      disabled={!canEdit}
                    />
                  </Col>
                  <Col md={5}>
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="text"
                      value={notificationAddress}
                      onChange={(e) => setNotificationAddress(e.target.value)}
                      placeholder="comma-separated addresses"
                      disabled={!canEdit}
                    />
                  </Col>
                  {canEdit && (
                    <Col md="auto">
                      <Button type="submit" variant="primary" disabled={submitting}>{submitting ? 'Saving...' : 'Update'}</Button>
                    </Col>
                  )}
                </Row>
              </Form>
            </>
          )}
        </CardBody>
      </Card>
    </>
  )
}

export default PrepaynationSettingsPage
