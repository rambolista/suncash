import { useState } from 'react'
import { Button, Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import { formatDateTime } from '@/utils/reportHelpers'

const VOUCHER_TYPES = [
  { value: '', label: 'Select a type' },
  { value: 'unibucks', label: 'UniBucks' },
  { value: 'suncash', label: 'SunCash' },
  { value: 'credit', label: 'Credit' },
]

const KioskVoucherPinToolPage = () => {
  const { showNotification } = useNotificationContext()
  const [code, setCode] = useState('')
  const [type, setType] = useState('')
  const [checking, setChecking] = useState(false)
  const [details, setDetails] = useState(null)

  const handleCheck = (event) => {
    event.preventDefault()
    if (!code.trim()) {
      showNotification({ title: 'Invalid voucher code', message: 'Enter a voucher code.', variant: 'danger' })
      return
    }
    if (!type) {
      showNotification({ title: 'Invalid voucher type', message: 'Select a voucher type.', variant: 'danger' })
      return
    }

    setChecking(true)
    setDetails(null)
    ApiService.lookupKioskVoucherPin(code.trim(), type)
      .then(setDetails)
      .catch((err) => showNotification({ title: 'Lookup failed', message: err?.message || 'No record found.', variant: 'danger' }))
      .finally(() => setChecking(false))
  }

  return (
    <>
      <PageBreadcrumb title="Voucher Pin Tool" subtitle="Kiosk" />

      <Card>
        <CardBody>
          <p className="text-muted small mb-3">
            Look up a voucher's PIN, status, and voucher/redeemed date by code. Every lookup is recorded in
            Kiosk &gt; Reports &gt; Voucher Access.
          </p>

          <Form onSubmit={handleCheck}>
            <Row className="g-3 align-items-end">
              <Col md={3}>
                <Form.Label>Voucher Type</Form.Label>
                <Form.Select value={type} onChange={(e) => setType(e.target.value)}>
                  {VOUCHER_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Label>Voucher Code</Form.Label>
                <Form.Control value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter voucher code" />
              </Col>
              <Col md={2}>
                <Button type="submit" variant="success" className="w-100" disabled={checking}>
                  {checking ? 'Checking...' : 'Check Info'}
                </Button>
              </Col>
            </Row>
          </Form>

          {details && (
            <Row className="g-3 mt-1">
              <Col md={3}>
                <Form.Label>Voucher Date</Form.Label>
                <Form.Control readOnly value={formatDateTime(details.voucher_date)} />
              </Col>
              <Col md={2}>
                <Form.Label>Pin</Form.Label>
                <Form.Control readOnly value={details.pin ?? ''} />
              </Col>
              <Col md={2}>
                <Form.Label>Status</Form.Label>
                <Form.Control readOnly value={details.status ?? ''} />
              </Col>
              <Col md={3}>
                <Form.Label>Redeemed Date</Form.Label>
                <Form.Control readOnly value={details.redeemed_date ? formatDateTime(details.redeemed_date) : ''} />
              </Col>
            </Row>
          )}
        </CardBody>
      </Card>
    </>
  )
}

export default KioskVoucherPinToolPage
