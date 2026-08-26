import { useEffect, useMemo, useState } from 'react'
import { Alert, Badge, Button, Card, Nav } from 'react-bootstrap'
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
import MerchantResetPasswordConfirmModal from '../registration/components/MerchantResetPasswordConfirmModal'
import ServicesPermissionModal from './components/ServicesPermissionModal'
import EzpayAccessModal from './components/EzpayAccessModal'
import LinkedCardsModal from './components/LinkedCardsModal'
import NumericFieldModal from './components/NumericFieldModal'
import AuthorizedAuthModal from './components/AuthorizedAuthModal'
import VoucherSettingModal from './components/VoucherSettingModal'

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

const BusinessManagementPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = useMemo(() => getModulePermission(currentUser, '/merchants/business-management'), [currentUser])

  const [tab, setTab] = useState('pending')
  const [rows, setRows] = useState({ pending: [], approved: [], rejected: [] })
  const [loading, setLoading] = useState(true)
  const [confirmAction, setConfirmAction] = useState(null) // { type: 'approve'|'reject'|'activate', row }
  const [selectedId, setSelectedId] = useState(null)
  const [exporting, setExporting] = useState('')
  const [settingsModal, setSettingsModal] = useState(null) // { type, row }

  const canApprove = Boolean(modulePermission.can_approve)
  const canEdit = Boolean(modulePermission.can_edit)

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const { blob, filename } = await ApiService.exportBusinesses(STATUS_BY_TAB[tab], format)
      triggerDownload(blob, filename)
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || `Failed to export ${format.toUpperCase()}.`, variant: 'danger' })
    } finally {
      setExporting('')
    }
  }

  const load = () => {
    setLoading(true)
    ApiService.getBusinesses()
      .then((data) => setRows({ pending: data?.pending || [], approved: data?.approved || [], rejected: data?.rejected || [] }))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load businesses.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const activeRows = rows[tab] || []

  if (selectedId) {
    return <InitialInfoPage merchantId={selectedId} canEdit={canEdit} onBack={() => { setSelectedId(null); load() }} />
  }

  return (
    <>
      <PageBreadcrumb title="Business Management" subtitle="Merchants" />
      <Card>
        <Card.Header className="px-3 pt-3 pb-0 bg-body">
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
        </Card.Header>
        <Card.Body>
          {tab === 'approved' && (
            <Alert variant="info" className="d-flex align-items-center gap-2 py-2">
              <Icon icon="info-circle" className="flex-shrink-0" />
              <span className="small mb-0">
                Looking for password reset, services permission, Smartpay permission, credit/debit card, or other merchant settings? Open the <strong>More actions</strong> (⋮) button on the list instead.
              </span>
            </Alert>
          )}
          <div className="d-flex justify-content-end gap-2 mb-3">
            <Button variant="outline-secondary" size="sm" disabled={exporting !== ''} onClick={() => handleExport('pdf')}>
              <Icon icon="file-type-pdf" className="me-1" /> {exporting === 'pdf' ? 'Exporting...' : 'Export to PDF'}
            </Button>
            <Button variant="outline-success" size="sm" disabled={exporting !== ''} onClick={() => handleExport('csv')}>
              <Icon icon="file-type-xls" className="me-1" /> {exporting === 'csv' ? 'Exporting...' : 'Export to Excel'}
            </Button>
          </div>
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
              businessActions={canEdit ? {
                onResetPassword: (row) => setSettingsModal({ type: 'password', row }),
                onServicesPermission: (row) => setSettingsModal({ type: 'services', row }),
                onSmartpayAccess: (row) => setSettingsModal({ type: 'ezpay', row }),
                onLinkedCards: (row) => setSettingsModal({ type: 'cards', row }),
                onCardHoldSettings: (row) => setSettingsModal({ type: 'cardHold', row }),
                onTransactionFee: (row) => setSettingsModal({ type: 'txnFee', row }),
                onAuthorizedAuth: (row) => setSettingsModal({ type: 'auth', row }),
                onGcFee: (row) => setSettingsModal({ type: 'gcFee', row }),
                onVoucherSetting: (row) => setSettingsModal({ type: 'voucher', row }),
              } : undefined}
            />
          )}
        </Card.Body>
      </Card>

      <ConfirmActionModal
        show={confirmAction?.type === 'approve'}
        onHide={() => setConfirmAction(null)}
        title="Approve business"
        message={`This will approve ${confirmAction?.row?.dba_name || 'this business'}'s registration and create its default branch. Continue?`}
        confirmLabel="Approve"
        confirmVariant="success"
        successMessage="Business approved successfully."
        onConfirm={() => ApiService.approveBusiness(confirmAction.row.id)}
        onDone={load}
      />
      <ConfirmActionModal
        show={confirmAction?.type === 'reject'}
        onHide={() => setConfirmAction(null)}
        title="Reject business"
        message={`This will reject ${confirmAction?.row?.dba_name || 'this business'}'s registration. Continue?`}
        confirmLabel="Reject"
        confirmVariant="danger"
        successMessage="Business rejected successfully."
        onConfirm={() => ApiService.rejectBusiness(confirmAction.row.id)}
        onDone={load}
      />
      <ConfirmActionModal
        show={confirmAction?.type === 'activate'}
        onHide={() => setConfirmAction(null)}
        title="Activate business"
        message={`This will activate ${confirmAction?.row?.dba_name || 'this business'}'s account so it can log in and process transactions. Continue?`}
        confirmLabel="Activate"
        confirmVariant="success"
        successMessage="Business activated successfully."
        onConfirm={() => ApiService.activateBusiness(confirmAction.row.id)}
        onDone={load}
      />

      <MerchantResetPasswordConfirmModal
        show={settingsModal?.type === 'password'}
        onHide={() => setSettingsModal(null)}
        merchant={settingsModal?.row}
      />
      <ServicesPermissionModal
        show={settingsModal?.type === 'services'}
        onHide={() => setSettingsModal(null)}
        merchant={settingsModal?.row}
        editable={canEdit}
      />
      <EzpayAccessModal
        show={settingsModal?.type === 'ezpay'}
        onHide={() => setSettingsModal(null)}
        merchant={settingsModal?.row}
        editable={canEdit}
      />
      <LinkedCardsModal
        show={settingsModal?.type === 'cards'}
        onHide={() => setSettingsModal(null)}
        merchant={settingsModal?.row}
      />
      <NumericFieldModal
        show={settingsModal?.type === 'cardHold'}
        onHide={() => setSettingsModal(null)}
        title="Card Hold Settings"
        label="Card Hold Days"
        suffix="days"
        step="1"
        errorKey="card_hold_days"
        initialValue={settingsModal?.row?.card_hold_days}
        successMessage="Card hold settings updated successfully."
        onSubmit={(value) => ApiService.updateBusinessCardHoldSettings(settingsModal.row.id, value)}
        onDone={load}
      />
      <NumericFieldModal
        show={settingsModal?.type === 'txnFee'}
        onHide={() => setSettingsModal(null)}
        title="Suncash Transaction Fee"
        label="Suncash Transaction Fee"
        suffix="%"
        max={100}
        errorKey="suncash_transaction_fee"
        initialValue={settingsModal?.row?.suncash_transaction_fee}
        successMessage="Suncash transaction fee updated successfully."
        onSubmit={(value) => ApiService.updateBusinessTransactionFee(settingsModal.row.id, value)}
        onDone={load}
      />
      <AuthorizedAuthModal
        show={settingsModal?.type === 'auth'}
        onHide={() => setSettingsModal(null)}
        merchant={settingsModal?.row}
        onDone={load}
      />
      <NumericFieldModal
        show={settingsModal?.type === 'gcFee'}
        onHide={() => setSettingsModal(null)}
        title="GC Fee"
        label="GC Fee"
        suffix="%"
        max={100}
        errorKey="gc_fee"
        initialValue={settingsModal?.row?.gc_fee}
        successMessage="GC fee updated successfully."
        onSubmit={(value) => ApiService.updateBusinessGcFee(settingsModal.row.id, value)}
        onDone={load}
      />
      <VoucherSettingModal
        show={settingsModal?.type === 'voucher'}
        onHide={() => setSettingsModal(null)}
        merchant={settingsModal?.row}
      />
    </>
  )
}

export default BusinessManagementPage
