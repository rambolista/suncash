import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { Form } from 'react-bootstrap'
import ActionButton from '../../../merchants/components/ActionButton'
import { baseDataTableOptions } from '@/views/admin/apps/access-management/utils/dataTableOptions'
import { bindSortLabels } from '@/views/admin/apps/access-management/utils/dataTableSortLabels'

DataTable.use(DT)

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const textCol = (key) => ({ data: key, render: (value) => escapeHtml(value || '—') })

const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(String(value).replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return escapeHtml(value)
  return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const dateCol = (key) => ({ data: key, render: (value, type) => (type === 'display' ? formatDateTime(value) : value || '') })

const KycUpgradeTable = ({ data, tab, onView, onColumnFilterChange, searchValue, onSearchChange }) => {
  const handlers = useRef({ onView, onColumnFilterChange })
  handlers.current = { onView, onColumnFilterChange }

  const [searchSlot, setSearchSlot] = useState(null)

  const rowMap = useMemo(() => {
    const map = {}
    data.forEach((item) => { map[item.id] = item })
    return map
  }, [data])

  const actionCol = {
    data: 'id',
    orderable: false,
    searchable: false,
    width: '90px',
    className: 'text-nowrap action-cell',
    render: (id) => `<div class="kyc-action-slot" data-id="${id}"></div>`,
  }

  const columns = useMemo(() => {
    const base = [
      dateCol('created_at'),
      textCol('name'),
      textCol('mobile'),
      textCol('email'),
    ]

    if (tab === 'rejected') {
      return [...base, textCol('reason_reject'), dateCol('updated_at'), actionCol]
    }

    return [...base, actionCol]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const headers = useMemo(() => (tab === 'rejected'
    ? ['Account Created', 'Name', 'Mobile', 'Email', 'Reason', 'Date Rejected', 'Action']
    : ['Account Created', 'Name', 'Mobile', 'Email', 'Action']), [tab])

  // null = not filterable (Action has no data).
  const filterKeys = useMemo(() => {
    const base = ['created_at', 'name', 'mobile', 'email']
    if (tab === 'rejected') return [...base, 'reason_reject', 'updated_at', null]
    return [...base, null]
  }, [tab])

  const createdRow = useMemo(() => (row, rowData) => {
    const item = rowMap[rowData.id] ?? rowData
    const slot = row.querySelector('.kyc-action-slot')
    if (!slot) return
    const root = slot.__actionRoot || createRoot(slot)
    slot.__actionRoot = root

    root.render(<ActionButton label="View" icon="eye" onClick={() => handlers.current.onView(item)} />)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowMap, tab])

  const options = useMemo(() => ({
    ...baseDataTableOptions,
    // This table is one server-paginated page — DataTables' own global search
    // box would silently only search the loaded page, so it's disabled in
    // favor of index.jsx's search box and the server-side column filters
    // below (both query every record, not just this page).
    searching: false,
    order: [[0, 'desc']],
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    initComplete: function () {
      bindSortLabels(this.api())

      // Portal our React-controlled search box into DataTables' own top-right
      // slot (next to "entries per page"), instead of a separate row above the table.
      const endSlot = this.api().table().container().querySelector(':scope > .row:first-child .dt-layout-end')
      if (endSlot) setSearchSlot(endSlot)

      // DataTables adopts the thead DOM on init, so these filter inputs are
      // plain/uncontrolled — React's onChange never fires on them. Wire them
      // with vanilla listeners instead (same approach as bindColumnSearchInputs).
      const container = this.api().table().container()
      const stopPropagation = (event) => event.stopPropagation()
      container.querySelectorAll('thead tr.column-search-input-bar th').forEach((th) => {
        th.addEventListener('click', stopPropagation)
      })
      container.querySelectorAll('thead tr.column-search-input-bar input[data-filter-key]').forEach((input) => {
        const key = input.getAttribute('data-filter-key')
        input.addEventListener('click', stopPropagation)
        input.addEventListener('input', () => handlers.current.onColumnFilterChange(key, input.value))
      })
    },
    createdRow,
  }), [createdRow])

  return (
    <div className="table-responsive">
    {searchSlot && createPortal(
      <div style={{ minWidth: 260 }}>
        <Form.Control
          size="sm"
          type="search"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search name, mobile, email, or reason"
        />
        <Form.Text className="text-muted">Searches every record in this tab, not just the loaded page.</Form.Text>
      </div>,
      searchSlot,
    )}
    <DataTable data={data} columns={columns} options={options} className="table dt-responsive align-middle mb-0 w-100">
      <thead className="thead-sm text-uppercase fs-xxs">
        <tr>
          {headers.map((header) => <th key={header}>{header}</th>)}
        </tr>
        <tr className="column-search-input-bar">
          {filterKeys.map((key, index) => (
            <th key={key ?? `no-filter-${index}`} className="pt-0">
              {key && (
                <input
                  type="text"
                  data-filter-key={key}
                  placeholder="Filter…"
                  className="form-control form-control-sm fw-normal"
                />
              )}
            </th>
          ))}
        </tr>
      </thead>
    </DataTable>
    </div>
  )
}

export default KycUpgradeTable
