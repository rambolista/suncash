import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { Button } from 'react-bootstrap'
import { baseDataTableOptions, resetDataTableContainerSpacing } from '@/views/admin/apps/access-management/utils/dataTableOptions'
import { escapeHtml, formatDateTime } from '@/utils/reportHelpers'

DataTable.use(DT)

// Amounts arrive pre-formatted ("1,234.5000"): sort on the number, show the text.
const toNumber = (value) => Number(String(value).replace(/,/g, '')) || 0
const amountCol = (key) => ({ data: key, className: 'text-end', render: (value, type) => (type === 'display' ? escapeHtml(value) : toNumber(value)) })

const baseOptions = {
  ...baseDataTableOptions,
  pageLength: 10,
  lengthMenu: [10, 25, 50],
  order: [],
  initComplete: function () { resetDataTableContainerSpacing(this.api()) },
}

/** Per-client summary for the chosen tab and day (legacy `settlement_summary.php`). */
export const SettlementSummaryTable = ({ data, onView }) => {
  const handlers = useRef({ onView })
  handlers.current = { onView }

  const columns = useMemo(() => [
    { data: 'client_id', render: (value) => escapeHtml(value || '—') },
    { data: 'merchant_name', render: (value) => escapeHtml(value || '—') },
    { data: 'count', className: 'text-end' },
    amountCol('amount'),
    { data: 'client_record_id', orderable: false, searchable: false, className: 'text-center', render: () => '<div class="settlement-view-slot"></div>' },
  ], [])

  const options = useMemo(() => ({
    ...baseOptions,
    createdRow: (row, rowData) => {
      const slot = row.querySelector('.settlement-view-slot')
      if (!slot) return
      const root = slot.__root || createRoot(slot)
      slot.__root = root
      root.render(<Button size="sm" variant="primary" onClick={() => handlers.current.onView(rowData)}>View</Button>)
    },
  }), [])

  return (
    <div className="table-responsive">
      <DataTable data={data} columns={columns} options={options} className="table dt-responsive align-middle mb-0 w-100">
        <thead className="thead-sm text-uppercase fs-xxs">
          <tr>
            <th>Merchant ID</th>
            <th>Merchant Name</th>
            <th className="text-end">Number of Transactions</th>
            <th className="text-end">Total Amount</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
      </DataTable>
    </div>
  )
}

/** One transaction list inside the details view (one per settlement type; Revenues has a single list). */
export const SettlementRowsTable = ({ rows }) => {
  const columns = useMemo(() => [
    { data: 'timestamp', className: 'text-nowrap', render: (value, type) => (type === 'display' ? formatDateTime(value) : value || '') },
    { data: 'description', render: (value) => escapeHtml(value || '—') },
    amountCol('amount'),
  ], [])

  return (
    <div className="table-responsive">
      <DataTable data={rows} columns={columns} options={baseOptions} className="table dt-responsive align-middle mb-0 w-100">
        <thead className="thead-sm text-uppercase fs-xxs">
          <tr>
            <th>Date/Time</th>
            <th>Description</th>
            <th className="text-end">Amount</th>
          </tr>
        </thead>
      </DataTable>
    </div>
  )
}
