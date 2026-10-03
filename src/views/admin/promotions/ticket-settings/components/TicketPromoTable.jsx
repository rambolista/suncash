import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { baseDataTableOptions, initTableSearchAndSort, resetDataTableContainerSpacing } from '@/views/admin/apps/access-management/utils/dataTableOptions'
import DataTableColumnSearchRow from '@/views/admin/apps/access-management/utils/DataTableColumnSearchRow'
import ActionButton from '@/views/admin/merchants/components/ActionButton'
import { escapeHtml } from '@/utils/reportHelpers'

DataTable.use(DT)

const STATUS_BADGE = { ACTIVE: 'bg-success-subtle text-success', USED: 'bg-secondary-subtle text-secondary' }

// The legacy columns, in order: ID … Status, then the Update / Copy actions.
const HEADERS = ['ID', 'Created Date', 'Ticket Count', 'Total Winner', 'Remaining', 'Description', 'Draw Type', 'Promo Type', 'Draw Date', 'Status']

const TicketPromoTable = ({ data, canEdit, canAdd, onEdit, onCopy }) => {
  const handlers = useRef({ onEdit, onCopy })
  handlers.current = { onEdit, onCopy }
  const withActions = canEdit || canAdd

  const rowMap = useMemo(() => Object.fromEntries(data.map((item) => [item.id, item])), [data])

  const columns = useMemo(() => [
    { data: 'id' },
    { data: 'created_date', render: (value) => escapeHtml(value || '') },
    { data: 'ticket_count' },
    { data: 'quantity' },
    { data: 'remaining_quantity' },
    { data: 'description', render: (value) => escapeHtml(value || '') },
    { data: 'draw_type_label' },
    { data: 'promo_type', render: (value) => escapeHtml(value || '') },
    { data: 'draw_date', render: (value) => escapeHtml(value || '') },
    {
      data: 'status',
      render: (value, type) => (type === 'display'
        ? `<span class="badge ${STATUS_BADGE[value] || 'bg-secondary-subtle text-secondary'} badge-label">${escapeHtml(value)}</span>`
        : value),
    },
    ...(withActions ? [{ data: 'id', orderable: false, searchable: false, width: '100px', className: 'text-nowrap action-cell', render: (id) => `<div class="ticket-promo-action-slot" data-id="${id}"></div>` }] : []),
  ], [withActions])

  const createdRow = useMemo(() => (row, rowData) => {
    const slot = row.querySelector('.ticket-promo-action-slot')
    if (!slot) return
    const item = rowMap[rowData.id] ?? rowData
    const root = slot.__actionRoot || createRoot(slot)
    slot.__actionRoot = root
    root.render(
      <>
        {canEdit && <ActionButton label="Update" icon="pencil" onClick={() => handlers.current.onEdit(item)} />}
        {canAdd && <ActionButton label="Copy" icon="copy" onClick={() => handlers.current.onCopy(item)} />}
      </>,
    )
  }, [rowMap, canEdit, canAdd])

  const options = useMemo(() => ({
    ...baseDataTableOptions,
    pageLength: 25,
    order: [], // the server's order (oldest first, as legacy) until a header is clicked
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    initComplete: function () {
      initTableSearchAndSort(this.api())
      resetDataTableContainerSpacing(this.api())
    },
    createdRow,
  }), [createdRow])

  const headers = withActions ? [...HEADERS, 'Action'] : HEADERS

  return (
    <div className="table-responsive">
      <DataTable data={data} columns={columns} options={options} className="table dt-responsive align-middle mb-0 w-100">
        <thead className="thead-sm text-uppercase fs-xxs">
          <tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr>
          <DataTableColumnSearchRow headers={headers} columns={columns} data={data} />
        </thead>
      </DataTable>
    </div>
  )
}

export default TicketPromoTable
