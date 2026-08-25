import { useState } from 'react'
import { Button, Modal } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const MerchantDeactivateModal = ({ show, onHide, merchant, isActive, onDone }) => {
  const { showNotification } = useNotificationContext()
  const [submitting, setSubmitting] = useState(false)

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      const result = await ApiService.toggleMerchantStatus(merchant.id)
      showNotification({ title: 'Success', message: result?.message || 'Merchant status updated.', variant: 'success' })
      onDone?.()
      onHide()
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to update merchant status.', variant: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{isActive ? 'Deactivate merchant' : 'Activate merchant'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-0">
          {isActive
            ? <>This will suspend <strong>{merchant?.dba_name || merchant?.legal_name || merchant?.client_id}</strong>'s account — they will no longer be able to log in or process transactions. Continue?</>
            : <>This will reinstate <strong>{merchant?.dba_name || merchant?.legal_name || merchant?.client_id}</strong>'s account. Continue?</>}
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={submitting}>Cancel</Button>
        <Button variant={isActive ? 'danger' : 'success'} onClick={handleConfirm} disabled={submitting}>
          {submitting ? 'Saving...' : isActive ? 'Deactivate' : 'Activate'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default MerchantDeactivateModal
