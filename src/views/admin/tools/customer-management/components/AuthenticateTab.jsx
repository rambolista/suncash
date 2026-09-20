import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import { formatDateTime } from '@/utils/reportHelpers'

const REASONS = ['PIN reset', 'Email change', 'Account unlock', 'Device unlink', 'Profile update', 'Dispute', 'Other']
const POLL_MS = 5000

const AuthenticateTab = ({ customerId, canExecute, mobile, email }) => {
  const { showNotification } = useNotificationContext()
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(null)
  const [method, setMethod] = useState('sms')
  const [reason, setReason] = useState(REASONS[0])
  const [reasonOther, setReasonOther] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const pollRef = useRef(null)

  const loadStatus = () => {
    ApiService.getCustomerManagementAuthenticateStatus(customerId)
      .then((data) => setActive(data?.data || null))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadStatus()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId])

  useEffect(() => {
    if (active?.status === 'Pending') {
      pollRef.current = setInterval(loadStatus, POLL_MS)
    } else if (pollRef.current) {
      clearInterval(pollRef.current)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.status])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!window.confirm(`Send a ${method === 'sms' ? 'text message' : 'email'} authentication request to this customer?`)) return

    setSubmitting(true)
    try {
      await ApiService.requestCustomerManagementAuthenticate(customerId, {
        method,
        reason,
        reason_other: reason === 'Other' ? reasonOther.trim() : null,
      })
      showNotification({ title: 'Success', message: 'Authentication request has been sent.', variant: 'success' })
      loadStatus()
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.errors ? Object.values(err.errors)[0]?.[0] : (err?.message || 'Failed to send request.'), variant: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingState message="Loading authentication status..." />

  const isPending = active?.status === 'Pending'

  return (
    <Card>
      <Card.Header><h5 className="mb-0">Authenticate User</h5></Card.Header>
      <Card.Body>
        {active && (
          <Alert variant={isPending ? 'warning' : 'secondary'} className="py-2 small">
            Last request: <strong>{active.status}</strong> via {active.method} ({active.reason}) — requested {formatDateTime(active.created_at)}
            {isPending && ' — this pending request expires automatically 3 minutes after it was sent.'}
          </Alert>
        )}

        <fieldset disabled={!canExecute || isPending}>
          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              <Col md={4}>
                <Form.Label>Method</Form.Label>
                <Form.Select value={method} onChange={(e) => setMethod(e.target.value)}>
                  <option value="sms" disabled={!mobile}>SMS{!mobile ? ' (no mobile on file)' : ''}</option>
                  <option value="email" disabled={!email}>Email{!email ? ' (no email on file)' : ''}</option>
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Label>Reason</Form.Label>
                <Form.Select value={reason} onChange={(e) => setReason(e.target.value)}>
                  {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </Form.Select>
              </Col>
              {reason === 'Other' && (
                <Col md={4}>
                  <Form.Label>Specify Reason</Form.Label>
                  <Form.Control value={reasonOther} onChange={(e) => setReasonOther(e.target.value)} />
                </Col>
              )}
            </Row>
            <Button type="submit" variant="success" className="mt-3" disabled={submitting}>
              {submitting ? 'Sending...' : 'Authenticate User'}
            </Button>
          </Form>
        </fieldset>
      </Card.Body>
    </Card>
  )
}

export default AuthenticateTab
