import { useEffect, useState } from 'react'
import { Button, Card, CardBody } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import ComplianceTable from './components/ComplianceTable'
import ComplianceEditModal from './components/ComplianceEditModal'
import ComplianceImportModal from './components/ComplianceImportModal'

const CompliancePage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const canEdit = Boolean(getModulePermission(currentUser, '/tools/compliance').can_edit)

  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [editTarget, setEditTarget] = useState(null)
  const [showImport, setShowImport] = useState(false)

  const load = () => {
    setLoading(true)
    ApiService.getComplianceList()
      .then((data) => setEntries(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load blocked list.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (entry) => {
    if (!window.confirm('Are you sure you want to delete this?')) return
    try {
      await ApiService.deleteComplianceEntry(entry.id)
      showNotification({ title: 'Success', message: 'Successfully Deleted.', variant: 'success' })
      load()
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to delete entry.', variant: 'danger' })
    }
  }

  return (
    <>
      <PageBreadcrumb title="Compliance" subtitle="Tools" />
      <Card>
        <CardBody>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Blocked List</h5>
            {canEdit && (
              <Button onClick={() => setShowImport(true)}><Icon icon="upload" className="me-1" /> Import from Excel</Button>
            )}
          </div>

          {loading ? <LoadingState message="Loading blocked list..." /> : (
            <ComplianceTable data={entries} canEdit={canEdit} onEdit={setEditTarget} onDelete={handleDelete} />
          )}
        </CardBody>
      </Card>

      <ComplianceEditModal show={Boolean(editTarget)} onHide={() => setEditTarget(null)} entry={editTarget} onSaved={load} />
      <ComplianceImportModal show={showImport} onHide={() => setShowImport(false)} onImported={load} />
    </>
  )
}

export default CompliancePage
