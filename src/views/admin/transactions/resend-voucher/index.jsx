import { useMemo, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'

/** Legacy `tools::resend_voucher()` — a flat single-field form, no search step: look up a voucher by code and re-send its original code/PIN/amount via SMS/email. */
const ResendVoucherPage = () => {
  const currentUser = useCurrentUser()
  const canExecute = useMemo(() => Boolean(getModulePermission(currentUser, '/transactions/resend-voucher').can_execute), [currentUser])
  const { showNotification } = useNotificationContext()

  const [voucherNumber, setVoucherNumber] = useState('')
  const [sending, setSending] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmed = voucherNumber.trim()
    if (!trimmed) {
      showNotification({ title: 'Failed', message: 'Enter a voucher number.', variant: 'danger' })
      return
    }

    setSending(true)
    ApiService.resendVoucher(trimmed)
      .then((data) => showNotification({ title: 'Success', message: data.message || 'Voucher successfully resent.', variant: 'success' }))
      .catch((err) => showNotification({ title: 'Failed', message: err?.errors ? Object.values(err.errors)[0]?.[0] : (err?.message || 'Unable to resend voucher.'), variant: 'danger' }))
      .finally(() => setSending(false))
  }

  return (
    <>
      <PageBreadcrumb title="Resend Voucher" subtitle="Transactions" />
      <Card>
        <CardBody>
          <p className="text-muted small mb-3">
            Enter a voucher code to re-send its original code, PIN, and amount via text and email to whichever contact details are on file for it.
          </p>

          <Form onSubmit={handleSubmit}>
            <Row className="g-3 align-items-end">
              <Col md={4}>
                <Form.Label>Voucher Number</Form.Label>
                <Form.Control
                  value={voucherNumber}
                  onChange={(e) => setVoucherNumber(e.target.value)}
                  placeholder="Enter voucher number"
                />
              </Col>
              <Col md={2}>
                <Button type="submit" variant="primary" className="w-100" disabled={sending || !canExecute}>
                  {sending ? 'Sending...' : 'Resend Voucher'}
                </Button>
              </Col>
            </Row>
          </Form>
        </CardBody>
      </Card>
    </>
  )
}

export default ResendVoucherPage
