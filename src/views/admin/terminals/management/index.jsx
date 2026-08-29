import { useEffect, useMemo, useState } from 'react'
import { Button, Card } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import ConfirmActionModal from '../../merchants/components/ConfirmActionModal'
import TerminalsTable from './components/TerminalsTable'
import TerminalFormModal from './components/TerminalFormModal'

const TerminalsManagementPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = useMemo(() => getModulePermission(currentUser, '/terminals/management'), [currentUser])

  const [terminals, setTerminals] = useState([])
  const [deviceTypes, setDeviceTypes] = useState({})
  const [connectionTypes, setConnectionTypes] = useState({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTerminal, setEditingTerminal] = useState(null)
  const [activeConfirm, setActiveConfirm] = useState(null) // { type: 'deactivate'|'activate'|'delete', terminal }

  const canAdd = Boolean(modulePermission.can_add)
  const canEdit = Boolean(modulePermission.can_edit)
  const canDelete = Boolean(modulePermission.can_delete)

  const load = () => {
    setLoading(true)
    ApiService.getTerminalsManagement()
      .then((data) => {
        setTerminals(Array.isArray(data?.terminals) ? data.terminals : [])
        setDeviceTypes(data?.device_types || {})
        setConnectionTypes(data?.connection_types || {})
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load terminals.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditingTerminal(null)
    setShowForm(true)
  }

  const openEdit = (terminal) => {
    setEditingTerminal(terminal)
    setShowForm(true)
  }

  const confirmConfig = {
    deactivate: {
      title: 'Deactivate terminal',
      message: `Are you sure you want to deactivate device "${activeConfirm?.terminal?.device_id}"?`,
      confirmLabel: 'Deactivate',
      confirmVariant: 'warning',
      successMessage: 'Terminal has been deactivated.',
      status: 1,
    },
    activate: {
      title: 'Activate terminal',
      message: `Are you sure you want to activate device "${activeConfirm?.terminal?.device_id}"?`,
      confirmLabel: 'Activate',
      confirmVariant: 'success',
      successMessage: 'Terminal has been activated.',
      status: 0,
    },
    delete: {
      title: 'Delete terminal',
      message: `Are you sure you want to delete device "${activeConfirm?.terminal?.device_id}"? This will remove it from the active terminal list.`,
      confirmLabel: 'Delete',
      confirmVariant: 'danger',
      successMessage: 'Terminal has been deleted.',
      status: 2,
    },
  }
  const activeConfig = activeConfirm ? confirmConfig[activeConfirm.type] : null

  return (
    <>
      <PageBreadcrumb title="Terminals Management" subtitle="Terminals" />
      <Card>
        <Card.Body>
          <div className="d-flex justify-content-end mb-3">
            {canAdd && (
              <Button variant="primary" onClick={openAdd}>
                <Icon icon="plus" className="me-1" /> Add Terminal
              </Button>
            )}
          </div>
          {loading ? (
            <LoadingState />
          ) : (
            <TerminalsTable
              data={terminals}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={openEdit}
              onToggleStatus={(terminal) => setActiveConfirm({ type: terminal.status === 'active' ? 'deactivate' : 'activate', terminal })}
              onDelete={(terminal) => setActiveConfirm({ type: 'delete', terminal })}
            />
          )}
        </Card.Body>
      </Card>

      <TerminalFormModal
        show={showForm}
        onHide={() => setShowForm(false)}
        terminal={editingTerminal}
        deviceTypes={deviceTypes}
        connectionTypes={connectionTypes}
        onSaved={load}
      />

      {activeConfig && (
        <ConfirmActionModal
          show={Boolean(activeConfirm)}
          onHide={() => setActiveConfirm(null)}
          title={activeConfig.title}
          message={activeConfig.message}
          confirmLabel={activeConfig.confirmLabel}
          confirmVariant={activeConfig.confirmVariant}
          successMessage={activeConfig.successMessage}
          onConfirm={() => ApiService.changeTerminalManagementStatus(activeConfirm.terminal.id, activeConfig.status)}
          onDone={load}
        />
      )}
    </>
  )
}

export default TerminalsManagementPage
