import { useState } from 'react'
import { Alert, Button } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const PasswordPanel = ({ merchant, editable }) => {
  const { showNotification } = useNotificationContext()
  const [submitting, setSubmitting] = useState(false)

  const handleReset = async () => {
    setSubmitting(true)
    try {
      const result = await ApiService.resetMerchantPassword(merchant.id)
      showNotification({ title: 'Success', message: result?.message || 'Password reset successfully.', variant: 'success' })
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to reset password.', variant: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <p className="mb-3">
        This will generate a new password for the portal login of{' '}
        <strong>{merchant?.dba_name || merchant?.legal_name || merchant?.client_id}</strong>{' '}
        and e-mail the new credentials to the merchant's contact address.
      </p>
      {editable ? (
        <Button variant="primary" onClick={handleReset} disabled={submitting}>
          {submitting ? 'Resetting...' : 'Reset password'}
        </Button>
      ) : (
        <Alert variant="secondary" className="mb-0 py-2 small">You don't have permission to reset this merchant's password.</Alert>
      )}
    </div>
  )
}

export default PasswordPanel
