import { useEffect, useState } from 'react'
import { Button, Card, Col, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import ConfirmActionModal from '../../../merchants/components/ConfirmActionModal'
import SettlementHistoryModal from './SettlementHistoryModal'
import CustomerTransactionsModal from './CustomerTransactionsModal'

const STATUS_BADGE = {
  PENDING: { text: 'PENDING', className: 'bg-warning-subtle text-warning' },
  PROCESSED: { text: 'PROCESSED', className: 'bg-success-subtle text-success' },
  REJECTED: { text: 'REJECTED', className: 'bg-danger-subtle text-danger' },
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

const SettlementDetailPage = ({ settlementId, canApprove, onBack }) => {
  const { showNotification } = useNotificationContext()
  const [loading, setLoading] = useState(true)
  const [settlement, setSettlement] = useState(null)
  const [referenceId, setReferenceId] = useState('')
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showTransactionsModal, setShowTransactionsModal] = useState(false)
  const [activeConfirm, setActiveConfirm] = useState(null) // 'approve' | 'reject' | null

  const isPending = settlement?.status === 'PENDING'
  const canProcess = isPending && canApprove

  const load = () => {
    setLoading(true)
    ApiService.getCustomerSettlement(settlementId)
      .then((detail) => {
        setSettlement(detail)
        setReferenceId(detail?.transaction_reference_id || '')
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load settlement request.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [settlementId])

  if (loading) {
    return (
      <>
        <PageBreadcrumb title="Settlement Information" subtitle="Customer Settlements" />
        <LoadingState />
      </>
    )
  }

  const badge = STATUS_BADGE[settlement?.status] || { text: settlement?.status || 'UNKNOWN', className: 'bg-secondary-subtle text-secondary' }

  return (
    <>
      <PageBreadcrumb title="Settlement Information" subtitle="Customer Settlements" />
      <Button variant="light" size="sm" className="mb-3" onClick={onBack}>
        <Icon icon="arrow-left" className="me-1" /> Back to list
      </Button>

      <Card className="mb-3">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h5 className="mb-0">{settlement?.customer_name}</h5>
              <span className="text-muted small">Request #{settlement?.transaction_id}</span>
            </div>
            <span className={`badge ${badge.className} badge-label`}>{badge.text}</span>
          </div>

          <Row>
            <Col md={6}>
              <ReadOnlyField label="Date/Time" value={formatDateTime(settlement?.created_date)} />
              <ReadOnlyField label="Withdrawal Option" value={settlement?.withdrawal_type} />
              <ReadOnlyField label="Processed From" value={settlement?.channel} />
              <ReadOnlyField label="Amount" value={money(settlement?.amount)} />
              <ReadOnlyField label="Fee" value={money(settlement?.fee)} />
              <ReadOnlyField label="Customer Mobile" value={settlement?.customer_mobile} />
              <ReadOnlyField label="Email" value={settlement?.email} />
              <ReadOnlyField label="Risk Rating" value={settlement?.risk_rating} />

              <hr />
              <p className="small text-muted mb-2">Destination bank account</p>
              <ReadOnlyField label="Bank" value={settlement?.bank} />
              <ReadOnlyField label="Branch" value={settlement?.branch} />
              <ReadOnlyField label="Account Type" value={settlement?.account_type} />
              <ReadOnlyField label="Account Name" value={settlement?.account_name} />
              <ReadOnlyField label="Account Number" value={settlement?.account_number} />
            </Col>
            <Col md={6}>
              <ReadOnlyField label="Last Withdrawal Amount" value={money(settlement?.last_withdrawal_amount)} />
              <ReadOnlyField label="Last Withdrawal Date" value={formatDateTime(settlement?.last_withdrawal_date)} />
              <ReadOnlyField label="Avg. Weekly Withdrawal Amount" value={money(settlement?.average_weekly_withdrawal_amount)} />
              <ReadOnlyField label="Avg. Weekly Withdrawal Frequency" value={settlement?.average_weekly_withdrawal_frequency} />
              <ReadOnlyField label="Avg. Weekly Transaction Credits" value={money(settlement?.average_weekly_transaction_credits)} />
              <ReadOnlyField label="Avg. Weekly Transaction Count" value={settlement?.average_weekly_transaction_count} />

              {!isPending && (
                <>
                  <hr />
                  <ReadOnlyField label="Reference ID" value={settlement?.transaction_reference_id} />
                </>
              )}
            </Col>
          </Row>

          <hr />

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Reference ID</Form.Label>
                <Form.Control
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  placeholder="Enter the bank transfer's reference/transaction ID"
                  disabled={!canProcess}
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex gap-2 mt-3 flex-wrap">
            <Button variant="light" onClick={onBack}>Cancel</Button>
            {canProcess && (
              <>
                <Button variant="danger" onClick={() => setActiveConfirm('reject')}>Reject</Button>
                <Button variant="primary" onClick={() => setActiveConfirm('approve')}>Process</Button>
              </>
            )}
            <Button variant="outline-primary" onClick={() => setShowHistoryModal(true)}>View Settlements</Button>
            {settlement?.customer_id && (
              <Button variant="outline-primary" onClick={() => setShowTransactionsModal(true)}>View Transactions</Button>
            )}
          </div>
        </Card.Body>
      </Card>

      <SettlementHistoryModal
        show={showHistoryModal}
        onHide={() => setShowHistoryModal(false)}
        settlementId={settlementId}
        customerName={settlement?.customer_name}
      />
      <CustomerTransactionsModal
        show={showTransactionsModal}
        onHide={() => setShowTransactionsModal(false)}
        settlementId={settlementId}
        customerName={settlement?.customer_name}
      />

      <ConfirmActionModal
        show={activeConfirm === 'approve'}
        onHide={() => setActiveConfirm(null)}
        title="Process settlement"
        message={`Are you sure you want to process this settlement request for ${settlement?.customer_name || 'this customer'}?`}
        confirmLabel="Process"
        confirmVariant="primary"
        successMessage="Transaction has been process successfully."
        onConfirm={() => ApiService.approveCustomerSettlement(settlementId, { transaction_reference_id: referenceId })}
        onDone={onBack}
      />
      <ConfirmActionModal
        show={activeConfirm === 'reject'}
        onHide={() => setActiveConfirm(null)}
        title="Reject settlement"
        message={`Are you sure you want to reject this settlement request for ${settlement?.customer_name || 'this customer'}? Any amount already held will be credited back to the customer's balance.`}
        confirmLabel="Reject"
        confirmVariant="danger"
        successMessage="Transaction has been rejected successfully."
        onConfirm={() => ApiService.rejectCustomerSettlement(settlementId, {})}
        onDone={onBack}
      />
    </>
  )
}

export default SettlementDetailPage
