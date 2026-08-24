import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { notifyMenuItemsChanged } from '@/utils/menuItems'
import { useNotificationContext } from '@/context/useNotificationContext'
import CustomerMenusTable from './components/CustomerMenusTable'
import CustomerMenuFormModal from './components/CustomerMenuFormModal'
import DeleteCustomerMenuModal from './components/DeleteCustomerMenuModal'

const CustomerMenuManagement = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = useMemo(() => getModulePermission(currentUser, '/apps/access-management/customer-menus'), [currentUser])

  const [menus, setMenus] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [loading, setLoading] = useState(false)

  const notify = useCallback((variant, message) => {
    showNotification({ title: variant === 'success' ? 'Success' : 'Failed', message, variant })
  }, [showNotification])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await ApiService.getAllCustomerMenus()
      setMenus(Array.isArray(result) ? result : [])
    } catch (error) {
      notify('danger', error?.message || 'Unable to load customer menus.')
    } finally {
      setLoading(false)
    }
  }, [notify])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSaveMenu = async (payload) => {
    if (editTarget) {
      const updated = await ApiService.updateCustomerMenu(editTarget.id, payload)
      setMenus((prev) => prev.map((m) => (m.id === editTarget.id ? (updated?.data || updated) : m)))
      notifyMenuItemsChanged()
      notify('success', 'Customer menu updated.')
    } else {
      const created = await ApiService.createCustomerMenu(payload)
      setMenus((prev) => [...prev, created?.data || created])
      notifyMenuItemsChanged()
      notify('success', 'Customer menu created.')
    }
  }

  const handleDeleteMenu = async () => {
    if (!deleteTarget) return

    try {
      await ApiService.deleteCustomerMenu(deleteTarget.id)
      setMenus((prev) => prev.filter((m) => m.id !== deleteTarget.id && m.parent_id !== deleteTarget.id))
      notifyMenuItemsChanged()
      notify('success', `"${deleteTarget.label}" deleted.`)
    } catch (error) {
      notify('danger', error?.message || 'Failed to delete customer menu.')
    } finally {
      setDeleteTarget(null)
    }
  }

  const tableData = useMemo(
    () => menus.map((m) => ({
      ...m,
      parent_label: menus.find((p) => p.id === m.parent_id)?.label ?? null,
    })),
    [menus]
  )

  const canAddMenu = Boolean(currentUser?.super_admin || modulePermission.can_add)
  const canEditMenu = Boolean(currentUser?.super_admin || modulePermission.can_edit)
  const canDeleteMenu = Boolean(currentUser?.super_admin || modulePermission.can_delete)

  const openCreate = () => {
    if (!canAddMenu) return
    setEditTarget(null)
    setShowModal(true)
  }

  const openEdit = (menu) => {
    if (!canEditMenu) return
    setEditTarget(menu)
    setShowModal(true)
  }

  return (
    <>
      <PageBreadcrumb title="Customer Menus" subtitle="Access Management" />

      <div className="d-flex justify-content-end mb-3 gap-2">
        {canAddMenu && (
          <Button variant="primary" size="sm" onClick={openCreate} disabled={loading}>
            + Add Customer Menu
          </Button>
        )}
      </div>

      <Card>
        <Card.Header>
          <h5 className="mb-0">Customer Menus</h5>
        </Card.Header>
        <Card.Body>
          <CustomerMenusTable
            data={tableData}
            permissions={{ can_edit: canEditMenu, can_delete: canDeleteMenu }}
            onEdit={openEdit}
            onDelete={(menu) => setDeleteTarget(menu)}
          />
        </Card.Body>
      </Card>

      {showModal && (
        <CustomerMenuFormModal
          show={showModal}
          onHide={() => setShowModal(false)}
          onSave={handleSaveMenu}
          menus={menus}
          initial={editTarget}
        />
      )}

      <DeleteCustomerMenuModal
        show={!!deleteTarget}
        onHide={() => setDeleteTarget(null)}
        onConfirm={handleDeleteMenu}
        menu={deleteTarget}
      />
    </>
  )
}

export default CustomerMenuManagement
