import { useState } from 'react'
import { Button, Modal } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const GeoPromoDeleteConfirmModal = ({ show, onHide, promo, onDone }) => {
  const { showNotification } = useNotificationContext()
  const [submitting, setSubmitting] = useState(false)

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      await ApiService.deleteGeoPromo(promo.id)
      showNotification({ title: 'Success', message: 'Sign up promotion zone removed successfully.', variant: 'success' })
      onDone?.()
      onHide()
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to remove zone.', variant: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Remove sign up promotion zone</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-0">
          This will permanently remove the <strong>{promo?.promo_description}</strong> zone — new signups inside it will no longer receive its bonus. Continue?
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={submitting}>Cancel</Button>
        <Button variant="danger" onClick={handleConfirm} disabled={submitting}>
          {submitting ? 'Removing...' : 'Remove'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default GeoPromoDeleteConfirmModal
