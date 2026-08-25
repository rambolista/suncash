import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card } from 'react-bootstrap'
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
import MerchantActionsMenu from './components/actions/MerchantActionsMenu'
import MerchantPrincipalInfoModal from './components/actions/MerchantPrincipalInfoModal'
import MerchantResetPasswordModal from './components/actions/MerchantResetPasswordModal'
import MerchantUsersModal from './components/actions/MerchantUsersModal'
import MerchantDeactivateModal from './components/actions/MerchantDeactivateModal'
import MerchantEzpayAccessModal from './components/actions/MerchantEzpayAccessModal'
import MerchantServicesModal from './components/actions/MerchantServicesModal'
import MerchantPrefundModal from './components/actions/MerchantPrefundModal'
import MerchantAutoReplenishModal from './components/actions/MerchantAutoReplenishModal'
import MerchantAgentCommissionModal from './components/actions/MerchantAgentCommissionModal'
import MerchantBranchModal from './components/actions/MerchantBranchModal'
import MerchantTerminalModal from './components/actions/MerchantTerminalModal'
import MerchantPosUsersModal from './components/actions/MerchantPosUsersModal'
import MerchantFloatAccountModal from './components/actions/MerchantFloatAccountModal'

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
  const [view, setView] = useState('list') // 'list' | 'create' | 'edit'
  const [viewMode, setViewMode] = useState(hasIncomingFilter ? 'grid' : 'list') // table layout: 'list' | 'grid'
  const [selectedMerchantId, setSelectedMerchantId] = useState(null)
  const [actionMerchant, setActionMerchant] = useState(null)
  const [activeAction, setActiveAction] = useState(null) // null | 'menu' | 'principal-info' | 'password' | 'users' | 'deactivate' | 'ezpay' | 'services'

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

  const backToList = () => {
    setSelectedMerchantId(null)
    setView('list')
  }

  const openActionsMenu = (merchant) => {
    setActionMerchant(merchant)
    setActiveAction('menu')
  }

  const closeActionModal = () => {
    setActiveAction(null)
    setActionMerchant(null)
  }

  const isActionMerchantActive = String(actionMerchant?.account_status || 'active').toLowerCase() !== 'inactive'

  const handleSaved = (result) => {
    const isEdit = view === 'edit'
    showNotification({
      title: 'Success',
      message: `Merchant "${result?.client_id}" ${isEdit ? 'updated' : 'registered'}.`,
      variant: 'success',
    })
    backToList()
    loadData()
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
          {loading ? (
            <LoadingState />
          ) : (
            <MerchantsTable
              data={merchants}
              viewMode={viewMode}
              permissions={{ can_edit: modulePermission.can_edit }}
              onEdit={openEdit}
              onAction={openActionsMenu}
              initialStatusFilter={initialStatusFilter}
              initialRegistrationFilter={initialRegistrationFilter}
            />
          )}
        </Card.Body>
      </Card>

      <MerchantActionsMenu
        show={activeAction === 'menu'}
        onHide={closeActionModal}
        merchant={actionMerchant}
        isActive={isActionMerchantActive}
        onSelect={(key) => setActiveAction(key)}
      />
      <MerchantPrincipalInfoModal
        show={activeAction === 'principal-info'}
        onHide={closeActionModal}
        merchant={actionMerchant}
      />
      <MerchantResetPasswordModal
        show={activeAction === 'password'}
        onHide={closeActionModal}
        merchant={actionMerchant}
      />
      <MerchantUsersModal
        show={activeAction === 'users'}
        onHide={closeActionModal}
        merchant={actionMerchant}
      />
      <MerchantDeactivateModal
        show={activeAction === 'deactivate'}
        onHide={closeActionModal}
        merchant={actionMerchant}
        isActive={isActionMerchantActive}
        onDone={loadData}
      />
      <MerchantEzpayAccessModal
        show={activeAction === 'ezpay'}
        onHide={closeActionModal}
        merchant={actionMerchant}
      />
      <MerchantServicesModal
        show={activeAction === 'services'}
        onHide={closeActionModal}
        merchant={actionMerchant}
      />
      <MerchantPrefundModal
        show={activeAction === 'prefund'}
        onHide={closeActionModal}
        merchant={actionMerchant}
        onDone={loadData}
      />
      <MerchantAutoReplenishModal
        show={activeAction === 'auto-replenish'}
        onHide={closeActionModal}
        merchant={actionMerchant}
      />
      <MerchantAgentCommissionModal
        show={activeAction === 'agent-commission'}
        onHide={closeActionModal}
        merchant={actionMerchant}
      />
      <MerchantBranchModal
        show={activeAction === 'branch'}
        onHide={closeActionModal}
        merchant={actionMerchant}
      />
      <MerchantTerminalModal
        show={activeAction === 'terminals'}
        onHide={closeActionModal}
        merchant={actionMerchant}
      />
      <MerchantPosUsersModal
        show={activeAction === 'pos-users'}
        onHide={closeActionModal}
        merchant={actionMerchant}
      />
      <MerchantFloatAccountModal
        show={activeAction === 'float-account'}
        onHide={closeActionModal}
        merchant={actionMerchant}
      />
    </>
  )
}

export default MerchantManagementPage
