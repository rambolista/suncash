import { useCallback, useEffect, useState } from 'react'
import { Card, CardBody } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import { money, formatDateTime } from '@/utils/reportHelpers'
import AmountEditModal from '../components/AmountEditModal'
import LookupAmountTable from '../components/LookupAmountTable'

const TYPE_LABEL = { quickstart: 'Quick Start', full: 'Full', pending: 'Pending', rejected: 'Rejected' }

const COLUMNS = [
  { key: 'type', label: 'Type', render: (value) => TYPE_LABEL[value] || value },
  { key: 'transaction_limit', label: 'Transaction Limit', render: money },
  { key: 'create_date', label: 'Date Created', render: formatDateTime },
  { key: 'update_date', label: 'Date Updated', render: formatDateTime },
]

const TransactionLimitsPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const canEdit = Boolean(getModulePermission(currentUser, '/tools/transaction-limits').can_edit)

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [editTarget, setEditTarget] = useState(null)

  const load = () => {
    setLoading(true)
    ApiService.getTransactionLimits()
      .then((data) => setRows(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load transaction limits.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleEdit = useCallback((row) => setEditTarget({ id: row.id, label: TYPE_LABEL[row.type] || row.type, amount: row.transaction_limit }), [])

  return (
    <>
      <PageBreadcrumb title="Transaction Limits" subtitle="Tools" />

      <Card>
        <CardBody>
          <p className="text-muted small mb-3">Transaction limit per customer verification tier. Edit the amount to change how much customers in that tier can transact.</p>

          {loading ? <LoadingState message="Loading transaction limits..." /> : (
            <LookupAmountTable data={rows} columns={COLUMNS} canEdit={canEdit} onEdit={handleEdit} />
          )}
        </CardBody>
      </Card>

      <AmountEditModal
        show={Boolean(editTarget)}
        onHide={() => setEditTarget(null)}
        row={editTarget}
        title="Update Transaction Limit"
        amountLabel="Transaction limit amount for this customer tier."
        onSubmit={(id, amount) => ApiService.updateTransactionLimit(id, amount)}
        onSaved={() => {
          showNotification({ title: 'Success', message: 'Transaction limit has been updated.', variant: 'success' })
          load()
        }}
      />
    </>
  )
}

export default TransactionLimitsPage
