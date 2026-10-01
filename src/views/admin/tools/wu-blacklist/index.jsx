import { useEffect, useState } from 'react'
import { Button, Card, CardBody } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import { downloadBlob } from '@/utils/reportHelpers'
import ConfirmActionModal from '@/views/admin/merchants/components/ConfirmActionModal'
import WuBlacklistTable from './components/WuBlacklistTable'
import AddBlacklistModal from './components/AddBlacklistModal'

const WuBlacklistPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = getModulePermission(currentUser, '/tools/wu-blacklist')
  const canAdd = Boolean(modulePermission.can_add)
  const canEdit = Boolean(modulePermission.can_edit)
  const canExport = Boolean(modulePermission.can_export)

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [toggleTarget, setToggleTarget] = useState(null)

  const load = () => {
    setLoading(true)
    ApiService.getWuBlacklist()
      .then((data) => setRows(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load WU blacklist.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const { blob, filename } = await ApiService.exportWuBlacklist(format)
      downloadBlob(blob, filename)
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || `Failed to export ${format.toUpperCase()}.`, variant: 'danger' })
    } finally {
      setExporting('')
    }
  }

  const activating = toggleTarget?.status !== 'active'

  return (
    <>
      <PageBreadcrumb title="WU Blacklist" subtitle="Tools" />

      <Card className="mb-3">
        <CardBody>
          <div className="d-flex justify-content-between align-items-center">
            <p className="text-muted small mb-0">Western Union Blacklist — names blocked from Western Union transactions.</p>
            <div className="d-flex gap-2">
              {canAdd && (
                <Button size="sm" variant="primary" onClick={() => setShowAddModal(true)}>
                  <Icon icon="plus" className="me-1" /> Add Blacklisted
                </Button>
              )}
              {canExport && (
                <>
                  <Button size="sm" variant="outline-secondary" disabled={exporting !== ''} onClick={() => handleExport('pdf')}>
                    {exporting === 'pdf' ? 'Exporting...' : 'Export to PDF'}
                  </Button>
                  <Button size="sm" variant="outline-success" disabled={exporting !== ''} onClick={() => handleExport('csv')}>
                    {exporting === 'csv' ? 'Exporting...' : 'Export to Excel'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          {loading ? <LoadingState /> : (
            <WuBlacklistTable data={rows} canEdit={canEdit} onToggle={setToggleTarget} />
          )}
        </CardBody>
      </Card>

      <AddBlacklistModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSaved={() => {
          showNotification({ title: 'Success', message: 'Successfully Blacklisted.', variant: 'success' })
          load()
        }}
      />

      <ConfirmActionModal
        show={Boolean(toggleTarget)}
        onHide={() => setToggleTarget(null)}
        title={activating ? 'Activate Blacklist' : 'Inactivate Blacklist'}
        message={`Are you sure you want to ${activating ? 'activate' : 'inactivate'} this request?`}
        confirmLabel={activating ? 'Activate' : 'Inactivate'}
        confirmVariant={activating ? 'warning' : 'primary'}
        successMessage="Successfully updated."
        onConfirm={() => (activating
          ? ApiService.activateWuBlacklist(toggleTarget.id)
          : ApiService.inactivateWuBlacklist(toggleTarget.id))}
        onDone={() => load()}
      />
    </>
  )
}

export default WuBlacklistPage
