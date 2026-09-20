import { useState } from 'react'
import { Alert, Button, Card, CardBody, Form } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import ConfirmActionModal from '@/views/admin/merchants/components/ConfirmActionModal'

const MESSAGE_MAX_LENGTH = 145

const SendSmsPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const canSend = Boolean(getModulePermission(currentUser, '/tools/send-sms').can_execute)

  const [mobileNumber, setMobileNumber] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [confirmCount, setConfirmCount] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!message.trim()) {
      setError('Please enter a message to send.')
      return
    }

    const mobile = mobileNumber.trim()
    if (mobile !== '') {
      setSending(true)
      try {
        const result = await ApiService.sendSms({ mobile_number: mobile, message: message.trim() })
        if (!result?.data?.sent && !result?.data?.simulated) {
          throw new Error(result?.message || 'Failed to send the message.')
        }
        showNotification({ title: 'Success', message: result?.message || 'Message sent.', variant: 'success' })
        setMessage('')
      } catch (err) {
        showNotification({ title: 'Failed', message: err?.message || 'Failed to send the message.', variant: 'danger' })
      } finally {
        setSending(false)
      }
      return
    }

    // Blank number = broadcast to every activated cardholder — confirm the recipient count first.
    setSending(true)
    try {
      const { count } = await ApiService.getSendSmsRecipientCount()
      setConfirmCount(count)
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to look up recipients.', variant: 'danger' })
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <PageBreadcrumb title="Send SMS" subtitle="Tools" />

      <Card>
        <CardBody>
          <p className="text-muted small mb-3">
            Leaving the mobile number blank will send this message to every activated cardholder.
          </p>

          {error && <Alert variant="danger" className="py-2 small mb-3">{error}</Alert>}

          <fieldset disabled={!canSend}>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Mobile Number</Form.Label>
                <Form.Control
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="Leave blank to send to all activated cardholders"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Message</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  maxLength={MESSAGE_MAX_LENGTH}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter the message to send"
                />
                <Form.Text muted>{message.length}/{MESSAGE_MAX_LENGTH} characters</Form.Text>
              </Form.Group>

              <Button type="submit" variant="primary" disabled={sending}>{sending ? 'Please wait...' : 'Send'}</Button>
            </Form>
          </fieldset>
        </CardBody>
      </Card>

      <ConfirmActionModal
        show={confirmCount !== null}
        onHide={() => setConfirmCount(null)}
        title="Send SMS to All Activated Cardholders"
        message={`You are about to send this message to ${confirmCount ?? 0} activated cardholder(s). This cannot be undone. Continue?`}
        confirmLabel="Send"
        confirmVariant="danger"
        successMessage="Message sent."
        onConfirm={() => ApiService.sendSms({ mobile_number: '', message: message.trim() })}
        onDone={() => setMessage('')}
      />
    </>
  )
}

export default SendSmsPage
