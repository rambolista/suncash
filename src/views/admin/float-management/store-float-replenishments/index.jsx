import { useEffect, useMemo, useState } from 'react'
import { Badge, Card, Nav } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import ConfirmActionModal from '../components/ConfirmActionModal'
import { money } from '../components/format'
import StoreFloatReplenishmentsTable from './components/StoreFloatReplenishmentsTable'

const TABS = [
  { key: 'pending', label: 'Pending', icon: 'clock' },
  { key: 'approved', label: 'Approved', icon: 'circle-check' },
  { key: 'rejected', label: 'Rejected', icon: 'circle-x' },
]

const merchantName = (row) => row?.merchant?.dba_name || row?.merchant?.legal_name || `Merchant #${row?.merchant_id}`

const StoreFloatReplenishmentsPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = useMemo(() => getModulePermission(currentUser, '/float-management/store-float-replenishments'), [currentUser])

  const [tab, setTab] = useState('pending')
  const [rows, setRows] = useState({ pending: [], approved: [], rejected: [] })
  const [loading, setLoading] = useState(true)
  const [confirmAction, setConfirmAction] = useState(null)

  const canApprove = Boolean(modulePermission.can_approve)

  const load = () => {
    setLoading(true)
    ApiService.getStoreFloatReplenishments()
      .then((data) => setRows({ pending: data?.pending || [], approved: data?.approved || [], rejected: data?.rejected || [] }))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load store float replenishments.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const activeRows = rows[tab] || []

  return (
    <>
      <PageBreadcrumb title="Store Float Replenishments" subtitle="Float Management" />
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
          {loading ? (
            <LoadingState />
          ) : (
            <StoreFloatReplenishmentsTable
              key={tab}
              tab={tab}
              data={activeRows}
              canApprove={canApprove}
              onApprove={(row) => setConfirmAction({ type: 'approve', row })}
              onReject={(row) => setConfirmAction({ type: 'reject', row })}
              onConfirm={(row) => setConfirmAction({ type: 'confirm', row })}
            />
          )}
        </Card.Body>
      </Card>

      <ConfirmActionModal
        show={confirmAction?.type === 'approve'}
        onHide={() => setConfirmAction(null)}
        title="Approve store float replenishment"
        message={`This will approve the ${confirmAction ? money(confirmAction.row.amount) : ''} replenishment request for ${confirmAction ? merchantName(confirmAction.row) : ''}. Continue?`}
        confirmLabel="Approve"
        confirmVariant="success"
        successMessage="Replenishment approved successfully."
        onConfirm={() => ApiService.approveStoreFloatReplenishment(confirmAction.row.id)}
        onDone={load}
      />
      <ConfirmActionModal
        show={confirmAction?.type === 'reject'}
        onHide={() => setConfirmAction(null)}
        title="Reject store float replenishment"
        message={`This will reject the ${confirmAction ? money(confirmAction.row.amount) : ''} replenishment request for ${confirmAction ? merchantName(confirmAction.row) : ''}. Continue?`}
        confirmLabel="Reject"
        confirmVariant="danger"
        successMessage="Replenishment rejected successfully."
        onConfirm={() => ApiService.rejectStoreFloatReplenishment(confirmAction.row.id)}
        onDone={load}
      />
      <ConfirmActionModal
        show={confirmAction?.type === 'confirm'}
        onHide={() => setConfirmAction(null)}
        title="Confirm store float replenishment"
        message={`This will credit ${confirmAction ? money(confirmAction.row.amount) : ''} into ${confirmAction ? merchantName(confirmAction.row) : ''}'s store float balance and debit the main reserve pool. Continue?`}
        confirmLabel="Confirm"
        confirmVariant="success"
        successMessage="Replenishment confirmed successfully."
        onConfirm={() => ApiService.confirmStoreFloatReplenishment(confirmAction.row.id)}
        onDone={load}
      />
    </>
  )
}

export default StoreFloatReplenishmentsPage
