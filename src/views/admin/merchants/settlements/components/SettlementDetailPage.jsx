import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Col, Form, Row } from 'react-bootstrap'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import ConfirmActionModal from '../../components/ConfirmActionModal'
import LinkBankAccountModal from './LinkBankAccountModal'
import SettlementHistoryModal from './SettlementHistoryModal'
import MerchantTransactionsModal from './MerchantTransactionsModal'

const STATUS_BADGE = {
  P: { text: 'PENDING', className: 'bg-warning-subtle text-warning' },
  A: { text: 'PROCESSED', className: 'bg-success-subtle text-success' },
  R: { text: 'REJECTED', className: 'bg-danger-subtle text-danger' },
}

const emptyValues = {
  bank_account_id: '', check_number: '', payee: '', is_process: false, bank_trans_id: '', account_number: '', message: '',
}

const buildSchema = (type) => {
  if (type === 'Cheque') {
    return Yup.object({
      bank_account_id: Yup.string().required('Please select a bank.'),
      check_number: Yup.string().trim().required('Check number is required.'),
      payee: Yup.string().trim().required('Payee is required.'),
      is_process: Yup.boolean().oneOf([true], 'Please confirm the check has been signed.'),
      message: Yup.string(),
    })
  }
  if (type === 'Bank Transfer' || type === 'Bank Deposit') {
    return Yup.object({
      bank_account_id: Yup.string().required('Please select a bank.'),
      bank_trans_id: type === 'Bank Transfer'
        ? Yup.string().trim().required('Transaction ID is required.')
        : Yup.string(),
      account_number: Yup.string(),
      message: Yup.string(),
    })
  }
  return Yup.object()
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
  const [showTransactionsModal, setShowTransactionsModal] = useState(false)
  const [activeConfirm, setActiveConfirm] = useState(null) // 'approve' | 'reject' | null

  const isCheque = settlement?.type === 'Cheque'
  const isTransfer = settlement?.type === 'Bank Transfer' || settlement?.type === 'Bank Deposit'
  const isPending = settlement?.status === 'P'
  const canProcess = isPending && canApprove

  const schema = useMemo(() => buildSchema(settlement?.type), [settlement?.type])

  const formik = useFormik({
    initialValues: emptyValues,
    validationSchema: schema,
    onSubmit: () => setActiveConfirm('approve'),
  })

  const load = () => {
    setLoading(true)
    Promise.all([ApiService.getMerchantSettlement(settlementId), ApiService.getLinkedBankAccounts(), ApiService.getSettlementBanks()])
      .then(([detail, accounts, bankList]) => {
        setSettlement(detail)
        setLinkedAccounts(Array.isArray(accounts) ? accounts : [])
        setBanks(Array.isArray(bankList) ? bankList : [])
        formik.resetForm({
          values: {
            bank_account_id: detail?.bank_account_id && detail.bank_account_id !== -1 ? String(detail.bank_account_id) : '',
            check_number: detail?.check_number || '',
            payee: detail?.payee || '',
            is_process: Boolean(detail?.is_process),
            bank_trans_id: detail?.bank_trans_id || '',
            account_number: detail?.account_number_transfered || '',
            message: detail?.message_to_business || '',
          },
        })
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load settlement request.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [settlementId])

  const openRejectConfirm = () => {
    if (isCheque && !formik.values.payee.trim()) {
      formik.setFieldTouched('payee', true, false)
      formik.setFieldError('payee', 'Payee is required.')
      return
    }
    setActiveConfirm('reject')
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
  const { values: v, errors: e, touched: t } = formik

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

          <Form noValidate onSubmit={formik.handleSubmit}>
            <Row>
              <Col md={6}>
                {isCheque && (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Label>Bank Account *</Form.Label>
                      <div className="d-flex gap-2">
                        <Form.Select
                          name="bank_account_id"
                          value={v.bank_account_id}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          isInvalid={t.bank_account_id && !!e.bank_account_id}
                          disabled={!canProcess}
                        >
                          <option value="">--Select Bank--</option>
                          {linkedAccounts.map((account) => <option key={account.id} value={account.id}>{account.bank} - {account.branch}</option>)}
                        </Form.Select>
                        <Button variant="outline-secondary" size="sm" disabled={!canEdit} onClick={() => setShowLinkModal(true)}>Link Account</Button>
                      </div>
                      <Form.Control.Feedback type="invalid" className={t.bank_account_id && e.bank_account_id ? 'd-block' : ''}>{e.bank_account_id}</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Check Number *</Form.Label>
                      <Form.Control
                        name="check_number"
                        value={v.check_number}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        isInvalid={t.check_number && !!e.check_number}
                        disabled={!canProcess}
                      />
                      <Form.Control.Feedback type="invalid">{e.check_number}</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Payee *</Form.Label>
                      <Form.Control
                        name="payee"
                        value={v.payee}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        isInvalid={t.payee && !!e.payee}
                        disabled={!canProcess}
                      />
                      <Form.Control.Feedback type="invalid">{e.payee}</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id="is_process"
                        name="is_process"
                        label="Check Signed"
                        checked={v.is_process}
                        onChange={formik.handleChange}
                        isInvalid={t.is_process && !!e.is_process}
                        disabled={!canProcess}
                      />
                      {t.is_process && e.is_process && <div className="invalid-feedback d-block">{e.is_process}</div>}
                    </Form.Group>
                  </>
                )}

                {isTransfer && (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Label>Bank Account Transferred From *</Form.Label>
                      <div className="d-flex gap-2">
                        <Form.Select
                          name="bank_account_id"
                          value={v.bank_account_id}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          isInvalid={t.bank_account_id && !!e.bank_account_id}
                          disabled={!canProcess}
                        >
                          <option value="">--Select Bank--</option>
                          {linkedAccounts.map((account) => <option key={account.id} value={account.id}>{account.bank} - {account.branch}</option>)}
                        </Form.Select>
                        <Button variant="outline-secondary" size="sm" disabled={!canEdit} onClick={() => setShowLinkModal(true)}>Link Account</Button>
                      </div>
                      <Form.Control.Feedback type="invalid" className={t.bank_account_id && e.bank_account_id ? 'd-block' : ''}>{e.bank_account_id}</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Account Number</Form.Label>
                      <Form.Control
                        name="account_number"
                        value={v.account_number}
                        onChange={formik.handleChange}
                        disabled={!canProcess}
                      />
                    </Form.Group>
                    {settlement?.type === 'Bank Transfer' && (
                      <Form.Group className="mb-3">
                        <Form.Label>Transaction ID *</Form.Label>
                        <Form.Control
                          name="bank_trans_id"
                          value={v.bank_trans_id}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          isInvalid={t.bank_trans_id && !!e.bank_trans_id}
                          disabled={!canProcess}
                        />
                        <Form.Control.Feedback type="invalid">{e.bank_trans_id}</Form.Control.Feedback>
                      </Form.Group>
                    )}
                  </>
                )}

                <Form.Group>
                  <Form.Label>Message to Business</Form.Label>
                  <Form.Control as="textarea" rows={3} name="message" value={v.message} onChange={formik.handleChange} disabled={!canProcess} />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex gap-2 mt-3 flex-wrap">
              <Button variant="light" onClick={onBack}>Cancel</Button>
              {canProcess && (
                <>
                  <Button variant="danger" type="button" onClick={openRejectConfirm}>Reject</Button>
                  <Button variant="primary" type="submit">Process</Button>
                </>
              )}
              <Button variant="outline-primary" type="button" onClick={() => setShowHistoryModal(true)}>View Settlements</Button>
              <Button variant="outline-primary" type="button" onClick={() => setShowTransactionsModal(true)}>View Transactions</Button>
            </div>
          </Form>
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
      <MerchantTransactionsModal
        show={showTransactionsModal}
        onHide={() => setShowTransactionsModal(false)}
        merchantId={settlement?.client_record_id}
        merchantName={settlement?.dba_name}
      />

      <ConfirmActionModal
        show={activeConfirm === 'approve'}
        onHide={() => setActiveConfirm(null)}
        title="Process settlement"
        message={`Are you sure you want to process this settlement request for ${settlement?.dba_name || 'this merchant'}?`}
        confirmLabel="Process"
        confirmVariant="primary"
        successMessage="Request has been approved."
        onConfirm={() => ApiService.approveMerchantSettlement(settlementId, v)}
        onDone={onBack}
      />
      <ConfirmActionModal
        show={activeConfirm === 'reject'}
        onHide={() => setActiveConfirm(null)}
        title="Reject settlement"
        message={`Are you sure you want to reject this settlement request for ${settlement?.dba_name || 'this merchant'}?`}
        confirmLabel="Reject"
        confirmVariant="danger"
        successMessage="Request has been rejected."
        onConfirm={() => ApiService.rejectMerchantSettlement(settlementId, { payee: v.payee, message: v.message })}
        onDone={onBack}
      />
    </>
  )
}

export default SettlementDetailPage
