import { useEffect, useMemo, useState } from 'react'
import { Button, Card } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import MenusTable from './components/MenusTable'
import { useNotificationContext } from '@/context/useNotificationContext'
import { useNavigate } from 'react-router'
import LoadingState from '@/components/LoadingState'

const MenuManagement = () => {
  const currentUser = useCurrentUser()
  const navigate = useNavigate()
  const { showNotification } = useNotificationContext()
  const modulePermission = useMemo(() => getModulePermission(currentUser, '/apps/access-management'), [currentUser])

  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(false)

  const notify = (variant, message) =>
    showNotification({ title: variant === 'success' ? 'Success' : 'Failed', message, variant })

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await ApiService.getAllMenus()
      setMenus(Array.isArray(result) ? result : [])
    } catch (error) {
      notify('danger', error?.message || 'Unable to load menus.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  // Enrich each menu with its parent label for the DataTable
  const tableData = useMemo(
    () => menus.map((m) => ({
      ...m,
      parent_label: menus.find((p) => p.id === m.parent_id)?.label ?? null,
    })),
    [menus]
  )

  const canAddMenu = Boolean(modulePermission.can_add)
  const canEditMenu = Boolean(modulePermission.can_edit)

  const openCreate = () => {
    if (!canAddMenu) return
    navigate('/apps/access-management/menus/new')
  }

  const openEdit = (menu) => {
    if (!canEditMenu) return
    navigate(`/apps/access-management/menus/${menu.id}/edit`)
  }

  return (
    <>
      <PageBreadcrumb title="Menu Management" subtitle="Access Management" />

      <div className="d-flex justify-content-end mb-3 gap-2">
        {canAddMenu && (
          <Button variant="primary" size="sm" onClick={openCreate} disabled={loading}>
            + Add Menu
          </Button>
        )}
      </div>

      <Card>
        <Card.Header>
          <h5 className="mb-0">Menus</h5>
        </Card.Header>
        <Card.Body>
          {loading ? <LoadingState /> : (
            <MenusTable
              data={tableData}
              permissions={{ can_edit: canEditMenu }}
              onEdit={openEdit}
            />
          )}
        </Card.Body>
      </Card>
    </>
  )
}

export default MenuManagement
