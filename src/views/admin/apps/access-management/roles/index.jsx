import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import RolesTable from './components/RolesTable'
import RoleFormModal from './components/RoleFormModal'
import MenuPermissionsModal from './components/MenuPermissionsModal'
import DeleteRoleModal from './components/DeleteRoleModal'
import { useNotificationContext } from '@/context/useNotificationContext'

const RolesPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = useMemo(() => getModulePermission(currentUser, '/apps/access-management/roles'), [currentUser])

  const [roles, setRoles] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)

  const [showRoleModal, setShowRoleModal] = useState(false)
  const [editRole, setEditRole] = useState(null)
  const [deleteRole, setDeleteRole] = useState(null)
  const [permRole, setPermRole] = useState(null)
  const [viewMode, setViewMode] = useState('list')

  const notify = useCallback((variant, message) => {
    showNotification({ title: variant === 'success' ? 'Success' : 'Failed', message, variant })
  }, [showNotification])

  const normalizeRole = useCallback((role) => ({
    ...role,
    users_count: Number(role?.users_count ?? 0),
    icon: role?.icon || 'shield',
  }), [])

  const normalizeUser = useCallback((user) => ({
    ...user,
    role_ids: Array.isArray(user?.role_ids) ? user.role_ids.map(Number) : [],
    roles: Array.isArray(user?.roles) ? user.roles : [],
  }), [])

  const loadRoles = useCallback(async () => {
    setLoading(true)
    try {
      const data = await ApiService.getRoles()
      setRoles(Array.isArray(data) ? data.map(normalizeRole) : [])
    } catch (err) {
      notify('danger', err?.message || 'Failed to load roles.')
    } finally {
      setLoading(false)
    }
  }, [normalizeRole, notify])

  const loadUsers = useCallback(async () => {
    try {
      const data = await ApiService.getUsers()
      setUsers(Array.isArray(data) ? data.map(normalizeUser) : [])
    } catch (err) {
      notify('danger', err?.message || 'Failed to load users.')
    }
  }, [normalizeUser, notify])

  useEffect(() => {
    loadRoles()
    loadUsers()
  }, [loadRoles, loadUsers])

  const syncUsersForRole = useCallback((allUsers, roleId, roleName, selectedUserIds) => {
    const selectedSet = new Set((selectedUserIds || []).map(Number))
    return allUsers.map((user) => {
      const hasRole = user.role_ids.includes(roleId)
      const shouldHaveRole = selectedSet.has(user.id)

      if (hasRole === shouldHaveRole) return user

      const nextRoleIds = shouldHaveRole
        ? [...user.role_ids, roleId]
        : user.role_ids.filter((id) => id !== roleId)

      const nextRoles = shouldHaveRole
        ? [...user.roles, { id: roleId, name: roleName }]
        : user.roles.filter((r) => r.id !== roleId)

      return {
        ...user,
        role_ids: nextRoleIds,
        roles: nextRoles,
      }
    })
  }, [])

  const handleSaveRole = async (form) => {
    if (editRole) {
      const updated = await ApiService.updateRole(editRole.id, form)
      const updatedRole = normalizeRole(updated?.data || updated)
      setRoles((prev) => prev.map((r) => r.id === editRole.id ? updatedRole : r))
      setUsers((prev) => syncUsersForRole(prev, editRole.id, updatedRole.name, form.user_ids))
      notify('success', 'Role updated.')
    } else {
      const created = await ApiService.createRole(form)
      const createdRole = normalizeRole(created?.data || created)
      setRoles((prev) => [...prev, createdRole])
      setUsers((prev) => syncUsersForRole(prev, createdRole.id, createdRole.name, form.user_ids))
      notify('success', 'Role created.')
    }
  }

  const handleDeleteRole = async () => {
    if (!deleteRole) return
    try {
      await ApiService.deleteRole(deleteRole.id)
      setRoles((prev) => prev.filter((r) => r.id !== deleteRole.id))
      notify('success', `Role "${deleteRole.name}" deleted.`)
    } catch (err) {
      notify('danger', err?.message || 'Failed to delete role.')
    } finally {
      setDeleteRole(null)
    }
  }

  const canAddRole = Boolean(modulePermission.can_add)
  const canEditRole = Boolean(modulePermission.can_edit)
  const canDeleteRole = Boolean(modulePermission.can_delete)

  const openCreate = () => {
    if (!canAddRole) return
    setEditRole(null)
    setShowRoleModal(true)
  }

  const openEdit = (role) => {
    if (!canEditRole) return
    const userIds = users.filter((u) => u.role_ids.includes(role.id)).map((u) => u.id)
    setEditRole({ ...role, user_ids: userIds })
    setShowRoleModal(true)
  }

  const userOptions = users.map((u) => ({
    value: u.id,
    label: `${u.name} (${u.email})`,
  }))

  const rolesTableData = useMemo(
    () => roles.map((role) => {
      const roleUsers = users.filter((user) => Array.isArray(user.role_ids) && user.role_ids.includes(role.id))
      return {
        ...role,
        role_users: roleUsers,
      }
    }),
    [roles, users]
  )

  return (
    <>
      <PageBreadcrumb title="Roles" subtitle="Access Management" />

      <div className="d-flex justify-content-end mb-3">
        <div role="group" aria-label="Layout toggle button group" className="flex-shrink-0">
          <input
            type="radio"
            className="btn-check"
            name="roles-view-radio"
            id="roles-view-grid"
            checked={viewMode === 'grid'}
            onChange={() => setViewMode('grid')}
          />
          <label className="btn btn-soft-primary btn-icon me-1" htmlFor="roles-view-grid">
            <Icon icon="apps" className="fs-lg" />
          </label>
          <input
            type="radio"
            className="btn-check"
            name="roles-view-radio"
            id="roles-view-list"
            checked={viewMode === 'list'}
            onChange={() => setViewMode('list')}
          />
          <label className="btn btn-soft-primary btn-icon" htmlFor="roles-view-list">
            <Icon icon="list-check" className="fs-lg" />
          </label>
        </div>
      </div>

      <Card>
        <Card.Header className="d-flex align-items-center justify-content-between">
          <h5 className="mb-0">Roles</h5>
          {canAddRole && (
            <Button variant="primary" size="sm" onClick={openCreate}>+ Add Role</Button>
          )}
        </Card.Header>
        <Card.Body>
          <RolesTable
            data={rolesTableData}
            users={users}
            viewMode={viewMode}
            permissions={{ can_edit: canEditRole, can_delete: canDeleteRole }}
            onAccess={(role) => setPermRole(role)}
            onEdit={openEdit}
            onDelete={(role) => setDeleteRole(role)}
          />
        </Card.Body>
      </Card>

      <RoleFormModal
        show={showRoleModal}
        onHide={() => setShowRoleModal(false)}
        onSave={handleSaveRole}
        initial={editRole}
        userOptions={userOptions}
      />

      <MenuPermissionsModal
        show={!!permRole}
        onHide={() => setPermRole(null)}
        role={permRole}
      />

      <DeleteRoleModal
        show={!!deleteRole}
        onHide={() => setDeleteRole(null)}
        onConfirm={handleDeleteRole}
        role={deleteRole}
      />
    </>
  )
}

export default RolesPage
