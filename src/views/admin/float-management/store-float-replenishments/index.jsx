import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, Nav, OverlayTrigger, Table, Tooltip } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import ConfirmActionModal from '../components/ConfirmActionModal'

const TABS = [
  { key: 'pending', label: 'Pending', icon: 'clock' },
  { key: 'approved', label: 'Approved', icon: 'circle-check' },
  { key: 'rejected', label: 'Rejected', icon: 'circle-x' },
]

const money = (value) => `BSD ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const merchantName = (row) => row?.merchant?.dba_name || row?.merchant?.legal_name || `Merchant #${row?.merchant_id}`

const ActionButton = ({ label, icon, iconClassName, onClick }) => (
  <OverlayTrigger placement="top" delay={{ show: 250, hide: 0 }} overlay={<Tooltip>{label}</Tooltip>}>
    <Button variant="light" size="sm" className="btn-icon rounded-circle" aria-label={label} onClick={onClick}>
      <Icon icon={icon} className={`fs-lg${iconClassName ? ` ${iconClassName}` : ''}`} />
    </Button>
  </OverlayTrigger>
)

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
            <div className="table-responsive">
              <Table className="align-middle mb-0">
                <thead className="thead-sm text-uppercase fs-xxs">
                  <tr>
                    <th>Created</th>
                    <th>Merchant</th>
                    <th>Amount</th>
                    <th>Created By</th>
                    {tab === 'approved' && (<><th>Approved</th><th>Approved By</th><th>Status</th></>)}
                    {tab === 'rejected' && (<><th>Rejected</th><th>Rejected By</th></>)}
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRows.map((row) => (
                    <tr key={row.id}>
                      <td className="text-nowrap">{row.create_date}</td>
                      <td>{merchantName(row)}</td>
                      <td>{money(row.amount)}</td>
                      <td>{row.create_by}</td>
                      {tab === 'approved' && (
                        <>
                          <td className="text-nowrap">{row.approve_date}</td>
                          <td>{row.approve_by}</td>
                          <td>
                            {row.status === 'CONFIRMED'
                              ? <Badge bg="success-subtle" text="success">CONFIRMED</Badge>
                              : <Badge bg="warning-subtle" text="warning">FOR CONFIRMATION</Badge>}
                          </td>
                        </>
                      )}
                      {tab === 'rejected' && (<><td className="text-nowrap">{row.rejected_date}</td><td>{row.rejected_by}</td></>)}
                      <td className="text-end">
                        <div className="d-flex gap-1 justify-content-end">
                          {tab === 'pending' && canApprove && (
                            <>
                              <ActionButton label="Approve" icon="check" iconClassName="text-success" onClick={() => setConfirmAction({ type: 'approve', row })} />
                              <ActionButton label="Reject" icon="x" iconClassName="text-danger" onClick={() => setConfirmAction({ type: 'reject', row })} />
                            </>
                          )}
                          {tab === 'approved' && row.status !== 'CONFIRMED' && canApprove && (
                            <>
                              <ActionButton label="Confirm" icon="check" iconClassName="text-success" onClick={() => setConfirmAction({ type: 'confirm', row })} />
                              <ActionButton label="Reject" icon="x" iconClassName="text-danger" onClick={() => setConfirmAction({ type: 'reject', row })} />
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!activeRows.length && (
                    <tr><td colSpan={8} className="text-center text-muted py-4">No {tab} records found.</td></tr>
                  )}
                </tbody>
              </Table>
            </div>
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
