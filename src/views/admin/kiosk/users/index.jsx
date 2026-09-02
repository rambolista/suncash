import { useEffect, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import ConfirmActionModal from '@/views/admin/merchants/components/ConfirmActionModal'
import UsersTable from './components/UsersTable'
import UserFormModal from './components/UserFormModal'

const KioskUsersPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = getModulePermission(currentUser, '/kiosk/users')
  const canAdd = Boolean(modulePermission.can_add)
  const canEdit = Boolean(modulePermission.can_edit)
  const canDelete = Boolean(modulePermission.can_delete)
  const canExecute = Boolean(modulePermission.can_execute)

  const [users, setUsers] = useState([])
  const [branches, setBranches] = useState([])
  const [branchFilter, setBranchFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState('kiosk')
  const [editingUser, setEditingUser] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [resetTarget, setResetTarget] = useState(null)

  const load = (branch = branchFilter) => {
    setLoading(true)
    ApiService.getKioskUsers(branch || null)
      .then((data) => {
        setUsers(Array.isArray(data?.data) ? data.data : [])
        setBranches(Array.isArray(data?.branches) ? data.branches : [])
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load kiosk users.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleBranchChange = (value) => {
    setBranchFilter(value)
    load(value)
  }

  const openAdd = (type) => {
    setEditingUser(null)
    setFormType(type)
    setShowForm(true)
  }

  const openEdit = (user) => {
    setEditingUser(user)
    setFormType(user.user_type.toLowerCase())
    setShowForm(true)
  }

  return (
    <>
      <PageBreadcrumb title="Users" subtitle="Kiosk" />

      <Card>
        <CardBody>
          <Row className="g-3 align-items-end mb-3">
            <Col md={3}>
              <Form.Label>Branch</Form.Label>
              <Form.Select value={branchFilter} onChange={(e) => handleBranchChange(e.target.value)}>
                <option value="">All Branches</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Form.Select>
            </Col>
            <Col />
            {canAdd && (
              <>
                <Col md="auto">
                  <Button variant="outline-primary" onClick={() => openAdd('admin')}>
                    <Icon icon="shield-lock" className="me-1" /> Add Kiosk Admin User
                  </Button>
                </Col>
                <Col md="auto">
                  <Button variant="primary" onClick={() => openAdd('kiosk')}>
                    <Icon icon="plus" className="me-1" /> Add Kiosk User
                  </Button>
                </Col>
              </>
            )}
          </Row>

          {loading ? <LoadingState message="Loading kiosk users..." /> : (
            <UsersTable
              data={users}
              canEdit={canEdit}
              canDelete={canDelete}
              canExecute={canExecute}
              onEdit={openEdit}
              onDelete={(user) => setDeleteTarget(user)}
              onReset={(user) => setResetTarget(user)}
            />
          )}
        </CardBody>
      </Card>

      <UserFormModal
        show={showForm}
        onHide={() => setShowForm(false)}
        user={editingUser}
        initialType={formType}
        branches={branches}
        onSaved={() => load()}
      />

      <ConfirmActionModal
        show={Boolean(deleteTarget)}
        onHide={() => setDeleteTarget(null)}
        title="Delete Kiosk User"
        message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.username}" (${deleteTarget.email_address})? This cannot be undone.` : ''}
        confirmLabel="Delete"
        confirmVariant="danger"
        successMessage="Kiosk user has been deleted."
        onConfirm={() => ApiService.deleteKioskUser(deleteTarget.id)}
        onDone={() => load()}
      />

      <ConfirmActionModal
        show={Boolean(resetTarget)}
        onHide={() => setResetTarget(null)}
        title="Reset Password"
        message={resetTarget ? `Reset the password for "${resetTarget.username}" (${resetTarget.email_address})? A new password will be emailed to the user.` : ''}
        confirmLabel="Reset"
        confirmVariant="warning"
        successMessage="Password successfully reset. Check your email."
        onConfirm={() => ApiService.resetKioskUserPassword(resetTarget.id)}
        onDone={() => load()}
      />
    </>
  )
}

export default KioskUsersPage
