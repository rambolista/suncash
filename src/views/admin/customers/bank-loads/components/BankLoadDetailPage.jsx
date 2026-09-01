import { useEffect, useState } from 'react'
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import ConfirmActionModal from '../../../merchants/components/ConfirmActionModal'
import BankLoadHistoryModal from './BankLoadHistoryModal'
import BankLoadTransactionsModal from './BankLoadTransactionsModal'

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

const BankLoadDetailPage = ({ bankLoadId, canApprove, onBack }) => {
  const { showNotification } = useNotificationContext()
  const [loading, setLoading] = useState(true)
  const [bankLoad, setBankLoad] = useState(null)
  const [amount, setAmount] = useState('')
  const [referenceId, setReferenceId] = useState('')
  const [amountError, setAmountError] = useState('')
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showTransactionsModal, setShowTransactionsModal] = useState(false)
  const [activeConfirm, setActiveConfirm] = useState(null) // 'approve' | 'reject' | null

  const isPending = bankLoad?.status === 'PENDING'
  const canProcess = isPending && canApprove

  const load = () => {
    setLoading(true)
    ApiService.getCustomerBankLoad(bankLoadId)
      .then((detail) => {
        setBankLoad(detail)
        setAmount(detail?.amount != null ? String(detail.amount) : '')
        setReferenceId(detail?.transaction_reference_id || '')
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load bank load request.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [bankLoadId])

  const openProcessConfirm = () => {
    const numeric = Number(String(amount).replace(/,/g, ''))
    if (!amount || Number.isNaN(numeric) || numeric <= 0) {
      setAmountError('Enter a valid amount.')
      return
    }
    setAmountError('')
    setActiveConfirm('approve')
  }

  if (loading) {
    return (
      <>
        <PageBreadcrumb title="Bank Load Information" subtitle="Bank Loads" />
        <LoadingState />
      </>
    )
  }

  const badge = STATUS_BADGE[bankLoad?.status] || { text: bankLoad?.status || 'UNKNOWN', className: 'bg-secondary-subtle text-secondary' }

  return (
    <>
      <PageBreadcrumb title="Bank Load Information" subtitle="Bank Loads" />
      <Button variant="light" size="sm" className="mb-3" onClick={onBack}>
        <Icon icon="arrow-left" className="me-1" /> Back to list
      </Button>

      <Card className="mb-3">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h5 className="mb-0">{bankLoad?.customer_name}</h5>
              <span className="text-muted small">Request #{bankLoad?.transaction_id}</span>
            </div>
            <span className={`badge ${badge.className} badge-label`}>{badge.text}</span>
          </div>

          <Row>
            <Col md={6}>
              <ReadOnlyField label="Date/Time" value={formatDateTime(bankLoad?.created_date)} />
              <ReadOnlyField label="Customer Mobile" value={bankLoad?.customer_mobile} />
              <ReadOnlyField label="Email" value={bankLoad?.email} />
              <ReadOnlyField label="Risk Rating" value={bankLoad?.risk_rating} />

              <hr />
              <p className="small text-muted mb-2">Bank deposit details</p>
              <ReadOnlyField label="Bank Transferred From" value={bankLoad?.bank} />
              <ReadOnlyField label="Branch" value={bankLoad?.branch} />
              <ReadOnlyField label="Account Number" value={bankLoad?.account_number} />
              <ReadOnlyField label="Bank Transferred To" value={bankLoad?.bank_deposit_to} />

              {bankLoad?.deposit_slip_url && (
                <Form.Group className="mb-2">
                  <Form.Label column sm={5} className="text-muted small d-block">Deposit Slip</Form.Label>
                  <a href={bankLoad.deposit_slip_url} target="_blank" rel="noreferrer">
                    <img src={bankLoad.deposit_slip_url} alt="Deposit slip" className="border rounded" style={{ maxWidth: '100%', maxHeight: 220, objectFit: 'contain' }} />
                  </a>
                </Form.Group>
              )}
            </Col>
            <Col md={6}>
              <ReadOnlyField label="Last Withdrawal Amount" value={money(bankLoad?.last_withdrawal_amount)} />
              <ReadOnlyField label="Last Withdrawal Date" value={formatDateTime(bankLoad?.last_withdrawal_date)} />
              <ReadOnlyField label="Avg. Weekly Withdrawal Amount" value={money(bankLoad?.average_weekly_withdrawal_amount)} />
              <ReadOnlyField label="Avg. Weekly Withdrawal Frequency" value={bankLoad?.average_weekly_withdrawal_frequency} />
              <ReadOnlyField label="Avg. Weekly Transaction Credits" value={money(bankLoad?.average_weekly_transaction_credits)} />
              <ReadOnlyField label="Avg. Weekly Transaction Count" value={bankLoad?.average_weekly_transaction_count} />

              {!isPending && (
                <>
                  <hr />
                  <ReadOnlyField label="Reference ID" value={bankLoad?.transaction_reference_id} />
                </>
              )}
            </Col>
          </Row>

          <hr />

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Amount {canProcess && <span className="text-danger">*</span>}</Form.Label>
                <Form.Control
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setAmountError('') }}
                  isInvalid={!!amountError}
                  disabled={!canProcess}
                />
                {amountError && <Form.Control.Feedback type="invalid">{amountError}</Form.Control.Feedback>}
                {canProcess && <div className="form-text">Confirm this matches what the bank actually received — adjust if it differs from the request.</div>}
              </Form.Group>
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

          {!canProcess && bankLoad?.status === 'REJECTED' && bankLoad?.message && (
            <Alert variant="danger" className="py-2 small">Reason: {bankLoad.message}</Alert>
          )}

          <div className="d-flex gap-2 mt-3 flex-wrap">
            <Button variant="light" onClick={onBack}>Cancel</Button>
            {canProcess && (
              <>
                <Button variant="danger" onClick={() => setActiveConfirm('reject')}>Reject</Button>
                <Button variant="primary" onClick={openProcessConfirm}>Process</Button>
              </>
            )}
            <Button variant="outline-primary" onClick={() => setShowHistoryModal(true)}>View Settlements</Button>
            <Button variant="outline-primary" onClick={() => setShowTransactionsModal(true)}>View Transactions</Button>
          </div>
        </Card.Body>
      </Card>

      <BankLoadHistoryModal
        show={showHistoryModal}
        onHide={() => setShowHistoryModal(false)}
        bankLoadId={bankLoadId}
        customerName={bankLoad?.customer_name}
      />
      <BankLoadTransactionsModal
        show={showTransactionsModal}
        onHide={() => setShowTransactionsModal(false)}
        bankLoadId={bankLoadId}
        customerName={bankLoad?.customer_name}
      />

      <ConfirmActionModal
        show={activeConfirm === 'approve'}
        onHide={() => setActiveConfirm(null)}
        title="Process bank load"
        message={`Are you sure you want to process this bank load of ${money(amount)} for ${bankLoad?.customer_name || 'this customer'}? Their balance will be credited immediately.`}
        confirmLabel="Process"
        confirmVariant="primary"
        successMessage="Customer settlement has been processed"
        onConfirm={() => ApiService.approveCustomerBankLoad(bankLoadId, { amount, transaction_reference_id: referenceId })}
        onDone={onBack}
      />
      <ConfirmActionModal
        show={activeConfirm === 'reject'}
        onHide={() => setActiveConfirm(null)}
        title="Reject bank load"
        message={`Are you sure you want to reject this bank load request for ${bankLoad?.customer_name || 'this customer'}? No balance has been credited yet, so nothing needs to be reversed.`}
        confirmLabel="Reject"
        confirmVariant="danger"
        successMessage="Request has been rejected."
        onConfirm={() => ApiService.rejectCustomerBankLoad(bankLoadId, {})}
        onDone={onBack}
      />
    </>
  )
}

export default BankLoadDetailPage
