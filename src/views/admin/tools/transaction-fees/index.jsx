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

const COLUMNS = [
  { key: 'transaction_type', label: 'Transaction Type' },
  { key: 'transaction_fee', label: 'Transaction Fee', render: money },
  { key: 'create_date', label: 'Date Created', render: formatDateTime },
  { key: 'update_date', label: 'Date Updated', render: formatDateTime },
]

const TransactionFeesPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const canEdit = Boolean(getModulePermission(currentUser, '/tools/transaction-fees').can_edit)

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [editTarget, setEditTarget] = useState(null)

  const load = () => {
    setLoading(true)
    ApiService.getTransactionFees()
      .then((data) => setRows(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load transaction fees.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleEdit = useCallback((row) => setEditTarget({ id: row.id, label: row.transaction_type, amount: row.transaction_fee }), [])

  return (
    <>
      <PageBreadcrumb title="Transaction Fees" subtitle="Tools" />

      <Card>
        <CardBody>
          <p className="text-muted small mb-3">Flat fee charged per transaction type. Edit the amount to change what customers are charged.</p>

          {loading ? <LoadingState message="Loading transaction fees..." /> : (
            <LookupAmountTable data={rows} columns={COLUMNS} canEdit={canEdit} onEdit={handleEdit} />
          )}
        </CardBody>
      </Card>

      <AmountEditModal
        show={Boolean(editTarget)}
        onHide={() => setEditTarget(null)}
        row={editTarget}
        title="Update Transaction Fee"
        amountLabel="Flat fee amount charged for this transaction type."
        onSubmit={(id, amount) => ApiService.updateTransactionFee(id, amount)}
        onSaved={() => {
          showNotification({ title: 'Success', message: 'Transaction fee has been updated.', variant: 'success' })
          load()
        }}
      />
    </>
  )
}

export default TransactionFeesPage
