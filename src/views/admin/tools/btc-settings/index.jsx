import { useEffect, useState } from 'react'
import { Alert, Button, Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import { money } from '@/utils/reportHelpers'

const CHANNELS = [
  { value: 'suncash', label: 'SunCash' },
  { value: 'customer_app', label: 'SunCash App' },
]

const BtcSettingsPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const canEdit = Boolean(getModulePermission(currentUser, '/tools/btc-settings').can_edit)

  const [channel, setChannel] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [balance, setBalance] = useState(null)
  const [message, setMessage] = useState('')

  const [replenishAmount, setReplenishAmount] = useState('')
  const [notificationAddress, setNotificationAddress] = useState('')

  const load = (ch) => {
    setLoading(true)
    ApiService.getBtcSettings(ch)
      .then((data) => {
        setReplenishAmount(String(data?.replenish_amount ?? ''))
        setNotificationAddress(data?.notification_address ?? '')
        setBalance(data?.balance)
        setMessage(data?.message ?? '')
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load BTC settings.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (channel) load(channel)
  }, [channel])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (replenishAmount === '' || Number.isNaN(Number(replenishAmount)) || Number(replenishAmount) < 0) {
      setError('Please enter a valid replenish amount.')
      return
    }
    if (!notificationAddress.trim()) {
      setError('Please enter at least one notification email address.')
      return
    }

    setSubmitting(true)
    try {
      await ApiService.updateBtcSettings({ channel, replenish_amount: Number(replenishAmount), notification_address: notificationAddress.trim() })
      showNotification({ title: 'Success', message: 'Successfully updated.', variant: 'success' })
      load(channel)
    } catch (err) {
      setError(err?.errors ? Object.values(err.errors)[0]?.[0] : (err?.message || 'Unable to save BTC settings.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageBreadcrumb title="BTC Settings" subtitle="Tools" />

      <Card>
        <CardBody>
          <Row className="g-3 mb-3">
            <Col md={3}>
              <Form.Label>List of Account</Form.Label>
              <Form.Select value={channel} onChange={(e) => setChannel(e.target.value)}>
                <option value="">--Select--</option>
                {CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Form.Select>
            </Col>
          </Row>

          {channel && !loading && (
            <>
              <h5 className="mb-3">BTC Balance: {balance !== null && balance !== undefined ? money(balance) : '—'}</h5>
              {message && <Alert variant="warning" className="py-2 small">{message}</Alert>}
              {error && <Alert variant="danger" className="py-2 small mb-3">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Row className="g-3 align-items-end">
                  <Col md={3}>
                    <Form.Label>Replenish Amount</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      value={replenishAmount}
                      onChange={(e) => setReplenishAmount(e.target.value)}
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

export default BtcSettingsPage
