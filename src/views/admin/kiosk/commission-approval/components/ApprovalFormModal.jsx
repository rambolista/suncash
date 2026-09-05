import { useEffect, useState } from 'react'
import { Alert, Button, Col, Form, Modal, Row } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import LoadingState from '@/components/LoadingState'
import { money } from './format'

const ApprovalFormModal = ({ show, onHide, transactionId, mode, onSaved }) => {
  const { showNotification } = useNotificationContext()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [detail, setDetail] = useState(null)
  const [accountType, setAccountType] = useState('CHECKING')
  const [depositType, setDepositType] = useState('EXPRESS')
  const [rejectNote, setRejectNote] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!show || !transactionId) return
    setLoading(true)
    setError('')
    setRejectNote('')
    setAccountType('CHECKING')
    setDepositType('EXPRESS')
    ApiService.getKioskCommissionApprovalDetail(transactionId)
      .then((data) => setDetail(data?.data || null))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load transaction.', variant: 'danger' }))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, transactionId])

  const handleSubmit = async () => {
    setError('')
    if (mode === 'reject' && rejectNote.trim().length <= 20) {
      setError('Please provide a rejection note of more than 20 characters.')
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'approve') {
        await ApiService.approveKioskCommission(transactionId, detail.is_bank_deposit ? { account_type: accountType, deposit_type: depositType } : {})
        showNotification({ title: 'Success', message: 'Commission has been successfully approved.', variant: 'success' })
      } else {
        await ApiService.rejectKioskCommission(transactionId, { reject_note: rejectNote.trim() })
        showNotification({ title: 'Success', message: 'Commission has been successfully rejected.', variant: 'success' })
      }
      onSaved?.()
      onHide()
    } catch (err) {
      setError(err?.errors ? Object.values(err.errors)[0]?.[0] : (err?.message || 'Something went wrong. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{mode === 'approve' ? 'Approve' : 'Reject'} Commission{detail ? ` — ${detail.kiosk}` : ''}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? <LoadingState message="Loading transaction..." /> : detail && (
          <>
            {error && <Alert variant="danger" className="py-2 small mb-3">{error}</Alert>}
            <Row className="g-3 mb-3">
              <Col md={6}><div className="text-muted small">Kiosk</div><div className="fw-semibold">{detail.kiosk || '—'}</div></Col>
              <Col md={6}><div className="text-muted small">Location</div><div className="fw-semibold">{detail.location || '—'}</div></Col>
              <Col md={6}><div className="text-muted small">Partner Name</div><div className="fw-semibold">{detail.partner_name || '—'}</div></Col>
              <Col md={6}><div className="text-muted small">Partner Mobile</div><div className="fw-semibold">{detail.partner_mobile || '—'}</div></Col>
              <Col md={6}><div className="text-muted small">Payment Type</div><div className="fw-semibold">{detail.payment_type}</div></Col>
              <Col md={6}><div className="text-muted small">Commission Type</div><div className="fw-semibold">{detail.commission_type}</div></Col>
              <Col md={6}><div className="text-muted small">Commission Rate</div><div className="fw-semibold">{detail.commission_rate}</div></Col>
              <Col md={6}><div className="text-muted small">Commission Payment</div><div className="fw-semibold">{money(detail.commission_payment)}</div></Col>
              {detail.is_bank_deposit && (
                <>
                  <Col md={6}><div className="text-muted small">Account Name</div><div className="fw-semibold">{detail.account_name}</div></Col>
                  <Col md={6}><div className="text-muted small">Account No.</div><div className="fw-semibold">{detail.account_no}</div></Col>
                </>
              )}
            </Row>

            {!detail.is_enabled && (
              <Alert variant="warning" className="py-2 small mb-0">
                This recipient has no payout method configured. Set up their payment method before this transaction can be approved or rejected.
              </Alert>
            )}

            {detail.is_enabled && mode === 'approve' && detail.is_bank_deposit && (
              <Row className="g-3">
                <Col md={6}>
                  <Form.Label>Account Type</Form.Label>
                  <Form.Select value={accountType} onChange={(e) => setAccountType(e.target.value)}>
                    <option value="CHECKING">Checking</option>
                    <option value="SAVINGS">Savings</option>
                  </Form.Select>
                </Col>
                <Col md={6}>
                  <Form.Label>Deposit Type</Form.Label>
                  <Form.Select value={depositType} onChange={(e) => setDepositType(e.target.value)}>
                    <option value="EXPRESS">Express (1 Day)</option>
                    <option value="STANDARD">Standard (2-3 Days)</option>
                  </Form.Select>
                </Col>
              </Row>
            )}

            {detail.is_enabled && mode === 'reject' && (
              <Form.Group>
                <Form.Label>Reject Note *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Please explain why this commission payout is being rejected (more than 20 characters)."
                />
              </Form.Group>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={submitting}>Close</Button>
        {detail?.is_enabled && (
          <Button variant={mode === 'approve' ? 'success' : 'danger'} onClick={handleSubmit} disabled={submitting || loading}>
            {submitting ? 'Saving...' : (mode === 'approve' ? 'Approve' : 'Reject')}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  )
}

export default ApprovalFormModal
