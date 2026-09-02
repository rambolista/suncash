import { useEffect, useState } from 'react'
import { Button, Card, CardBody } from 'react-bootstrap'
import { useNavigate } from 'react-router'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import ConfirmActionModal from '@/views/admin/merchants/components/ConfirmActionModal'
import BranchesTable from './components/BranchesTable'
import AddBranchModal from './components/AddBranchModal'

const KioskManagementPage = () => {
  const currentUser = useCurrentUser()
  const navigate = useNavigate()
  const { showNotification } = useNotificationContext()
  const modulePermission = getModulePermission(currentUser, '/kiosk/management')
  const canAdd = Boolean(modulePermission.can_add)
  const canExecute = Boolean(modulePermission.can_execute)
  const canDelete = Boolean(modulePermission.can_delete)

  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = () => {
    setLoading(true)
    ApiService.getKioskBranches()
      .then((data) => setBranches(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load kiosk branches.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <>
      <PageBreadcrumb title="Kiosk Management" subtitle="Kiosk" />

      <Card>
        <CardBody>
          <div className="d-flex justify-content-end gap-2 mb-3">
            {canExecute && (
              <Button variant="outline-secondary" onClick={() => navigate('/kiosk/management/bank-accounts')}>
                <Icon icon="building-bank" className="me-1" /> Manage Bank Account
              </Button>
            )}
            {canAdd && (
              <Button variant="primary" onClick={() => setShowAdd(true)}>
                <Icon icon="plus" className="me-1" /> Add Kiosk Branch
              </Button>
            )}
          </div>

          {loading ? <LoadingState message="Loading kiosk branches..." /> : (
            <BranchesTable
              data={branches}
              canExecute={canExecute}
              canDelete={canDelete}
              onTerminals={(branch) => navigate(`/kiosk/management/${branch.id}/terminals`, { state: { branch } })}
              onPartners={(branch) => navigate(`/kiosk/management/${branch.id}/partners`, { state: { branch } })}
              onDelete={(branch) => setDeleteTarget(branch)}
            />
          )}
        </CardBody>
      </Card>

      <AddBranchModal show={showAdd} onHide={() => setShowAdd(false)} onSaved={load} />

      <ConfirmActionModal
        show={Boolean(deleteTarget)}
        onHide={() => setDeleteTarget(null)}
        title="Delete Kiosk Branch"
        message={deleteTarget ? `Are you sure you want to delete kiosk branch "${deleteTarget.name}" (${deleteTarget.code})? This cannot be undone.` : ''}
        confirmLabel="Delete"
        confirmVariant="danger"
        successMessage="Kiosk Branch has been deleted."
        onConfirm={() => ApiService.deleteKioskBranch(deleteTarget.id)}
        onDone={load}
      />
    </>
  )
}

export default KioskManagementPage
