import { useEffect, useMemo, useState } from 'react'
import { Button, Card } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import AmountPromptModal from '../components/AmountPromptModal'
import CreateStoreFloatAccountModal from './components/CreateStoreFloatAccountModal'
import CurrentStoreFloatTable from './components/CurrentStoreFloatTable'

const CurrentStoreFloatAmountsPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = useMemo(() => getModulePermission(currentUser, '/float-management/current-store-float-amounts'), [currentUser])

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [amountAction, setAmountAction] = useState(null) // { type: 'topup'|'request', row }

  const canAdd = Boolean(modulePermission.can_add)
  const canEdit = Boolean(modulePermission.can_edit)

  const load = () => {
    setLoading(true)
    ApiService.getCurrentStoreFloatAmounts()
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load store float amounts.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

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
          {loading ? (
            <LoadingState />
          ) : (
            <CurrentStoreFloatTable
              data={rows}
              canEdit={canEdit}
              canAdd={canAdd}
              onTopup={(row) => setAmountAction({ type: 'topup', row })}
              onRequestReplenishment={(row) => setAmountAction({ type: 'request', row })}
            />
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
