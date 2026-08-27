import { useEffect, useState } from 'react'
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import LinkBankAccountModal from './LinkBankAccountModal'
import SettlementHistoryModal from './SettlementHistoryModal'

const STATUS_BADGE = {
  P: { text: 'PENDING', className: 'bg-warning-subtle text-warning' },
  A: { text: 'PROCESSED', className: 'bg-success-subtle text-success' },
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

const SettlementDetailPage = ({ settlementId, canApprove, canEdit, onBack }) => {
  const { showNotification } = useNotificationContext()
  const [loading, setLoading] = useState(true)
  const [settlement, setSettlement] = useState(null)
  const [linkedAccounts, setLinkedAccounts] = useState([])
  const [banks, setBanks] = useState([])
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [submitting, setSubmitting] = useState('')
  const [formError, setFormError] = useState('')

  const [bankAccountId, setBankAccountId] = useState('')
  const [checkNumber, setCheckNumber] = useState('')
  const [payee, setPayee] = useState('')
  const [isProcess, setIsProcess] = useState(false)
  const [bankTransId, setBankTransId] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [message, setMessage] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([ApiService.getMerchantSettlement(settlementId), ApiService.getLinkedBankAccounts(), ApiService.getSettlementBanks()])
      .then(([detail, accounts, bankList]) => {
        setSettlement(detail)
        setLinkedAccounts(Array.isArray(accounts) ? accounts : [])
        setBanks(Array.isArray(bankList) ? bankList : [])
        setPayee(detail?.payee || '')
        setCheckNumber(detail?.check_number || '')
        setIsProcess(Boolean(detail?.is_process))
        setBankTransId(detail?.bank_trans_id || '')
        setAccountNumber(detail?.account_number_transfered || '')
        setMessage(detail?.message_to_business || '')
        setBankAccountId(detail?.bank_account_id && detail.bank_account_id !== -1 ? String(detail.bank_account_id) : '')
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load settlement request.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [settlementId])

  const isCheque = settlement?.type === 'Cheque'
  const isTransfer = settlement?.type === 'Bank Transfer' || settlement?.type === 'Bank Deposit'
  const isPending = settlement?.status === 'P'
  const canProcess = isPending && canApprove

  const handleApprove = async () => {
    setFormError('')
    if (!confirm('Are you sure you want to process this settlement?')) return
    setSubmitting('approve')
    try {
      const result = await ApiService.approveMerchantSettlement(settlementId, {
        payee, message,
        bank_account_id: bankAccountId,
        check_number: checkNumber,
        is_process: isProcess,
        bank_trans_id: bankTransId,
        account_number: accountNumber,
      })
      showNotification({ title: 'Success', message: result?.message || 'Request has been approved.', variant: 'success' })
      onBack()
    } catch (err) {
      const errors = err?.errors || {}
      setFormError(Object.values(errors)[0]?.[0] || err?.message || 'Failed to approve settlement.')
    } finally {
      setSubmitting('')
    }
  }

  const handleReject = async () => {
    setFormError('')
    if (!payee.trim()) {
      setFormError('Please enter Payee.')
      return
    }
    if (!confirm('Are you sure you want to reject this settlement?')) return
    setSubmitting('reject')
    try {
      const result = await ApiService.rejectMerchantSettlement(settlementId, { payee, message })
      showNotification({ title: 'Success', message: result?.message || 'Request has been rejected.', variant: 'success' })
      onBack()
    } catch (err) {
      const errors = err?.errors || {}
      setFormError(Object.values(errors)[0]?.[0] || err?.message || 'Failed to reject settlement.')
    } finally {
      setSubmitting('')
    }
  }

  if (loading) {
    return (
      <>
        <PageBreadcrumb title="Settlement Information" subtitle="Merchant Settlements" />
        <LoadingState />
      </>
    )
  }

  const badge = STATUS_BADGE[settlement?.status] || { text: settlement?.status || 'UNKNOWN', className: 'bg-secondary-subtle text-secondary' }

  return (
    <>
      <PageBreadcrumb title="Settlement Information" subtitle="Merchant Settlements" />
      <Button variant="light" size="sm" className="mb-3" onClick={onBack}>
        <Icon icon="arrow-left" className="me-1" /> Back to list
      </Button>

      <Card className="mb-3">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h5 className="mb-0">{settlement?.dba_name} <span className="text-muted small">({settlement?.suntag_shortcode})</span></h5>
              <span className="text-muted small">Request #{settlement?.transaction_id}</span>
            </div>
            <span className={`badge ${badge.className} badge-label`}>{badge.text}</span>
          </div>

          {formError && <Alert variant="danger" className="py-2 small">{formError}</Alert>}

          <Row>
            <Col md={6}>
              <ReadOnlyField label="Date/Time" value={formatDateTime(settlement?.created_date)} />
              <ReadOnlyField label="Withdrawal Option" value={settlement?.type} />
              <ReadOnlyField label="Withdrawal Type" value={settlement?.w_type} />
              <ReadOnlyField label="Amount" value={money(settlement?.amount)} />
              <ReadOnlyField label="Fee" value={money(settlement?.fee)} />
              <ReadOnlyField label="Email" value={settlement?.business_email_address} />

              {isTransfer && (
                <>
                  <hr />
                  <p className="small text-muted mb-2">Requested destination account</p>
                  <ReadOnlyField label="Bank" value={settlement?.bank} />
                  <ReadOnlyField label="Branch" value={settlement?.bank_branch} />
                  <ReadOnlyField label="Account Name" value={settlement?.account_name} />
                  <ReadOnlyField label="Account Number" value={settlement?.account_number} />
                </>
              )}
            </Col>
            <Col md={6}>
              <ReadOnlyField label="Last Withdrawal Amount" value={money(settlement?.last_withdrawal_amount)} />
              <ReadOnlyField label="Last Withdrawal Date" value={formatDateTime(settlement?.last_withdrawal_date)} />
              <ReadOnlyField label="Avg. Weekly Withdrawal Amount" value={money(settlement?.average_weekly_withdrawal_amount)} />
              <ReadOnlyField label="Avg. Weekly Withdrawal Frequency" value={settlement?.average_weekly_withdrawal_frequency} />
              <ReadOnlyField label="Avg. Weekly Transaction Credits" value={money(settlement?.average_weekly_transaction_credits)} />
              <ReadOnlyField label="Avg. Weekly Transaction Count" value={settlement?.average_weekly_transaction_count} />
            </Col>
          </Row>

          <hr />

          <Row>
            <Col md={6}>
              {isCheque && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Bank Account *</Form.Label>
                    <div className="d-flex gap-2">
                      <Form.Select value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)} disabled={!canProcess}>
                        <option value="">--Select Bank--</option>
                        {linkedAccounts.map((account) => <option key={account.id} value={account.id}>{account.bank} - {account.branch}</option>)}
                      </Form.Select>
                      <Button variant="outline-secondary" size="sm" disabled={!canEdit} onClick={() => setShowLinkModal(true)}>Link Account</Button>
                    </div>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Check Number *</Form.Label>
                    <Form.Control value={checkNumber} onChange={(e) => setCheckNumber(e.target.value)} disabled={!canProcess} />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Payee *</Form.Label>
                    <Form.Control value={payee} onChange={(e) => setPayee(e.target.value)} disabled={!canProcess} />
                  </Form.Group>
                  <Form.Check
                    type="checkbox"
                    id="is_process"
                    label="Check Signed"
                    checked={isProcess}
                    onChange={(e) => setIsProcess(e.target.checked)}
                    disabled={!canProcess}
                    className="mb-3"
                  />
                </>
              )}

              {isTransfer && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Bank Account Transferred From *</Form.Label>
                    <div className="d-flex gap-2">
                      <Form.Select value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)} disabled={!canProcess}>
                        <option value="">--Select Bank--</option>
                        {linkedAccounts.map((account) => <option key={account.id} value={account.id}>{account.bank} - {account.branch}</option>)}
                      </Form.Select>
                      <Button variant="outline-secondary" size="sm" disabled={!canEdit} onClick={() => setShowLinkModal(true)}>Link Account</Button>
                    </div>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Account Number</Form.Label>
                    <Form.Control value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} disabled={!canProcess} />
                  </Form.Group>
                  {settlement?.type === 'Bank Transfer' && (
                    <Form.Group className="mb-3">
                      <Form.Label>Transaction ID *</Form.Label>
                      <Form.Control value={bankTransId} onChange={(e) => setBankTransId(e.target.value)} disabled={!canProcess} />
                    </Form.Group>
                  )}
                </>
              )}

              <Form.Group>
                <Form.Label>Message to Business</Form.Label>
                <Form.Control as="textarea" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} disabled={!canProcess} />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex gap-2 mt-3 flex-wrap">
            <Button variant="light" onClick={onBack}>Cancel</Button>
            {canProcess && (
              <>
                <Button variant="danger" disabled={submitting !== ''} onClick={handleReject}>
                  {submitting === 'reject' ? 'Rejecting...' : 'Reject'}
                </Button>
                <Button variant="primary" disabled={submitting !== ''} onClick={handleApprove}>
                  {submitting === 'approve' ? 'Processing...' : 'Process'}
                </Button>
              </>
            )}
            <Button variant="outline-primary" onClick={() => setShowHistoryModal(true)}>View Settlements</Button>
          </div>
        </Card.Body>
      </Card>

      <LinkBankAccountModal
        show={showLinkModal}
        onHide={() => setShowLinkModal(false)}
        banks={banks}
        onLinked={(accounts) => setLinkedAccounts(accounts)}
      />
      <SettlementHistoryModal
        show={showHistoryModal}
        onHide={() => setShowHistoryModal(false)}
        merchantId={settlement?.client_record_id}
        merchantName={settlement?.dba_name}
      />
    </>
  )
}

export default SettlementDetailPage
