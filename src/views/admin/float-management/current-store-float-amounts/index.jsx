import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Form, OverlayTrigger, Table, Tooltip } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import AmountPromptModal from '../components/AmountPromptModal'
import CreateStoreFloatAccountModal from './components/CreateStoreFloatAccountModal'

const money = (value) => `BSD ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const statusLabel = (status) => {
  if (!status || status === 'REJECTED') return { text: 'NEED TO SETUP FIRST', className: 'bg-secondary-subtle text-secondary' }
  if (status === 'PENDING') return { text: 'WAITING FOR APPROVAL', className: 'bg-warning-subtle text-warning' }
  return { text: status, className: 'bg-success-subtle text-success' }
}

const ActionButton = ({ label, icon, iconClassName, onClick, disabled }) => (
  <OverlayTrigger placement="top" delay={{ show: 250, hide: 0 }} overlay={<Tooltip>{label}</Tooltip>}>
    <span>
      <Button variant="light" size="sm" className="btn-icon rounded-circle" aria-label={label} onClick={onClick} disabled={disabled}>
        <Icon icon={icon} className={`fs-lg${iconClassName ? ` ${iconClassName}` : ''}`} />
      </Button>
    </span>
  </OverlayTrigger>
)

const CurrentStoreFloatAmountsPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = useMemo(() => getModulePermission(currentUser, '/float-management/current-store-float-amounts'), [currentUser])

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchType, setSearchType] = useState('all')
  const [searchValue, setSearchValue] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [amountAction, setAmountAction] = useState(null) // { type: 'topup'|'request', row }

  const canAdd = Boolean(modulePermission.can_add)
  const canEdit = Boolean(modulePermission.can_edit)

  const load = () => {
    setLoading(true)
    ApiService.getCurrentStoreFloatAmounts(searchType === 'all' ? {} : { search_type: searchType, search_value: searchValue })
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load store float amounts.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSearch = (event) => {
    event.preventDefault()
    load()
  }

  return (
    <>
      <PageBreadcrumb title="Current Store Float Amounts" subtitle="Float Management" />
      <Card>
        <Card.Header className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div>
            <h5 className="mb-1">Current Store Float Amounts</h5>
            <p className="text-muted mb-0 small">Every merchant with a store float account, its balance, and its thresholds.</p>
          </div>
          {canAdd && (
            <Button onClick={() => setShowCreate(true)}><Icon icon="plus" className="me-1" /> Add Store Float Account</Button>
          )}
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSearch} className="mb-3">
            <div className="d-flex flex-wrap align-items-end gap-2">
              <Form.Group>
                <Form.Label className="small text-muted mb-1">Search By</Form.Label>
                <Form.Select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
                  <option value="all">All</option>
                  <option value="merchant_id">Merchant ID</option>
                  <option value="merchant_name">Merchant Name</option>
                </Form.Select>
              </Form.Group>
              {searchType !== 'all' && (
                <Form.Group>
                  <Form.Label className="small text-muted mb-1">Value</Form.Label>
                  <Form.Control type="text" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder="Enter search value" />
                </Form.Group>
              )}
              <button type="submit" className="btn btn-primary">Search</button>
            </div>
          </Form>

          {loading ? (
            <LoadingState />
          ) : (
            <div className="table-responsive">
              <Table className="align-middle mb-0">
                <thead className="thead-sm text-uppercase fs-xxs">
                  <tr>
                    <th>Merchant ID</th>
                    <th>Merchant</th>
                    <th>Minimum</th>
                    <th>Maximum</th>
                    <th>Current Balance</th>
                    <th>Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const label = statusLabel(row.status)
                    const isActive = row.status === 'APPROVED' || row.status === 'CONFIRMED'
                    return (
                      <tr key={row.id}>
                        <td>{row.merchant_id}</td>
                        <td>{row.merchant?.dba_name || row.merchant?.legal_name || '—'}</td>
                        <td>{money(row.minimum_account)}</td>
                        <td>{money(row.maximum_account)}</td>
                        <td>{money(row.amount)}</td>
                        <td><span className={`badge ${label.className} badge-label`}>{label.text}</span></td>
                        <td className="text-end">
                          <div className="d-flex gap-1 justify-content-end">
                            {canEdit && (
                              <ActionButton label="Account Topup" icon="cash-banknote" disabled={!isActive} onClick={() => setAmountAction({ type: 'topup', row })} />
                            )}
                            {canAdd && (
                              <ActionButton label="Request Replenishment" icon="refresh" disabled={!isActive} onClick={() => setAmountAction({ type: 'request', row })} />
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {!rows.length && (
                    <tr><td colSpan={7} className="text-center text-muted py-4">No store float accounts found.</td></tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      <CreateStoreFloatAccountModal show={showCreate} onHide={() => setShowCreate(false)} onSaved={load} />

      <AmountPromptModal
        show={amountAction?.type === 'topup'}
        onHide={() => setAmountAction(null)}
        title="Account Topup"
        helpText={amountAction ? `Immediately credits ${amountAction.row.merchant?.dba_name || amountAction.row.merchant?.legal_name || 'this merchant'}'s store float balance. No approval required.` : ''}
        currentBalance={amountAction?.row?.amount}
        submitLabel="Top Up"
        successMessage="Store float account topped up successfully."
        onSubmit={(amount) => ApiService.topupStoreFloatAccount(amountAction.row.id, amount)}
        onDone={load}
      />
      <AmountPromptModal
        show={amountAction?.type === 'request'}
        onHide={() => setAmountAction(null)}
        title="Request Replenishment"
        helpText={amountAction ? `Submits a replenishment request for ${amountAction.row.merchant?.dba_name || amountAction.row.merchant?.legal_name || 'this merchant'} — needs approval before it credits the balance.` : ''}
        submitLabel="Submit Request"
        successMessage="Replenishment requested successfully."
        onSubmit={(amount) => ApiService.requestStoreFloatReplenishment(amountAction.row.id, amount)}
        onDone={load}
      />
    </>
  )
}

export default CurrentStoreFloatAmountsPage
