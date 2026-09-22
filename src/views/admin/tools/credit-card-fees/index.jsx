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
  { key: 'type', label: 'Type' },
  { key: 'value', label: 'Fee', render: money },
  { key: 'creation_date', label: 'Date Created', render: formatDateTime },
  { key: 'modification_date', label: 'Date Updated', render: formatDateTime },
]

const CreditCardFeesPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const canEdit = Boolean(getModulePermission(currentUser, '/tools/credit-card-fees').can_edit)

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [editTarget, setEditTarget] = useState(null)

  const load = () => {
    setLoading(true)
    ApiService.getCreditCardFees()
      .then((data) => setRows(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load credit card fees.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleEdit = useCallback((row) => setEditTarget({ id: row.id, label: row.type, amount: row.value }), [])

  return (
    <>
      <PageBreadcrumb title="Credit Card Fees" subtitle="Tools" />

      <Card>
        <CardBody>
          <p className="text-muted small mb-3">Flat fee charged per credit card processing/transaction type. Edit the amount to change what's charged.</p>

          {loading ? <LoadingState message="Loading credit card fees..." /> : (
            <LookupAmountTable data={rows} columns={COLUMNS} canEdit={canEdit} onEdit={handleEdit} />
          )}
        </CardBody>
      </Card>

      <AmountEditModal
        show={Boolean(editTarget)}
        onHide={() => setEditTarget(null)}
        row={editTarget}
        title="Update Credit Card Fee"
        amountLabel="Flat fee amount charged for this credit card fee type."
        onSubmit={(id, amount) => ApiService.updateCreditCardFee(id, amount)}
        onSaved={() => {
          showNotification({ title: 'Success', message: 'Fee has been updated.', variant: 'success' })
          load()
        }}
      />
    </>
  )
}

export default CreditCardFeesPage
