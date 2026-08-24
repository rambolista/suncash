import { useEffect, useMemo, useState } from 'react'
import { Alert, Button } from 'react-bootstrap'
import { Navigate, useNavigate, useParams } from 'react-router'
import Icon from '@/components/wrappers/Icon'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import CustomerForm from './components/CustomerForm'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import LoadingState from '@/components/LoadingState'

const CustomerFormPage = () => {
  const { customerId } = useParams()
  const currentUser = useCurrentUser()
  const permission = useMemo(
    () => getModulePermission(currentUser, '/apps/customers'),
    [currentUser]
  )
  const navigate = useNavigate()
  const { showNotification } = useNotificationContext()
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(Boolean(customerId))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!customerId) return

    let active = true
    ApiService.getCustomer(customerId)
      .then((data) => {
        if (active) setCustomer(data?.data || data)
      })
      .catch((requestError) => {
        if (active) setError(requestError?.message || 'Unable to load customer.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [customerId])

  const handleSave = async (payload) => {
    if (customerId) {
      await ApiService.updateCustomer(customerId, payload)
    } else {
      await ApiService.createCustomer(payload)
    }

    showNotification({
      title: 'Success',
      message: customerId ? 'Customer updated.' : 'Customer created.',
      variant: 'success',
    })
    navigate('/apps/customers')
  }

  if (!currentUser) return <LoadingState />
  if ((customerId && !permission.can_edit) || (!customerId && !permission.can_add)) {
    return <Navigate to="/error/403" replace />
  }

  return (
    <>
      <PageBreadcrumb title={customerId ? 'Edit Customer' : 'Add Customer'} subtitle="Customers" />
      <Button variant="light" size="sm" className="mb-3" onClick={() => navigate('/apps/customers')}>
        <Icon icon="arrow-left" className="me-1" /> Back to customer list
      </Button>
      {loading ? (
        <LoadingState />
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : customerId && !customer ? (
        <Alert variant="warning">The selected customer was not found.</Alert>
      ) : (
        <CustomerForm
          onCancel={() => navigate('/apps/customers')}
          onSave={handleSave}
          initial={customer}
        />
      )}
    </>
  )
}

export default CustomerFormPage
