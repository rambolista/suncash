import MerchantRegistrationWizard from '../MerchantRegistrationWizard'
import { useNotificationContext } from '@/context/useNotificationContext'

const MerchantDetailsPanel = ({ merchant, editable, onMerchantChanged }) => {
  const { showNotification } = useNotificationContext()

  const handleSaved = (result) => {
    showNotification({ title: 'Success', message: `Merchant "${result?.client_id}" updated.`, variant: 'success' })
    onMerchantChanged?.()
  }

  return (
    <MerchantRegistrationWizard
      merchantId={merchant.id}
      editable={editable}
      embedded
      onCancel={onMerchantChanged}
      onSaved={handleSaved}
    />
  )
}

export default MerchantDetailsPanel
