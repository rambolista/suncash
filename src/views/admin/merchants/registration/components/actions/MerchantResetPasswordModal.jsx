import { useState } from 'react'
import { Button, Modal } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const MerchantResetPasswordModal = ({ show, onHide, merchant }) => {
  const { showNotification } = useNotificationContext()
  const [submitting, setSubmitting] = useState(false)

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      const result = await ApiService.resetMerchantPassword(merchant.id)
      showNotification({ title: 'Success', message: result?.message || 'Password reset successfully.', variant: 'success' })
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
          This will generate a new password for the portal login of{' '}
          <strong>{merchant?.dba_name || merchant?.legal_name || merchant?.client_id}</strong>{' '}
          and e-mail the new credentials to the merchant's contact address. Continue?
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

export default MerchantResetPasswordModal
