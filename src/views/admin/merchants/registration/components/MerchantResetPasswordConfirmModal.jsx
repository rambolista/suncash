import { useState } from 'react'
import { Button, Modal } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const MerchantResetPasswordConfirmModal = ({ show, onHide, merchant, onDone }) => {
  const { showNotification } = useNotificationContext()
  const [submitting, setSubmitting] = useState(false)

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      const result = await ApiService.resetMerchantPassword(merchant.id)
      showNotification({ title: 'Success', message: result?.message || 'Password reset successfully.', variant: 'success' })
      onDone?.()
      onHide()
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to reset password.', variant: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Reset password</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-0">
          This will reset <strong>{merchant?.dba_name || merchant?.legal_name || merchant?.client_id}</strong>'s portal password and e-mail new credentials to them. Continue?
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={submitting}>Cancel</Button>
        <Button variant="primary" onClick={handleConfirm} disabled={submitting}>
          {submitting ? 'Resetting...' : 'Reset password'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default MerchantResetPasswordConfirmModal
