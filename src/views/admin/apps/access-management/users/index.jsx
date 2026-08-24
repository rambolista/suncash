import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getStoredCurrentUser, setStoredCurrentUser } from '@/utils/currentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import UsersTable from './components/UsersTable'
import UserFormModal from './components/UserFormModal'
import DeleteUserModal from './components/DeleteUserModal'
import { useNotificationContext } from '@/context/useNotificationContext'

const UsersPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = useMemo(() => getModulePermission(currentUser, '/apps/access-management/users'), [currentUser])

  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(false)

  const [showUserModal, setShowUserModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [deleteUser, setDeleteUser] = useState(null)
  const [viewMode, setViewMode] = useState('list')

  const notify = useCallback((variant, message) => {
    showNotification({ title: variant === 'success' ? 'Success' : 'Failed', message, variant })
  }, [showNotification])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [usersData, rolesData] = await Promise.all([
        ApiService.getUsers(),
        ApiService.getRoles(),
      ])
      setUsers(Array.isArray(usersData) ? usersData : [])
      setRoles(Array.isArray(rolesData) ? rolesData : [])
    } catch (err) {
      notify('danger', err?.message || 'Failed to load users.')
    } finally {
      setLoading(false)
    }
  }, [notify])

  useEffect(() => { loadData() }, [loadData])

  const handleSaveUser = async (form) => {
    if (editUser) {
      const updated = await ApiService.updateUser(editUser.id, form)
      const normalizedUser = updated?.data || updated
      setUsers((prev) => prev.map((u) => u.id === editUser.id ? normalizedUser : u))
      if (String(getStoredCurrentUser()?.id) === String(normalizedUser?.id)) {
        const currentStoredUser = getStoredCurrentUser()
        setStoredCurrentUser({
          ...normalizedUser,
          menu_permissions: currentStoredUser?.menu_permissions ?? normalizedUser?.menu_permissions,
          accessible_menu_ids: currentStoredUser?.accessible_menu_ids ?? normalizedUser?.accessible_menu_ids,
        })
      }
      notify('success', 'User updated.')
    } else {
      const created = await ApiService.createUser(form)
      setUsers((prev) => [...prev, created?.data || created])
      notify('success', 'User created.')
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteUser) return
    try {
      await ApiService.deleteUser(deleteUser.id)
      setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id))
      notify('success', `User "${deleteUser.name}" deleted.`)
    } catch (err) {
      notify('danger', err?.message || 'Failed to delete user.')
    } finally {
      setDeleteUser(null)
    }
  }

  // Add roles_search (plain text) so DataTables can search through role names
  const tableData = useMemo(
    () => users.map((u) => ({
      ...u,
      name: u.name || [u.first_name, u.middle_name, u.last_name].filter(Boolean).join(' ').trim(),
      user_search: `${u.name ?? ''} ${u.first_name ?? ''} ${u.middle_name ?? ''} ${u.last_name ?? ''} ${u.email ?? ''}`.trim(),
      roles_search: u.roles?.map((r) => r.name).join(', ') ?? 'No roles',
      status: (u.status ?? 'active').toLowerCase(),
    })),
    [users]
  )

  const canAddUser = Boolean(modulePermission.can_add)
  const canEditUser = Boolean(modulePermission.can_edit)
  const canDeleteUser = Boolean(modulePermission.can_delete)

  const openCreate = () => {
    if (!canAddUser) return
    setEditUser(null)
    setShowUserModal(true)
  }

  const openEdit = (user) => {
    if (!canEditUser) return
    setEditUser(user)
    setShowUserModal(true)
  }

  return (
    <>
      <PageBreadcrumb title="Users" subtitle="Access Management" />

      <div className="d-flex justify-content-end mb-3">
        <div role="group" aria-label="Layout toggle button group" className="flex-shrink-0">
          <input
            type="radio"
            className="btn-check"
            name="users-view-radio"
            id="users-view-grid"
            checked={viewMode === 'grid'}
            onChange={() => setViewMode('grid')}
          />
          <label className="btn btn-soft-primary btn-icon me-1" htmlFor="users-view-grid">
            <Icon icon="apps" className="fs-lg" />
          </label>
          <input
            type="radio"
            className="btn-check"
            name="users-view-radio"
            id="users-view-list"
            checked={viewMode === 'list'}
            onChange={() => setViewMode('list')}
          />
          <label className="btn btn-soft-primary btn-icon" htmlFor="users-view-list">
            <Icon icon="list-check" className="fs-lg" />
          </label>
        </div>
      </div>

      <Card>
        <Card.Header className="d-flex align-items-center justify-content-between">
          <h5 className="mb-0">User Management</h5>
          {canAddUser && (
            <Button variant="primary" size="sm" onClick={openCreate}>+ Add User</Button>
          )}
        </Card.Header>
        <Card.Body>
          <UsersTable
            data={tableData}
            viewMode={viewMode}
            permissions={{ can_edit: canEditUser, can_delete: canDeleteUser }}
            onEdit={openEdit}
            onDelete={(user) => setDeleteUser(user)}
          />
        </Card.Body>
      </Card>

      <UserFormModal
        show={showUserModal}
        onHide={() => setShowUserModal(false)}
        onSave={handleSaveUser}
        roles={roles}
        initial={editUser}
      />

      <DeleteUserModal
        show={!!deleteUser}
        onHide={() => setDeleteUser(null)}
        onConfirm={handleDeleteUser}
        user={deleteUser}
      />
    </>
  )
}

export default UsersPage
