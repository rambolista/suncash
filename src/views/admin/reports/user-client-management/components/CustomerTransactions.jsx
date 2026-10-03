import { useEffect, useMemo, useState } from 'react'
import { Button, Card, CardBody } from 'react-bootstrap'
import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import { baseDataTableOptions, resetDataTableContainerSpacing } from '@/views/admin/apps/access-management/utils/dataTableOptions'
import { escapeHtml } from '@/utils/reportHelpers'

DataTable.use(DT)

const COLUMNS = [
  { data: 'transaction_id', render: (v) => escapeHtml(v ?? '') },
  { data: 'description', render: (v) => escapeHtml(v ?? '') },
  { data: 'cashier', render: (v) => escapeHtml(v ?? '') },
  { data: 'amount', render: (v, t) => (t === 'display' ? escapeHtml(v ?? '') : parseFloat(v) || 0) },
  { data: 'date', className: 'text-nowrap', render: (v) => escapeHtml(v ?? '') },
]

/** Users Profile > Transaction: that customer's transaction history (legacy "Transaction History" page). */
const CustomerTransactions = ({ customer, onBack }) => {
  const { showNotification } = useNotificationContext()
  const [rows, setRows] = useState(null)

  useEffect(() => {
    ApiService.getUserClientCustomerTransactions(customer.id)
      .then((res) => setRows(Array.isArray(res?.data) ? res.data : []))
      .catch((err) => { setRows([]); showNotification({ title: 'Failed', message: err?.message || 'Failed to load the transaction history.', variant: 'danger' }) })
  }, [customer.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const options = useMemo(() => ({
    ...baseDataTableOptions,
    pageLength: 25,
    order: [[4, 'desc']],
    initComplete: function () { resetDataTableContainerSpacing(this.api()) },
  }), [])

  return (
    <Card>
      <CardBody>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0">Transaction History — {customer.name.replace(/\s+/g, ' ').trim()}</h6>
          <Button size="sm" variant="secondary" onClick={onBack}>Back</Button>
        </div>
        {rows === null ? (
          <LoadingState message="Loading transactions..." />
        ) : (
          <div className="table-responsive">
            <DataTable data={rows} columns={COLUMNS} options={options} className="table dt-responsive align-middle mb-0 w-100 small">
              <thead className="thead-sm text-uppercase fs-xxs">
                <tr><th>Transaction ID</th><th>Transaction</th><th>Cashier</th><th>Amount</th><th>Date and Time</th></tr>
              </thead>
            </DataTable>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

export default CustomerTransactions
