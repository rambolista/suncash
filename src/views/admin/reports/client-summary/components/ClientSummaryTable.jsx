import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { baseDataTableOptions, initTableSearchAndSort, resetDataTableContainerSpacing } from '@/views/admin/apps/access-management/utils/dataTableOptions'
import DataTableColumnSearchRow from '@/views/admin/apps/access-management/utils/DataTableColumnSearchRow'
import ActionButton from '@/views/admin/merchants/components/ActionButton'
import { escapeHtml, formatDateTime } from '@/utils/reportHelpers'

DataTable.use(DT)

const headers = ['#', 'Client ID', 'User Name', 'Prefund Amount', 'Settlement Amount', 'Status', 'Registration Date', 'Actions']

// Money cells are pre-formatted ("1,234.50"): sort on the number, show the text.
const toNumber = (value) => Number(String(value).replace(/,/g, '')) || 0
const money = (key) => ({ data: key, className: 'text-end', render: (value, type) => (type === 'display' ? escapeHtml(value) : toNumber(value)) })

/** Client list (legacy `client_summary.php`): all columns plus a View action that opens the merchant. */
const ClientSummaryTable = ({ data, canView, onView }) => {
  const handlers = useRef({ onView })
  handlers.current = { onView }

  const columns = useMemo(() => [
    { data: null, orderable: false, searchable: false, render: (v, type, row, meta) => meta.row + 1 },
    { data: 'client_id', render: (value) => escapeHtml(value || '—') },
    { data: 'user_name', render: (value) => escapeHtml(value || '—') },
    money('prefund'),
    money('settlement'),
    {
      data: 'status',
      render: (value, type, row) => (type === 'display'
        ? `<span class="badge ${row.is_active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} badge-label">${escapeHtml((value || '—').toUpperCase())}</span>`
        : value || ''),
    },
    { data: 'creation_date', className: 'text-nowrap', render: (value, type) => (type === 'display' ? formatDateTime(value) : value || '') },
    { data: 'id', orderable: false, searchable: false, className: 'text-center', render: () => '<div class="client-summary-view-slot"></div>' },
  ], [])

  const visibleColumns = canView ? columns : columns.slice(0, -1)
  const visibleHeaders = canView ? headers : headers.slice(0, -1)

  const options = useMemo(() => ({
    ...baseDataTableOptions,
    pageLength: 25,
    order: [], // legacy order (client id) until a header is clicked
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    initComplete: function () {
      initTableSearchAndSort(this.api())
      resetDataTableContainerSpacing(this.api())
    },
    createdRow: (row, rowData) => {
      const slot = row.querySelector('.client-summary-view-slot')
      if (!slot) return
      const root = slot.__root || createRoot(slot)
      slot.__root = root
      root.render(<ActionButton label="View" icon="eye" onClick={() => handlers.current.onView(rowData)} />)
    },
  }), [])

  return (
    <div className="table-responsive">
      <DataTable data={data} columns={visibleColumns} options={options} className="table dt-responsive align-middle mb-0 w-100">
        <thead className="thead-sm text-uppercase fs-xxs">
          <tr>
            {visibleHeaders.map((header) => <th key={header}>{header}</th>)}
          </tr>
          <DataTableColumnSearchRow headers={visibleHeaders} columns={visibleColumns} data={data} />
        </thead>
      </DataTable>
    </div>
  )
}

export default ClientSummaryTable
