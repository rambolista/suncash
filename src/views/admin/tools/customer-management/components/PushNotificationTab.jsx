import { useState } from 'react'
import { Button, Card } from 'react-bootstrap'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const TYPES = [
  { type: 'kyc', label: 'Send KYC Notification', icon: 'id', message: 'Upload valid Government ID to remove account restrictions.' },
  { type: 'version', label: 'Send App Update Notification', icon: 'refresh', message: 'New version available. Please update your app to the latest version.' },
]

const PushNotificationTab = ({ customerId, canExecute }) => {
  const { showNotification } = useNotificationContext()
  const [sending, setSending] = useState('')

  const handleSend = async (type) => {
    setSending(type)
    try {
      const result = await ApiService.sendCustomerManagementPushNotification(customerId, type)
      showNotification({ title: result.sent_via === 'push' ? 'Success' : 'Notice', message: result.message, variant: result.sent_via === 'push' ? 'success' : 'warning' })
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.errors ? Object.values(err.errors)[0]?.[0] : (err?.message || 'Unable to send push notification.'), variant: 'danger' })
    } finally {
      setSending('')
    }
  }

  return (
    <Card>
      <Card.Header><h5 className="mb-0">Push Notification</h5></Card.Header>
      <Card.Body>
        <p className="text-muted small">Sends via Firebase Cloud Messaging when the customer has a registered device token; otherwise falls back to SMS.</p>
        <div className="d-flex gap-2 flex-wrap">
          {TYPES.map((t) => (
            <Button key={t.type} variant="secondary" disabled={!canExecute || sending !== ''} onClick={() => handleSend(t.type)}>
              <Icon icon={t.icon} className="me-1" /> {sending === t.type ? 'Sending...' : t.label}
            </Button>
          ))}
        </div>
      </Card.Body>
    </Card>
  )
}

export default PushNotificationTab
