import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, Nav } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import ConfirmActionModal from '../components/ConfirmActionModal'
import MerchantTypeQueueTable from '../components/MerchantTypeQueueTable'
import InitialInfoPage from './components/InitialInfoPage'

const TABS = [
  { key: 'pending', label: 'Pending', icon: 'clock' },
  { key: 'approved', label: 'Approved', icon: 'circle-check' },
  { key: 'rejected', label: 'Rejected', icon: 'circle-x' },
]

const STATUS_BY_TAB = { pending: 'P', approved: 'A', rejected: 'V' }

const triggerDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

const CharityManagementPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = useMemo(() => getModulePermission(currentUser, '/merchants/charity-management'), [currentUser])

  const [tab, setTab] = useState('pending')
  const [rows, setRows] = useState({ pending: [], approved: [], rejected: [] })
  const [loading, setLoading] = useState(true)
  const [confirmAction, setConfirmAction] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [exporting, setExporting] = useState('')

  const canApprove = Boolean(modulePermission.can_approve)
  const canEdit = Boolean(modulePermission.can_edit)

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const { blob, filename } = await ApiService.exportCharities(STATUS_BY_TAB[tab], format)
      triggerDownload(blob, filename)
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || `Failed to export ${format.toUpperCase()}.`, variant: 'danger' })
    } finally {
      setExporting('')
    }
  }

  const load = () => {
    setLoading(true)
    ApiService.getCharities()
      .then((data) => setRows({ pending: data?.pending || [], approved: data?.approved || [], rejected: data?.rejected || [] }))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load charities.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const activeRows = rows[tab] || []

  if (selectedId) {
    return <InitialInfoPage merchantId={selectedId} canEdit={canEdit} onBack={() => { setSelectedId(null); load() }} />
  }

  return (
    <>
      <PageBreadcrumb title="Charity Management" subtitle="Merchants" />
      <Card>
        <Card.Header className="px-3 pt-3 pb-0 bg-body">
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-2">
            <div className="customer-profile-tabs-scroll">
              <Nav variant="tabs" activeKey={tab} onSelect={(key) => key && setTab(key)} className="nav-bordered nav-bordered-primary customer-profile-tabs flex-nowrap">
                {TABS.map((t) => {
                  const isActive = t.key === tab
                  return (
                    <Nav.Item key={t.key}>
                      <Nav.Link eventKey={t.key} className="d-flex align-items-center gap-2">
                        <span className="rounded-circle d-inline-flex align-items-center justify-content-center flex-shrink-0 bg-primary-subtle" style={{ width: 32, height: 32 }}>
                          <Icon icon={t.icon} className="text-primary" style={{ fontSize: '1rem' }} />
                        </span>
                        <span className="fw-semibold text-nowrap">{t.label}</span>
                        <Badge bg={isActive ? 'primary' : 'light'} text={isActive ? undefined : 'dark'} className="rounded-pill">
                          {rows[t.key].length}
                        </Badge>
                      </Nav.Link>
                    </Nav.Item>
                  )
                })}
              </Nav>
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline-secondary" size="sm" disabled={exporting !== ''} onClick={() => handleExport('pdf')}>
                <Icon icon="file-type-pdf" className="me-1" /> {exporting === 'pdf' ? 'Exporting...' : 'Export to PDF'}
              </Button>
              <Button variant="outline-success" size="sm" disabled={exporting !== ''} onClick={() => handleExport('csv')}>
                <Icon icon="file-type-xls" className="me-1" /> {exporting === 'csv' ? 'Exporting...' : 'Export to Excel'}
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <LoadingState />
          ) : (
            <MerchantTypeQueueTable
              key={tab}
              tab={tab}
              data={activeRows}
              canApprove={canApprove}
              canEdit={canEdit}
              onView={(row) => setSelectedId(row.id)}
              onApprove={(row) => setConfirmAction({ type: 'approve', row })}
              onReject={(row) => setConfirmAction({ type: 'reject', row })}
              onActivate={(row) => setConfirmAction({ type: 'activate', row })}
            />
          )}
        </Card.Body>
      </Card>

      <ConfirmActionModal
        show={confirmAction?.type === 'approve'}
        onHide={() => setConfirmAction(null)}
        title="Approve charity"
        message={`This will approve ${confirmAction?.row?.dba_name || 'this charity'}'s registration and create its default branch. Continue?`}
        confirmLabel="Approve"
        confirmVariant="success"
        successMessage="Charity approved successfully."
        onConfirm={() => ApiService.approveCharity(confirmAction.row.id)}
        onDone={load}
      />
      <ConfirmActionModal
        show={confirmAction?.type === 'reject'}
        onHide={() => setConfirmAction(null)}
        title="Reject charity"
        message={`This will reject ${confirmAction?.row?.dba_name || 'this charity'}'s registration. Continue?`}
        confirmLabel="Reject"
        confirmVariant="danger"
        successMessage="Charity rejected successfully."
        onConfirm={() => ApiService.rejectCharity(confirmAction.row.id)}
        onDone={load}
      />
      <ConfirmActionModal
        show={confirmAction?.type === 'activate'}
        onHide={() => setConfirmAction(null)}
        title="Activate charity"
        message={`This will activate ${confirmAction?.row?.dba_name || 'this charity'}'s account so it can log in and process transactions. Continue?`}
        confirmLabel="Activate"
        confirmVariant="success"
        successMessage="Charity activated successfully."
        onConfirm={() => ApiService.toggleMerchantStatus(confirmAction.row.id)}
        onDone={load}
      />
    </>
  )
}

export default CharityManagementPage
