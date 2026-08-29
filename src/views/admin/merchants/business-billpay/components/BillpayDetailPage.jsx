import { useEffect, useState } from 'react'
import { Button, Card, Col, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import ConfirmActionModal from '../../components/ConfirmActionModal'

const STATUS_BADGE = {
  A: { text: 'PENDING', className: 'bg-warning-subtle text-warning' },
  P: { text: 'PROCESSED', className: 'bg-success-subtle text-success' },
  R: { text: 'REJECTED', className: 'bg-danger-subtle text-danger' },
}

const money = (value) => `BSD ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(String(value).replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const ReadOnlyField = ({ label, value }) => (
  <Form.Group as={Row} className="mb-2">
    <Form.Label column sm={5} className="text-muted small">{label}</Form.Label>
    <Col sm={7}>
      <Form.Control size="sm" value={value ?? '—'} disabled readOnly />
    </Col>
  </Form.Group>
)

const BillpayDetailPage = ({ transactionId, canApprove, onBack }) => {
  const { showNotification } = useNotificationContext()
  const [loading, setLoading] = useState(true)
  const [bill, setBill] = useState(null)
  const [activeConfirm, setActiveConfirm] = useState(null) // 'approve' | 'reject' | null

  const load = () => {
    setLoading(true)
    ApiService.getBusinessBillpayDetail(transactionId)
      .then(setBill)
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load billpay request.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [transactionId])

  const isPending = bill?.status === 'A'
  const canProcess = isPending && canApprove

  if (loading) {
    return (
      <>
        <PageBreadcrumb title="Billpay Information" subtitle="Business Billpay" />
        <LoadingState />
      </>
    )
  }

  const badge = STATUS_BADGE[bill?.status] || { text: bill?.status || 'UNKNOWN', className: 'bg-secondary-subtle text-secondary' }

  return (
    <>
      <PageBreadcrumb title="Billpay Information" subtitle="Business Billpay" />
      <Button variant="light" size="sm" className="mb-3" onClick={onBack}>
        <Icon icon="arrow-left" className="me-1" /> Back to list
      </Button>

      <Card className="mb-3">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h5 className="mb-0">{bill?.payor} <Icon icon="arrow-right" className="mx-1" /> {bill?.payee}</h5>
              <span className="text-muted small">Request #{bill?.transaction_id}</span>
            </div>
            <span className={`badge ${badge.className} badge-label`}>{badge.text}</span>
          </div>

          <Row>
            <Col md={6}>
              <ReadOnlyField label="Date/Time" value={formatDateTime(bill?.created_at)} />
              <ReadOnlyField label="Reference Number" value={bill?.reference_number} />
              <ReadOnlyField label="From" value={bill?.payor} />
              <ReadOnlyField label="To" value={bill?.payee} />
            </Col>
            <Col md={6}>
              <ReadOnlyField label="Transaction Type" value={bill?.transaction_type} />
              <ReadOnlyField label="Amount" value={money(bill?.amount)} />
              <ReadOnlyField label="Fee" value={money(bill?.fee)} />
              <ReadOnlyField label="Vat" value={money(bill?.vat)} />
              <ReadOnlyField label="Total" value={money(bill?.total)} />
            </Col>
          </Row>

          <Form.Group className="mt-2">
            <Form.Label>Notes</Form.Label>
            <Form.Control as="textarea" rows={2} value={bill?.notes || ''} disabled readOnly />
          </Form.Group>

          <div className="d-flex gap-2 mt-3 flex-wrap">
            <Button variant="light" onClick={onBack}>Cancel</Button>
            {canProcess && (
              <>
                <Button variant="danger" onClick={() => setActiveConfirm('reject')}>Reject</Button>
                <Button variant="primary" onClick={() => setActiveConfirm('approve')}>Process</Button>
              </>
            )}
          </div>
        </Card.Body>
      </Card>

      <ConfirmActionModal
        show={activeConfirm === 'approve'}
        onHide={() => setActiveConfirm(null)}
        title="Process billpay request"
        message={`Are you sure you want to process this payment from ${bill?.payor || 'the payor'} to ${bill?.payee || 'the payee'}?`}
        confirmLabel="Process"
        confirmVariant="primary"
        successMessage="Request has been approved."
        onConfirm={() => ApiService.approveBusinessBillpay(transactionId)}
        onDone={onBack}
      />
      <ConfirmActionModal
        show={activeConfirm === 'reject'}
        onHide={() => setActiveConfirm(null)}
        title="Reject billpay request"
        message={`Are you sure you want to reject this payment from ${bill?.payor || 'the payor'} to ${bill?.payee || 'the payee'}? The payor will be refunded.`}
        confirmLabel="Reject"
        confirmVariant="danger"
        successMessage="Request has been rejected."
        onConfirm={() => ApiService.rejectBusinessBillpay(transactionId)}
        onDone={onBack}
      />
    </>
  )
}

export default BillpayDetailPage
