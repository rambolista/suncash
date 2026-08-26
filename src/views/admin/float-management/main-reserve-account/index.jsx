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
import AmountPromptModal from '../components/AmountPromptModal'
import { money } from '../components/format'
import MainReserveTable from './components/MainReserveTable'

const TABS = [
  { key: 'pending', label: 'Pending', icon: 'clock' },
  { key: 'approved', label: 'Approved', icon: 'circle-check' },
  { key: 'rejected', label: 'Rejected', icon: 'circle-x' },
]

const MainReserveAccountPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = useMemo(() => getModulePermission(currentUser, '/float-management/main-reserve-account'), [currentUser])

  const [tab, setTab] = useState('pending')
  const [rows, setRows] = useState({ pending: [], approved: [], rejected: [] })
  const [loading, setLoading] = useState(true)
  const [confirmAction, setConfirmAction] = useState(null) // { type: 'approve'|'reject'|'confirm', row }
  const [showTopup, setShowTopup] = useState(false)
  const [showRequest, setShowRequest] = useState(false)

  const canApprove = Boolean(modulePermission.can_approve)
  const canEdit = Boolean(modulePermission.can_edit)
  const canAdd = Boolean(modulePermission.can_add)

  const load = () => {
    setLoading(true)
    ApiService.getMainReserveAccounts()
      .then((data) => setRows({ pending: data?.pending || [], approved: data?.approved || [], rejected: data?.rejected || [] }))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load main reserve account.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const activeRows = rows[tab] || []

  return (
    <>
      <PageBreadcrumb title="Main Reserve Account" subtitle="Float Management" />
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
            <>
              {/* Legacy shows these two actions only on the Approved tab, and only once at least one account has been approved. */}
              {tab === 'approved' && rows.approved.length > 0 && (
                <div className="d-flex justify-content-end gap-2 mb-3">
                  {canEdit && <Button variant="outline-primary" size="sm" onClick={() => setShowTopup(true)}><Icon icon="plus" className="me-1" /> Account Topup</Button>}
                  {canAdd && <Button variant="outline-primary" size="sm" onClick={() => setShowRequest(true)}><Icon icon="cash" className="me-1" /> Request Replenishment</Button>}
                </div>
              )}
              <MainReserveTable
                key={tab}
                tab={tab}
                data={activeRows}
                canApprove={canApprove}
                onApprove={(row) => setConfirmAction({ type: 'approve', row })}
                onReject={(row) => setConfirmAction({ type: 'reject', row })}
                onConfirm={(row) => setConfirmAction({ type: 'confirm', row })}
              />
            </>
          )}
        </Card.Body>
      </Card>

      <ConfirmActionModal
        show={confirmAction?.type === 'approve'}
        onHide={() => setConfirmAction(null)}
        title="Approve reserve account request"
        message="This will approve this main reserve account request. Continue?"
        confirmLabel="Approve"
        confirmVariant="success"
        successMessage="Request approved successfully."
        onConfirm={() => ApiService.approveMainReserveAccount(confirmAction.row.id)}
        onDone={load}
      />
      <ConfirmActionModal
        show={confirmAction?.type === 'reject'}
        onHide={() => setConfirmAction(null)}
        title="Reject reserve account request"
        message="This will reject this main reserve account request. Continue?"
        confirmLabel="Reject"
        confirmVariant="danger"
        successMessage="Request rejected successfully."
        onConfirm={() => ApiService.rejectMainReserveAccount(confirmAction.row.id)}
        onDone={load}
      />
      <ConfirmActionModal
        show={confirmAction?.type === 'confirm'}
        onHide={() => setConfirmAction(null)}
        title="Confirm replenishment"
        message={`This will credit ${confirmAction ? money(confirmAction.row.repl_amount) : ''} into the main reserve account balance. Continue?`}
        confirmLabel="Confirm"
        confirmVariant="success"
        successMessage="Replenishment confirmed successfully."
        onConfirm={() => ApiService.confirmMainReserveAccount(confirmAction.row.id)}
        onDone={load}
      />

      <AmountPromptModal
        show={showTopup}
        onHide={() => setShowTopup(false)}
        title="Top Up Main Reserve Account"
        helpText="Credits the approved main reserve account's running balance directly, up to its maximum threshold."
        currentBalance={rows.approved[0]?.amount}
        submitLabel="Top Up"
        successMessage="Main reserve account topped up successfully."
        onSubmit={(amount) => ApiService.topupMainReserveAccount(amount)}
        onDone={load}
      />
      <AmountPromptModal
        show={showRequest}
        onHide={() => setShowRequest(false)}
        title="Request Replenishment"
        helpText="Submits a new replenishment request, which needs approval before it credits the balance."
        submitLabel="Submit Request"
        successMessage="Replenishment requested successfully."
        onSubmit={(amount) => ApiService.requestMainReserveReplenishment(amount)}
        onDone={load}
      />
    </>
  )
}

export default MainReserveAccountPage
