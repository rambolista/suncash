import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Form } from 'react-bootstrap'
import { baseDataTableOptions, initTableSearchAndSort, resetDataTableContainerSpacing } from '@/views/admin/apps/access-management/utils/dataTableOptions'
import { escapeHtml, formatDateTime } from '@/utils/reportHelpers'

DataTable.use(DT)

const textCol = (key) => ({ data: key, render: (value) => escapeHtml(value || '—') })
const dateCol = (key) => ({ data: key, render: (value, type) => (type === 'display' ? formatDateTime(value) : value || '') })

const STATUS_BADGE = (code) => {
  const numeric = Number(code)
  const variant = numeric === 0 ? 'success' : numeric > 0 ? 'danger' : 'secondary'
  return `<span class="badge bg-${variant}-subtle text-${variant} badge-label">${escapeHtml(code)}</span>`
}

/** #-###-###-#### — grouped from the right so an 11-digit number lands exactly on that pattern; other lengths still group sensibly (extra/missing digits only affect the leading group). */
const formatMobile = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (!digits) return '—'

  const last4 = digits.slice(-4)
  const mid3b = digits.slice(-7, -4)
  const mid3a = digits.slice(-10, -7)
  const lead = digits.slice(0, -10)

  return [lead, mid3a, mid3b, last4].filter(Boolean).join('-')
}

const columns = [
  { ...dateCol('timestamp'), width: '110px', className: 'text-nowrap' },
  { data: 'mobile', width: '140px', className: 'text-nowrap font-monospace', render: (value, type) => (type === 'display' ? formatMobile(value) : value || '') },
  { data: 'message', width: 'auto', render: (value, type) => (type === 'display' ? `<div style="min-width:420px; white-space:normal;">${escapeHtml(value || '—')}</div>` : value || '') },
  { data: 'status_code', width: '60px', className: 'text-center', render: (value, type) => (type === 'display' ? STATUS_BADGE(value) : value) },
  { ...textCol('status_desc'), width: '90px' },
]

const headers = ['Timestamp', 'Mobile', 'Message', 'Code', 'Desc']
const headerWidths = ['110px', '140px', 'auto', '60px', '90px']

/** Server-paginated DataTable for SMS Logs — one already-fetched page rendered at a time, same pattern as Merchant Settlements. */
const SmsLogsTable = ({ data, searchValue, onSearchChange }) => {
  const [searchSlot, setSearchSlot] = useState(null)

  const options = {
    ...baseDataTableOptions,
    // Column widths below are explicit (Message wide, everything else tight) —
    // autoWidth would recalculate them off content and override that.
    autoWidth: false,
    // DataTables' own search box would only search the loaded page — disabled in
    // favor of the server-side search box below, which queries every matching row.
    searching: false,
    order: [[0, 'desc']],
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    initComplete: function () {
      initTableSearchAndSort(this.api())
      resetDataTableContainerSpacing(this.api())

      const endSlot = this.api().table().container().querySelector(':scope > .row:first-child .dt-layout-end')
      if (endSlot) setSearchSlot(endSlot)
    },
  }

  return (
    <div className="table-responsive">
      {searchSlot && createPortal(
        <div style={{ minWidth: 260 }}>
          <Form.Control
            size="sm"
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search mobile or message..."
          />
          <Form.Text className="text-muted">Searches every record in range, not just the loaded page.</Form.Text>
        </div>,
        searchSlot,
      )}
      <DataTable data={data} columns={columns} options={options} className="table dt-responsive align-middle mb-0 w-100 small">
        <thead className="thead-sm text-uppercase fs-xxs">
          <tr>
            {headers.map((header, index) => <th key={header} style={{ width: headerWidths[index] }}>{header}</th>)}
          </tr>
        </thead>
      </DataTable>
    </div>
  )
}

export default SmsLogsTable
