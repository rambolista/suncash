import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Form } from 'react-bootstrap'
import { baseDataTableOptions, initTableSearchAndSort, resetDataTableContainerSpacing } from '@/views/admin/apps/access-management/utils/dataTableOptions'
import { escapeHtml, formatDateTime } from '@/utils/reportHelpers'

DataTable.use(DT)

const textCol = (key) => ({ data: key, render: (value) => escapeHtml(value || '—') })
const dateCol = (key) => ({ data: key, render: (value, type) => (type === 'display' ? formatDateTime(value) : value || '') })

const SOURCE_BADGE = (value) => {
  const variant = value === 'PHONE' ? 'info' : value === 'STORE_TO_WALLET' ? 'warning' : 'secondary'
  return `<span class="badge bg-${variant}-subtle text-${variant} badge-label">${escapeHtml(value)}</span>`
}

const TICKET_STATUS_BADGE = (value) => {
  const variant = value === 'EXPIRED' ? 'danger' : 'success'
  return `<span class="badge bg-${variant}-subtle text-${variant} badge-label">${escapeHtml(value)}</span>`
}

const COMPLETED_COLUMNS = [
  { ...dateCol('date_requested'), className: 'text-nowrap' },
  textCol('sender_name'),
  textCol('sender_location'),
  { ...dateCol('date_processed'), className: 'text-nowrap' },
  textCol('bene_name'),
  textCol('bene_location'),
  textCol('cashout_reference'),
  textCol('amount'),
  textCol('fee_amount'),
  textCol('cashier'),
  { data: 'source', render: (value, type) => (type === 'display' ? SOURCE_BADGE(value) : value || '') },
]

const COMPLETED_HEADERS = ['Date Sent', 'Originating Account', 'Location', 'Date Picked Up', 'Destination Account', 'Location', 'Transaction #', 'Amount', 'Fees', 'Cashier', 'Source']

const PENDING_COLUMNS = [
  { ...dateCol('date_requested'), className: 'text-nowrap' },
  { data: 'ticket_status', render: (value, type) => (type === 'display' ? TICKET_STATUS_BADGE(value) : value || '') },
  { ...dateCol('expiration_date'), className: 'text-nowrap' },
  { data: 'days_left', className: 'text-center' },
  textCol('sender_name'),
  textCol('sender_location'),
  textCol('bene_name'),
  textCol('bene_location'),
  textCol('cashout_reference'),
  textCol('amount'),
  textCol('fee_amount'),
  textCol('cashier'),
  { data: 'source', render: (value, type) => (type === 'display' ? SOURCE_BADGE(value) : value || '') },
]

const PENDING_HEADERS = ['Date Sent', 'Ticket Status', 'Expiry Date', 'Days Left', 'Originating Account', 'Location', 'Destination Account', 'Location', 'Transaction #', 'Amount', 'Fees', 'Cashier', 'Source']

/** Server-paginated DataTable for Money Transfer — one already-fetched page rendered at a time, same pattern as SMS Logs. */
const MoneyTransferTable = ({ completed, data, searchValue, onSearchChange }) => {
  const [searchSlot, setSearchSlot] = useState(null)

  const columns = completed ? COMPLETED_COLUMNS : PENDING_COLUMNS
  const headers = completed ? COMPLETED_HEADERS : PENDING_HEADERS

  const options = useMemo(() => ({
    ...baseDataTableOptions,
    searching: false,
    order: [[0, 'desc']],
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    initComplete: function () {
      initTableSearchAndSort(this.api())
      resetDataTableContainerSpacing(this.api())

      const endSlot = this.api().table().container().querySelector(':scope > .row:first-child .dt-layout-end')
      if (endSlot) setSearchSlot(endSlot)
    },
  }), [])

  return (
    <div className="table-responsive">
      {searchSlot && createPortal(
        <div style={{ minWidth: 260 }}>
          <Form.Control
            size="sm"
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search sender, beneficiary or transaction #..."
          />
          <Form.Text className="text-muted">Searches every record in range, not just the loaded page.</Form.Text>
        </div>,
        searchSlot,
      )}
      <DataTable key={completed ? 'completed' : 'pending'} data={data} columns={columns} options={options} className="table dt-responsive align-middle mb-0 w-100 small">
        <thead className="thead-sm text-uppercase fs-xxs">
          <tr>
            {headers.map((header, i) => <th key={i}>{header}</th>)}
          </tr>
        </thead>
      </DataTable>
    </div>
  )
}

export default MoneyTransferTable
