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
import CardBlacklistTable from './components/CardBlacklistTable'
import CardBlacklistModal from './components/CardBlacklistModal'

const CardBlacklistPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = getModulePermission(currentUser, '/tools/card-blacklist')
  const canAdd = Boolean(modulePermission.can_add)
  const canEdit = Boolean(modulePermission.can_edit)
  const canExport = Boolean(modulePermission.can_export)

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState('')
  const [modalEntry, setModalEntry] = useState(undefined)
  const [showModal, setShowModal] = useState(false)
  const [toggleTarget, setToggleTarget] = useState(null)

  const load = () => {
    setLoading(true)
    ApiService.getCardBlacklist()
      .then((data) => setRows(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load card blacklist.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openAdd = () => { setModalEntry(null); setShowModal(true) }
  const openEdit = (entry) => { setModalEntry(entry); setShowModal(true) }

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const { blob, filename } = await ApiService.exportCardBlacklist(format)
      downloadBlob(blob, filename)
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || `Failed to export ${format.toUpperCase()}.`, variant: 'danger' })
    } finally {
      setExporting('')
    }
  }

  const activating = toggleTarget?.is_active !== 'Y'

  return (
    <>
      <PageBreadcrumb title="Card Blacklist" subtitle="Tools" />

      <Card className="mb-3">
        <CardBody>
          <div className="d-flex justify-content-between align-items-center">
            <p className="text-muted small mb-0">Debit/Credit Card Blacklist — blocks a card from being linked or used.</p>
            <div className="d-flex gap-2">
              {canAdd && (
                <Button size="sm" variant="primary" onClick={openAdd}>
                  <Icon icon="plus" className="me-1" /> Add Card Blacklist
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
            <CardBlacklistTable data={rows} canEdit={canEdit} onEdit={openEdit} onToggle={setToggleTarget} />
          )}
        </CardBody>
      </Card>

      <CardBlacklistModal
        show={showModal}
        onHide={() => setShowModal(false)}
        entry={modalEntry}
        onSaved={load}
      />

      <ConfirmActionModal
        show={Boolean(toggleTarget)}
        onHide={() => setToggleTarget(null)}
        title={activating ? 'Activate Blacklist' : 'Inactivate Blacklist'}
        message={`Are you sure you want to ${activating ? 'activate' : 'inactivate'} this request?`}
        confirmLabel={activating ? 'Activate' : 'Inactivate'}
        confirmVariant={activating ? 'danger' : 'primary'}
        successMessage="Successfully updated."
        onConfirm={() => (activating
          ? ApiService.activateCardBlacklist(toggleTarget.id)
          : ApiService.inactivateCardBlacklist(toggleTarget.id))}
        onDone={() => load()}
      />
    </>
  )
}

export default CardBlacklistPage
