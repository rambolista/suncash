import { useEffect, useState } from 'react'
import { Button, Card, CardBody } from 'react-bootstrap'
import { useLocation, useNavigate, useParams } from 'react-router'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import ConfirmActionModal from '@/views/admin/merchants/components/ConfirmActionModal'
import TerminalsTable from './components/TerminalsTable'
import TerminalFormModal from './components/TerminalFormModal'
import CommissionSettingsModal from './components/CommissionSettingsModal'

const KioskTerminalsPage = () => {
  const { branchId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = getModulePermission(currentUser, '/kiosk/management')
  const canAdd = Boolean(modulePermission.can_add)
  const canEdit = Boolean(modulePermission.can_edit)
  const canDelete = Boolean(modulePermission.can_delete)
  const canExecute = Boolean(modulePermission.can_execute)

  const branch = location.state?.branch
  const [terminals, setTerminals] = useState([])
  const [islands, setIslands] = useState([])
  const [managers, setManagers] = useState([])
  const [commissionProfiles, setCommissionProfiles] = useState([])
  const [commissionTypes, setCommissionTypes] = useState({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTerminal, setEditingTerminal] = useState(null)
  const [commissionTarget, setCommissionTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = () => {
    setLoading(true)
    ApiService.getKioskTerminals(branchId)
      .then((data) => {
        setTerminals(Array.isArray(data?.data) ? data.data : [])
        setIslands(Array.isArray(data?.islands) ? data.islands : [])
        setManagers(Array.isArray(data?.managers) ? data.managers : [])
        setCommissionProfiles(Array.isArray(data?.commission_profiles) ? data.commission_profiles : [])
        setCommissionTypes(data?.commission_types || {})
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load kiosk terminals.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [branchId])

  return (
    <>
      <PageBreadcrumb title="Kiosk Terminals" subtitle={branch ? `${branch.name} (${branch.code})` : 'Kiosk Management'} />

      <Card>
        <CardBody>
          <div className="d-flex justify-content-between mb-3">
            <Button variant="outline-secondary" onClick={() => navigate('/kiosk/management')}>
              <Icon icon="arrow-left" className="me-1" /> Back
            </Button>
            {canAdd && (
              <Button variant="primary" onClick={() => { setEditingTerminal(null); setShowForm(true) }}>
                <Icon icon="plus" className="me-1" /> Add Kiosk Terminal
              </Button>
            )}
          </div>

          {loading ? <LoadingState message="Loading kiosk terminals..." /> : (
            <TerminalsTable
              data={terminals}
              canEdit={canEdit}
              canDelete={canDelete}
              canExecute={canExecute}
              onEdit={(terminal) => { setEditingTerminal(terminal); setShowForm(true) }}
              onCommission={(terminal) => setCommissionTarget(terminal)}
              onDelete={(terminal) => setDeleteTarget(terminal)}
            />
          )}
        </CardBody>
      </Card>

      <TerminalFormModal
        show={showForm}
        onHide={() => setShowForm(false)}
        branchId={Number(branchId)}
        terminal={editingTerminal}
        islands={islands}
        managers={managers}
        onSaved={load}
      />

      <CommissionSettingsModal
        show={Boolean(commissionTarget)}
        onHide={() => setCommissionTarget(null)}
        terminal={commissionTarget}
        commissionTypes={commissionTypes}
        commissionProfiles={commissionProfiles}
        onSaved={load}
      />

      <ConfirmActionModal
        show={Boolean(deleteTarget)}
        onHide={() => setDeleteTarget(null)}
        title="Delete Kiosk Terminal"
        message={deleteTarget ? `Are you sure you want to delete terminal "${deleteTarget.name}" (${deleteTarget.code})? This cannot be undone.` : ''}
        confirmLabel="Delete"
        confirmVariant="danger"
        successMessage="Kiosk Terminal has been deleted."
        onConfirm={() => ApiService.deleteKioskTerminal(deleteTarget.id)}
        onDone={load}
      />
    </>
  )
}

export default KioskTerminalsPage
