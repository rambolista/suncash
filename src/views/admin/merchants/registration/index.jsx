import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card } from 'react-bootstrap'
import { useSearchParams } from 'react-router'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import LoadingState from '@/components/LoadingState'
import MerchantRegistrationWizard from './components/MerchantRegistrationWizard'
import MerchantsTable from './components/MerchantsTable'
import MerchantManagePanel from './components/manage/MerchantManagePanel'
import MerchantDeactivateConfirmModal from './components/MerchantDeactivateConfirmModal'
import MerchantResetPasswordConfirmModal from './components/MerchantResetPasswordConfirmModal'

const MerchantManagementPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = useMemo(() => getModulePermission(currentUser, '/merchants/registration'), [currentUser])

  const [searchParams] = useSearchParams()
  const initialStatusFilter = searchParams.get('status') || 'all'
  const initialRegistrationFilter = searchParams.get('registration') || 'all'
  const hasIncomingFilter = initialStatusFilter !== 'all' || initialRegistrationFilter !== 'all'

  const [merchants, setMerchants] = useState([])
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState('list') // 'list' | 'create' | 'edit' | 'manage'
  const [viewMode, setViewMode] = useState(hasIncomingFilter ? 'grid' : 'list') // table layout: 'list' | 'grid'
  const [selectedMerchantId, setSelectedMerchantId] = useState(null)
  const [manageReadOnly, setManageReadOnly] = useState(false)
  const [deactivateMerchant, setDeactivateMerchant] = useState(null)
  const [resetPasswordMerchant, setResetPasswordMerchant] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await ApiService.getMerchants()
      setMerchants(Array.isArray(result) ? result : [])
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to load merchants.', variant: 'danger' })
    } finally {
      setLoading(false)
    }
  }, [showNotification])

  useEffect(() => { loadData() }, [loadData])

  const canAdd = Boolean(modulePermission.can_add)

  const openCreate = () => {
    setSelectedMerchantId(null)
    setView('create')
  }

  const openEdit = (merchant) => {
    setSelectedMerchantId(merchant.id)
    setView('edit')
  }

  const openManage = (merchant, { readOnly = false } = {}) => {
    setSelectedMerchantId(merchant.id)
    setManageReadOnly(readOnly)
    setView('manage')
  }

  const backToList = () => {
    setSelectedMerchantId(null)
    setView('list')
    loadData()
  }

  const handleSaved = (result) => {
    const isEdit = view === 'edit'
    showNotification({
      title: 'Success',
      message: `Merchant "${result?.client_id}" ${isEdit ? 'updated' : 'registered'}.`,
      variant: 'success',
    })
    backToList()
  }

  if (view === 'create' || view === 'edit') {
    return (
      <>
        <PageBreadcrumb title={view === 'edit' ? 'Edit Merchant' : 'Add Merchant'} subtitle="Merchants" />
        <Button variant="light" size="sm" className="mb-3" onClick={backToList}>
          <Icon icon="arrow-left" className="me-1" /> Back to merchant list
        </Button>
        <MerchantRegistrationWizard
          merchantId={view === 'edit' ? selectedMerchantId : null}
          onCancel={backToList}
          onSaved={handleSaved}
        />
      </>
    )
  }

  if (view === 'manage') {
    return (
      <MerchantManagePanel
        merchantId={selectedMerchantId}
        forceReadOnly={manageReadOnly}
        onBack={backToList}
      />
    )
  }

  return (
    <>
      <PageBreadcrumb title="Merchant Management" subtitle="Merchants" />

      <div className="d-flex justify-content-end mb-3">
        <div role="group" aria-label="Layout toggle button group" className="flex-shrink-0">
          <input type="radio" className="btn-check" name="merchants-view-radio" id="merchants-view-grid" checked={viewMode === 'grid'} onChange={() => setViewMode('grid')} />
          <label className="btn btn-soft-primary btn-icon me-1" htmlFor="merchants-view-grid"><Icon icon="apps" className="fs-lg" /></label>
          <input type="radio" className="btn-check" name="merchants-view-radio" id="merchants-view-list" checked={viewMode === 'list'} onChange={() => setViewMode('list')} />
          <label className="btn btn-soft-primary btn-icon" htmlFor="merchants-view-list"><Icon icon="list-check" className="fs-lg" /></label>
        </div>
      </div>

      <Card>
        <Card.Header className="d-flex align-items-center justify-content-between">
          <div>
            <h5 className="mb-1">Merchant Management</h5>
            <p className="text-muted mb-0 small">Browse registered merchants and manage their business, settlement, and delivery details.</p>
          </div>
          {canAdd && (
            <Button onClick={openCreate} disabled={loading}><Icon icon="plus" className="me-1" /> Add Merchant</Button>
          )}
        </Card.Header>
        <Card.Body>
          <Alert variant="info" className="d-flex align-items-center gap-2 py-2">
            <Icon icon="info-circle" className="flex-shrink-0" />
            <span className="small mb-0">
              Looking for Principal Info, Merchant Prefund, Branch, and other merchant settings? Open the <strong>More actions</strong> (⋮) button on the merchant list instead.
            </span>
          </Alert>
          {loading ? (
            <LoadingState />
          ) : (
            <MerchantsTable
              data={merchants}
              viewMode={viewMode}
              permissions={{ can_edit: modulePermission.can_edit }}
              onEdit={openEdit}
              onView={(merchant) => openManage(merchant, { readOnly: true })}
              onAction={(merchant) => openManage(merchant, { readOnly: false })}
              onToggleStatus={setDeactivateMerchant}
              onResetPassword={setResetPasswordMerchant}
              initialStatusFilter={initialStatusFilter}
              initialRegistrationFilter={initialRegistrationFilter}
            />
          )}
        </Card.Body>
      </Card>

      <MerchantDeactivateConfirmModal
        show={!!deactivateMerchant}
        onHide={() => setDeactivateMerchant(null)}
        merchant={deactivateMerchant}
        onDone={loadData}
      />

      <MerchantResetPasswordConfirmModal
        show={!!resetPasswordMerchant}
        onHide={() => setResetPasswordMerchant(null)}
        merchant={resetPasswordMerchant}
        onDone={loadData}
      />
    </>
  )
}

export default MerchantManagementPage
