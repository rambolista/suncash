import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { Button } from 'react-bootstrap'
import { baseDataTableOptions, resetDataTableContainerSpacing } from '@/views/admin/apps/access-management/utils/dataTableOptions'
import { escapeHtml, formatDateTime } from '@/utils/reportHelpers'

DataTable.use(DT)

const NUMERIC = ['amount', 'fee', 'total']
const DATE = ['timestamp', 'redeemed_date']

/**
 * Detail list for one transaction type (legacy `cl_list_detailed.php` /
 * `cl_list_detailed_voucher.php`). The column set differs per type, so it
 * comes from the API; the Receipt button is a trailing column only for
 * types that can reprint one, and only if the user may print.
 */
const TransactionsDetailTable = ({ columns: apiColumns, data, canReceipt, onReceipt }) => {
  const handlers = useRef({ onReceipt })
  handlers.current = { onReceipt }

  const columns = useMemo(() => {
    const cols = apiColumns.map(({ key }) => {
      if (NUMERIC.includes(key)) {
        return {
          data: key,
          className: 'text-end',
          render: (value, type, row) => (type === 'display'
            ? `<span class="${row.negative && (key !== 'fee' || row.fee_negative) ? 'text-danger' : ''}">${escapeHtml(value)}</span>`
            : Number(String(value).replace(/,/g, '')) || 0),
        }
      }
      if (DATE.includes(key)) return { data: key, className: 'text-nowrap', render: (value, type) => (type === 'display' ? formatDateTime(value) : value || '') }
      return { data: key, render: (value) => escapeHtml(value ?? '—') }
    })
    if (canReceipt) {
      cols.push({ data: 'transaction_id', orderable: false, searchable: false, className: 'text-center', render: () => '<div class="transactions-receipt-slot"></div>' })
    }

    return cols
  }, [apiColumns, canReceipt])

  const options = useMemo(() => ({
    ...baseDataTableOptions,
    pageLength: 25,
    lengthMenu: [10, 25, 50, 100],
    order: [], // keep the server's newest-first order until a column header is clicked
    initComplete: function () {
      resetDataTableContainerSpacing(this.api())
    },
    createdRow: (row, rowData) => {
      if (!canReceipt) return
      const slot = row.querySelector('.transactions-receipt-slot')
      if (!slot || !rowData.receipt_type) return
      const root = slot.__root || createRoot(slot)
      slot.__root = root
      root.render(<Button size="sm" variant="outline-primary" onClick={() => handlers.current.onReceipt(rowData)}>Receipt</Button>)
    },
  }), [canReceipt])

  return (
    <div className="table-responsive">
      <DataTable data={data} columns={columns} options={options} className="table dt-responsive align-middle mb-0 w-100 small">
        <thead className="thead-sm text-uppercase fs-xxs">
          <tr>
            {apiColumns.map(({ key, label }) => <th key={key} className={NUMERIC.includes(key) ? 'text-end' : ''}>{label}</th>)}
            {canReceipt && <th className="text-center">Actions</th>}
          </tr>
        </thead>
      </DataTable>
    </div>
  )
}

export default TransactionsDetailTable
