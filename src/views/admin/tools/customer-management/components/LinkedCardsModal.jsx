import { useState } from 'react'
import { Button, Col, Modal, Row } from 'react-bootstrap'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

/** Legacy `myModalCards` — shows the single card picked from the "Linked Cards" dropdown, not a full list. */
const LinkedCardsModal = ({ show, onHide, card, canDelete, onDeleted }) => {
  const { showNotification } = useNotificationContext()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this card?')) return
    setDeleting(true)
    try {
      await ApiService.deleteCustomerManagementLinkedCard(card.id)
      showNotification({ title: 'Success', message: 'Customer card successfully deleted.', variant: 'success' })
      onDeleted?.(card.id)
      onHide()
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Unable to delete card.', variant: 'danger' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Customer Card Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!card ? <p className="text-muted mb-0">No card selected.</p> : (
          <Row className="g-3">
            <Col md={6}><div className="text-muted small">Cardholder Name</div><div className="fw-semibold">{card.cardholder_name || '—'}</div></Col>
            <Col md={6}><div className="text-muted small">Card Type</div><div className="fw-semibold">{card.card_type || '—'}</div></Col>
            <Col md={6}><div className="text-muted small">Last 4 Digits</div><div className="fw-semibold">{card.card_last_four_digits || '—'}</div></Col>
          </Row>
        )}
      </Modal.Body>
      {card && canDelete && (
        <Modal.Footer>
          <Button variant="danger" disabled={deleting} onClick={handleDelete}>
            <Icon icon="trash" className="me-1" /> {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </Modal.Footer>
      )}
    </Modal>
  )
}

export default LinkedCardsModal
