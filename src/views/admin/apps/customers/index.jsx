import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import CustomersTable from './components/CustomersTable'
import DeleteCustomerModal from './components/DeleteCustomerModal'
import { useNotificationContext } from '@/context/useNotificationContext'
import { useNavigate } from 'react-router'
import LoadingState from '@/components/LoadingState'

const CustomersPage = () => {
  const currentUser = useCurrentUser()
  const navigate = useNavigate()
  const { showNotification } = useNotificationContext()
  const modulePermission = useMemo(() => getModulePermission(currentUser, '/apps/customers'), [currentUser])

  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [deleteCustomer, setDeleteCustomer] = useState(null)
  const [viewMode, setViewMode] = useState('list')

  const notify = useCallback((variant, message) => {
    showNotification({ title: variant === 'success' ? 'Success' : 'Failed', message, variant })
  }, [showNotification])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await ApiService.getCustomers()
      setCustomers(Array.isArray(result) ? result : [])
    } catch (err) {
      notify('danger', err?.message || 'Failed to load customers.')
    } finally {
      setLoading(false)
    }
  }, [notify])

  useEffect(() => { loadData() }, [loadData])

  const handleDeleteCustomer = async () => {
    if (!deleteCustomer) return
    try {
      await ApiService.deleteCustomer(deleteCustomer.id)
      setCustomers((prev) => prev.filter((customer) => customer.id !== deleteCustomer.id))
      notify('success', `Customer "${deleteCustomer.name}" deleted.`)
    } catch (err) {
      notify('danger', err?.message || 'Failed to delete customer.')
    } finally {
      setDeleteCustomer(null)
    }
  }

  const tableData = useMemo(
    () => customers.map((customer) => ({
      ...customer,
      customer_search: `${customer.account_number ?? ''} ${customer.name ?? ''} ${customer.email ?? ''} ${customer.mobile_number ?? ''}`.trim(),
      status: (customer.status ?? 'active').toLowerCase(),
    })),
    [customers]
  )

  const canAddCustomer = Boolean(modulePermission.can_add)
  const canEditCustomer = Boolean(modulePermission.can_edit)
  const canDeleteCustomer = Boolean(modulePermission.can_delete)

  const openCreate = () => {
    if (!canAddCustomer) return
    navigate('/apps/customers/new')
  }

  const openEdit = (customer) => {
    if (!canEditCustomer) return
    navigate(`/apps/customers/${customer.id}/edit`)
  }

  return (
    <>
      <PageBreadcrumb title="Customer List" subtitle="Customers" />

      <div className="d-flex justify-content-end mb-3">
        <div role="group" aria-label="Layout toggle button group" className="flex-shrink-0">
          <input type="radio" className="btn-check" name="customers-view-radio" id="customers-view-grid" checked={viewMode === 'grid'} onChange={() => setViewMode('grid')} />
          <label className="btn btn-soft-primary btn-icon me-1" htmlFor="customers-view-grid"><Icon icon="apps" className="fs-lg" /></label>
          <input type="radio" className="btn-check" name="customers-view-radio" id="customers-view-list" checked={viewMode === 'list'} onChange={() => setViewMode('list')} />
          <label className="btn btn-soft-primary btn-icon" htmlFor="customers-view-list"><Icon icon="list-check" className="fs-lg" /></label>
        </div>
      </div>

      <Card>
        <Card.Header className="d-flex align-items-center justify-content-between">
          <h5 className="mb-0">Customer Management</h5>
          {canAddCustomer && (
            <Button variant="primary" size="sm" onClick={openCreate} disabled={loading}>+ Add Customer</Button>
          )}
        </Card.Header>
        <Card.Body>
          {loading ? <LoadingState /> : (
            <CustomersTable
              data={tableData}
              viewMode={viewMode}
              permissions={{ can_edit: canEditCustomer, can_delete: canDeleteCustomer }}
              onView={(customer) => navigate(`/apps/customers/${customer.id}`)}
              onEdit={openEdit}
              onDelete={(customer) => setDeleteCustomer(customer)}
            />
          )}
        </Card.Body>
      </Card>

      <DeleteCustomerModal
        show={!!deleteCustomer}
        onHide={() => setDeleteCustomer(null)}
        onConfirm={handleDeleteCustomer}
        customer={deleteCustomer}
      />
    </>
  )
}

export default CustomersPage
