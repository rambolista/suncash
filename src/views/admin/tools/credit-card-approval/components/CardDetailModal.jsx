import { useEffect, useState } from 'react'
import { Alert, Button, Col, Form, Modal, Row } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import { formatDateTime } from '@/utils/reportHelpers'

const STATUS_LABELS = { for_approval: 'For Approval', approved: 'Approved', rejected: 'Rejected' }

const IMAGES = [
  { key: 'customerid_pic_url', label: 'ID Picture' },
  { key: 'card_pic_url', label: 'Card Picture' },
  { key: 'cardwithid_pic_url', label: 'Card with ID Picture' },
]

/** Legacy `#myModal`/`#myModal1` combined — card details + images, with inline Approve/Reject for the Pending tab. */
const CardDetailModal = ({ show, onHide, card, canEdit, startRejecting, onSaved }) => {
  const { showNotification } = useNotificationContext()
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (show) {
      setRejecting(Boolean(startRejecting))
      setReason('')
    }
  }, [show, card, startRejecting])

  if (!card) return null

  const isPending = card.status === 'for_approval'

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to approve this request?')) return
    setSubmitting(true)
    try {
      await ApiService.approveCreditCard(card.id)
      showNotification({ title: 'Success', message: 'Card has been approved.', variant: 'success' })
      onSaved?.()
      onHide()
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to approve card.', variant: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!reason.trim()) return
    setSubmitting(true)
    try {
      await ApiService.rejectCreditCard(card.id, reason.trim())
      showNotification({ title: 'Success', message: 'Card has been rejected.', variant: 'success' })
      onSaved?.()
      onHide()
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to reject card.', variant: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Card Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="g-3 mb-3">
          <Col md={6}><div className="text-muted small">Card Name</div><div className="fw-semibold">{card.card_name || '—'}</div></Col>
          <Col md={6}><div className="text-muted small">Card Last 4 Digits</div><div className="fw-semibold">{card.card_last4digits || '—'}</div></Col>
          <Col md={6}><div className="text-muted small">Card Type</div><div className="fw-semibold">{card.card_type || '—'}</div></Col>
          <Col md={6}><div className="text-muted small">ID Number</div><div className="fw-semibold">{card.id_number || '—'}</div></Col>
          <Col md={6}><div className="text-muted small">Status</div><div className="fw-semibold">{STATUS_LABELS[card.status] || card.status}</div></Col>
          <Col md={6}><div className="text-muted small">Date Created</div><div className="fw-semibold">{formatDateTime(card.created_at)}</div></Col>
          {card.status === 'rejected' && card.remarks && (
            <Col md={12}><div className="text-muted small">Reason</div><div className="fw-semibold">{card.remarks}</div></Col>
          )}
        </Row>

        <Row className="g-3">
          {IMAGES.map(({ key, label }) => (
            <Col md={4} key={key}>
              <div className="text-muted small mb-1">{label}</div>
              {card[key] ? (
                <a href={card[key]} target="_blank" rel="noreferrer">
                  <img src={card[key]} alt={label} className="img-fluid rounded border" style={{ maxHeight: 160, objectFit: 'cover' }} />
                </a>
              ) : <span className="text-muted">—</span>}
            </Col>
          ))}
        </Row>

        {rejecting && (
          <Form.Group className="mt-3">
            <Form.Label>Reason for rejection *</Form.Label>
            <Form.Control as="textarea" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
            {!reason.trim() && <Alert variant="warning" className="py-1 px-2 small mt-2 mb-0">A reason is required.</Alert>}
          </Form.Group>
        )}
      </Modal.Body>
      <Modal.Footer>
        {canEdit && isPending && !rejecting && (
          <>
            <Button variant="success" disabled={submitting} onClick={handleApprove}>Approve</Button>
            <Button variant="danger" disabled={submitting} onClick={() => setRejecting(true)}>Reject</Button>
          </>
        )}
        {canEdit && isPending && rejecting && (
          <>
            <Button variant="light" disabled={submitting} onClick={() => setRejecting(false)}>Back</Button>
            <Button variant="danger" disabled={submitting || !reason.trim()} onClick={handleReject}>Confirm Reject</Button>
          </>
        )}
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default CardDetailModal
