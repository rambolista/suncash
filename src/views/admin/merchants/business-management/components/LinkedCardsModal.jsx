import { Fragment, useEffect, useState } from 'react'
import { Alert, Badge, Button, Form, Modal, Spinner, Table } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const STATUS_BADGE = {
  VERIFIED: 'bg-success-subtle text-success',
  REJECTED: 'bg-danger-subtle text-danger',
  PENDING: 'bg-warning-subtle text-warning',
}

const LinkedCardsModal = ({ show, onHide, merchant }) => {
  const { showNotification } = useNotificationContext()
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)
  const [reason, setReason] = useState('')

  const load = () => {
    if (!merchant) return
    setLoading(true)
    setError('')
    ApiService.getBusinessLinkedCards(merchant.id)
      .then((data) => setCards(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => setError(err?.message || 'Failed to load linked cards.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (show) {
      load()
      setRejectingId(null)
      setReason('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, merchant])

  const handleApprove = async (card) => {
    setBusyId(card.id)
    try {
      await ApiService.approveBusinessLinkedCard(merchant.id, card.id)
      showNotification({ title: 'Success', message: 'Card approved successfully.', variant: 'success' })
      load()
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to approve card.', variant: 'danger' })
    } finally {
      setBusyId(null)
    }
  }

  const handleReject = async (card) => {
    if (!reason.trim()) return
    setBusyId(card.id)
    try {
      await ApiService.rejectBusinessLinkedCard(merchant.id, card.id, reason.trim())
      showNotification({ title: 'Success', message: 'Card rejected successfully.', variant: 'success' })
      setRejectingId(null)
      setReason('')
      load()
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to reject card.', variant: 'danger' })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Credit/Debit Card — {merchant?.dba_name || merchant?.legal_name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" className="py-2 small mb-3">{error}</Alert>}
        {loading ? (
          <div className="text-center py-4"><Spinner size="sm" /></div>
        ) : (
          <div className="table-responsive">
            <Table size="sm" className="align-middle mb-0">
              <thead className="thead-sm text-uppercase fs-xxs">
                <tr>
                  <th>Cardholder</th>
                  <th>Card</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((card) => (
                  <Fragment key={card.id}>
                    <tr>
                      <td>{card.cardholder_name || '—'}</td>
                      <td>{card.card_type ? `${card.card_type} ••${card.card_last_four_digits || ''}` : '—'}</td>
                      <td>{card.merchant_customer_id || '—'}</td>
                      <td><span className={`badge ${STATUS_BADGE[card.status] || 'bg-secondary-subtle text-secondary'} badge-label`}>{card.status}</span></td>
                      <td className="text-nowrap">
                        {card.status === 'PENDING' && (
                          <>
                            <Button size="sm" variant="outline-success" className="me-1" disabled={busyId === card.id} onClick={() => handleApprove(card)}>Approve</Button>
                            <Button size="sm" variant="outline-danger" disabled={busyId === card.id} onClick={() => { setRejectingId(card.id); setReason('') }}>Reject</Button>
                          </>
                        )}
                        {card.status === 'REJECTED' && card.rejected_reason && (
                          <span className="text-muted small">{card.rejected_reason}</span>
                        )}
                      </td>
                    </tr>
                    {rejectingId === card.id && (
                      <tr>
                        <td colSpan={5}>
                          <Form.Group className="d-flex gap-2 align-items-center">
                            <Form.Control size="sm" placeholder="Rejection reason" value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
                            <Button size="sm" variant="danger" disabled={busyId === card.id || !reason.trim()} onClick={() => handleReject(card)}>Confirm reject</Button>
                            <Button size="sm" variant="light" onClick={() => setRejectingId(null)}>Cancel</Button>
                          </Form.Group>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
                {!cards.length && (
                  <tr><td colSpan={5} className="text-center text-muted py-4">No linked cards found for this merchant.</td></tr>
                )}
              </tbody>
            </Table>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default LinkedCardsModal
