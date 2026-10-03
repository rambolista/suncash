import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { Button } from 'react-bootstrap'
import { baseDataTableOptions, initTableSearchAndSort, resetDataTableContainerSpacing } from '@/views/admin/apps/access-management/utils/dataTableOptions'
import DataTableColumnSearchRow from '@/views/admin/apps/access-management/utils/DataTableColumnSearchRow'
import { escapeHtml } from '@/utils/reportHelpers'

DataTable.use(DT)

// Values arrive display-formatted ("1,234.50", "10.00 BSD"): sort on the number, show the text.
const NUMERIC = ['balance', 'amount', 'fee', 'count', 'vat', 'total', 'sales', 'commission', 'transaction_count']
const toNumber = (value) => parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0

const NO_IMAGE = '<span class="d-inline-flex align-items-center justify-content-center bg-body-secondary text-muted rounded small" style="width:100px;height:100px">No image</span>'
const image = (src) => (src ? `<img src="${escapeHtml(src)}" width="100" height="100" loading="lazy" style="object-fit:cover" alt="" />` : NO_IMAGE)

/** Columns come from the API (the legacy column set for the tab); Users Profile adds the Transaction action. */
const UserClientTable = ({ columns: apiColumns, data, onTransactions }) => {
  const handlers = useRef({ onTransactions })
  handlers.current = { onTransactions }

  const withAction = Boolean(onTransactions)
  const headers = useMemo(() => [...apiColumns.map((c) => c.label), ...(withAction ? ['Action'] : [])], [apiColumns, withAction])

  const columns = useMemo(() => {
    const cols = apiColumns.map(({ key, type }) => {
      if (type === 'image') return { data: key, orderable: false, searchable: false, className: 'text-center', render: (value, t) => (t === 'display' ? image(value) : '') }
      if (type === 'number' || NUMERIC.includes(key)) return { data: key, render: (value, t) => (t === 'display' ? escapeHtml(value) : toNumber(value)) }
      return { data: key, render: (value) => escapeHtml(value ?? '') }
    })
    if (withAction) cols.push({ data: 'id', orderable: false, searchable: false, className: 'text-center', render: () => '<div class="uc-action-slot"></div>' })

    return cols
  }, [apiColumns, withAction])

  const options = useMemo(() => ({
    ...baseDataTableOptions,
    pageLength: 25,
    order: [], // server order until a header is clicked
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    initComplete: function () {
      initTableSearchAndSort(this.api())
      resetDataTableContainerSpacing(this.api())
    },
    createdRow: (row, rowData) => {
      const slot = row.querySelector('.uc-action-slot')
      if (!slot) return
      const root = slot.__root || createRoot(slot)
      slot.__root = root
      root.render(<Button size="sm" variant="info" onClick={() => handlers.current.onTransactions(rowData)}>Transaction</Button>)
    },
  }), [])

  return (
    <div className="table-responsive">
      <DataTable data={data} columns={columns} options={options} className="table dt-responsive align-middle mb-0 w-100 small">
        <thead className="thead-sm text-uppercase fs-xxs">
          <tr>{headers.map((h, i) => <th key={`${h}-${i}`}>{h}</th>)}</tr>
          <DataTableColumnSearchRow headers={headers} columns={columns} data={data} />
        </thead>
      </DataTable>
    </div>
  )
}

export default UserClientTable
