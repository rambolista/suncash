import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { Button } from 'react-bootstrap'
import { baseDataTableOptions, resetDataTableContainerSpacing } from '@/views/admin/apps/access-management/utils/dataTableOptions'
import { escapeHtml } from '@/utils/reportHelpers'

DataTable.use(DT)

const HEADERS = ['Transaction Type', 'Count', 'Amount', 'Fee', 'Total Amount', 'Actions']

// Money cells are pre-formatted ("1,234.50"); sort/filter on the number, display the text.
const toNumber = (value) => Number(String(value).replace(/,/g, '')) || 0

const money = (key, redKey) => ({
  data: key,
  className: 'text-end',
  render: (value, type, row) => (type === 'display' ? `<span class="${row[redKey] ? 'text-danger' : ''}">${escapeHtml(value)}</span>` : toNumber(value)),
})

/** Per-type summary (legacy `cl_list.php`): one row per transaction type with a View button into its detail list. */
const TransactionsSummaryTable = ({ data, onView }) => {
  const handlers = useRef({ onView })
  handlers.current = { onView }

  const columns = useMemo(() => [
    { data: 'type', render: (value) => escapeHtml(value) },
    { data: 'count' },
    money('amount', 'negative'),
    money('fee', 'fee_negative'),
    money('total', 'negative'),
    { data: 'key', orderable: false, searchable: false, className: 'text-center', render: () => '<div class="transactions-view-slot"></div>' },
  ], [])

  const options = useMemo(() => ({
    ...baseDataTableOptions,
    pageLength: 10,
    lengthMenu: [10, 25, 50],
    order: [], // keep legacy's row order until a column header is clicked
    initComplete: function () {
      resetDataTableContainerSpacing(this.api())
    },
    createdRow: (row, rowData) => {
      const slot = row.querySelector('.transactions-view-slot')
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
            {HEADERS.map((header, i) => <th key={header} className={i >= 2 && i <= 4 ? 'text-end' : i === 5 ? 'text-center' : ''}>{header}</th>)}
          </tr>
        </thead>
      </DataTable>
    </div>
  )
}

export default TransactionsSummaryTable
