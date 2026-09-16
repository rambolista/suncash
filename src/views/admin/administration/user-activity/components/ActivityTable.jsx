import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { FormControl } from 'react-bootstrap'
import ActionButton from '../../../merchants/components/ActionButton'
import { baseDataTableOptions, initTableSearchAndSort } from '@/views/admin/apps/access-management/utils/dataTableOptions'

DataTable.use(DT)

const ACTION_BADGE = {
  created: 'bg-success-subtle text-success',
  updated: 'bg-info-subtle text-info',
  deleted: 'bg-danger-subtle text-danger',
  viewed: 'bg-secondary-subtle text-secondary',
  approved: 'bg-success-subtle text-success',
  rejected: 'bg-danger-subtle text-danger',
  blacklisted: 'bg-dark-subtle text-dark',
}

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
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return escapeHtml(value)
  return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const dateCol = { data: 'created_at', render: (value, type) => (type === 'display' ? formatDateTime(value) : value || '') }

const actionCol = {
  data: 'action_label',
  render: (value, type, row) => (type === 'display'
    ? `<span class="badge ${ACTION_BADGE[row.action] || 'bg-secondary-subtle text-secondary'} badge-label">${escapeHtml(value)}</span>`
    : value),
}

const columns = [
  dateCol,
  textCol('actor_name'),
  actionCol,
  textCol('module'),
  textCol('description'),
  textCol('ip_address'),
  textCol('location'),
  {
    data: 'id',
    orderable: false,
    searchable: false,
    width: '70px',
    className: 'text-nowrap action-cell',
    render: (id) => `<div class="activity-action-slot" data-id="${id}"></div>`,
  },
]

const headers = ['Date/Time', 'User', 'Action', 'Module', 'Description', 'IP Address', 'Location', 'Details']

const ActivityTable = ({ data, onView }) => {
  const handlers = useRef({ onView })
  handlers.current = { onView }

  const rowMap = useMemo(() => {
    const map = {}
    data.forEach((item) => { map[item.id] = item })
    return map
  }, [data])

  const createdRow = useMemo(() => (row, rowData) => {
    const item = rowMap[rowData.id] ?? rowData
    const slot = row.querySelector('.activity-action-slot')
    if (!slot) return
    const root = slot.__actionRoot || createRoot(slot)
    slot.__actionRoot = root

    root.render(<ActionButton label="View details" icon="eye" onClick={() => handlers.current.onView(item)} />)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowMap])

  const options = useMemo(() => ({
    ...baseDataTableOptions,
    order: [[0, 'desc']],
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    initComplete: function () {
      initTableSearchAndSort(this.api())
    },
    createdRow,
  }), [createdRow])

  return (
    <div className="table-responsive">
    <DataTable data={data} columns={columns} options={options} className="table dt-responsive align-middle mb-0 w-100">
      <thead className="thead-sm text-uppercase fs-xxs">
        <tr>
          {headers.map((header) => <th key={header}>{header}</th>)}
        </tr>
        <tr className="column-search-input-bar">
          {headers.map((header, index) => (
            <th key={header}>
              {header !== 'Details' && <FormControl size="sm" type="text" placeholder={header} className="bg-light-subtle border-light" data-col-index={index} />}
            </th>
          ))}
        </tr>
      </thead>
    </DataTable>
    </div>
  )
}

export default ActivityTable
