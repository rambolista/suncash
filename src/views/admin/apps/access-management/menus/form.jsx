import { useEffect, useMemo, useState } from 'react'
import { Alert, Button } from 'react-bootstrap'
import { Navigate, useNavigate, useParams } from 'react-router'
import Icon from '@/components/wrappers/Icon'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import ApiService from '@/services/ApiService'
import { notifyMenuItemsChanged } from '@/utils/menuItems'
import { notifyNotificationsChanged } from '@/utils/notifications'
import { useNotificationContext } from '@/context/useNotificationContext'
import MenuForm from './components/MenuForm'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import LoadingState from '@/components/LoadingState'

const MenuFormPage = () => {
  const { menuId } = useParams()
  const currentUser = useCurrentUser()
  const permission = useMemo(
    () => getModulePermission(currentUser, '/apps/access-management'),
    [currentUser]
  )
  const navigate = useNavigate()
  const { showNotification } = useNotificationContext()
  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const initial = useMemo(
    () => menus.find((menu) => String(menu.id) === String(menuId)) || null,
    [menuId, menus]
  )

  useEffect(() => {
    let active = true
    ApiService.getAllMenus()
      .then((data) => {
        if (active) setMenus(Array.isArray(data) ? data : [])
      })
      .catch((requestError) => {
        if (active) setError(requestError?.message || 'Unable to load menu data.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const handleSave = async (payload) => {
    if (menuId) {
      await ApiService.updateMenu(menuId, payload)
    } else {
      await ApiService.createMenu(payload)
    }

    notifyMenuItemsChanged()
    notifyNotificationsChanged()
    showNotification({
      title: 'Success',
      message: menuId ? 'Menu updated.' : 'Menu created.',
      variant: 'success',
    })
    navigate('/apps/access-management')
  }

  if (!currentUser) return <LoadingState />
  if ((menuId && !permission.can_edit) || (!menuId && !permission.can_add)) {
    return <Navigate to="/error/403" replace />
  }

  return (
    <>
      <PageBreadcrumb title={menuId ? 'Edit Menu' : 'Add Menu'} subtitle="Access Management" />
      <Button variant="light" size="sm" className="mb-3" onClick={() => navigate('/apps/access-management')}>
        <Icon icon="arrow-left" className="me-1" /> Back to menu list
      </Button>
      {loading ? (
        <LoadingState />
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : menuId && !initial ? (
        <Alert variant="warning">The selected menu was not found.</Alert>
      ) : (
        <MenuForm
          onCancel={() => navigate('/apps/access-management')}
          onSave={handleSave}
          menus={menus}
          initial={initial}
        />
      )}
    </>
  )
}

export default MenuFormPage
