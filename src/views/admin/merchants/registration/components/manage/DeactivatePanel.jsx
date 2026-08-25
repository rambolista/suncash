import { useState } from 'react'
import { Alert, Button } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const DeactivatePanel = ({ merchant, editable, onMerchantChanged }) => {
  const { showNotification } = useNotificationContext()
  const [submitting, setSubmitting] = useState(false)

  const isActive = String(merchant?.account_status || 'active').toLowerCase() !== 'inactive'

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      const result = await ApiService.toggleMerchantStatus(merchant.id)
      showNotification({ title: 'Success', message: result?.message || 'Merchant status updated.', variant: 'success' })
      onMerchantChanged?.()
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to update merchant status.', variant: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <p className="mb-3">
        {isActive
          ? <>This will suspend <strong>{merchant?.dba_name || merchant?.legal_name || merchant?.client_id}</strong>'s account — they will no longer be able to log in or process transactions.</>
          : <>This will reinstate <strong>{merchant?.dba_name || merchant?.legal_name || merchant?.client_id}</strong>'s account.</>}
      </p>
      {editable ? (
        <Button variant={isActive ? 'danger' : 'success'} onClick={handleConfirm} disabled={submitting}>
          {submitting ? 'Saving...' : isActive ? 'Deactivate' : 'Activate'}
        </Button>
      ) : (
        <Alert variant="secondary" className="mb-0 py-2 small">You don't have permission to change this merchant's account status.</Alert>
      )}
    </div>
  )
}

export default DeactivatePanel
