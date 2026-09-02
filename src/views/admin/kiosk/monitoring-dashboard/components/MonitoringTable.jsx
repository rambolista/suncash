import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { bindSortLabels } from '@/views/admin/apps/access-management/utils/dataTableSortLabels'
import { paginationIcons } from '@/views/admin/apps/access-management/utils/paginationIcons'
import ActionButton from '../../../merchants/components/ActionButton'
import { escapeHtml, formatDateTime, money } from './format'

DataTable.use(DT)

const textCol = (key) => ({ data: key, render: (value) => escapeHtml(value || '—') })
const dateCol = (key) => ({ data: key, render: (value, type) => (type === 'display' ? formatDateTime(value) : value || '') })

const componentBadgeHtml = (value) => {
  if (!value) return '<span class="text-muted">—</span>'
  const variant = value === 'OK' ? 'success' : 'danger'
  return `<span class="badge bg-${variant}-subtle text-${variant} badge-label">${escapeHtml(value)}</span>`
}

const machineCol = {
  data: 'machine_name',
  render: (value, type, row) => (type === 'display'
    ? `<div class="fw-semibold">${escapeHtml(value)}</div><div class="text-muted small">${escapeHtml(row.terminal_code)}</div>`
    : `${value} ${row.terminal_code}`),
}

const statusCol = {
  data: 'status',
  render: (value, type, row) => {
    if (type !== 'display') return value
    const isOnline = value === 'online'
    const dot = `<span class="d-inline-block rounded-circle me-1 bg-${isOnline ? 'success' : 'danger'}" style="width:8px;height:8px"></span>`
    const badge = `<span class="badge bg-${isOnline ? 'success' : 'danger'}">${isOnline ? 'Online' : 'Offline'}</span>`
    const ack = row.is_acknowledged ? ' <span class="badge bg-secondary fw-normal">Acknowledged</span>' : ''
    return `${dot}${badge}${ack}`
  },
}

const columns = [
  textCol('branch_name'),
  machineCol,
  textCol('island_name'),
  textCol('location'),
  { data: 'terminal_type', render: (value) => escapeHtml(value || '—') },
  statusCol,
  { data: 'paper', render: (value, type) => (type === 'display' ? componentBadgeHtml(value) : value || '') },
  { data: 'acceptor', render: (value, type) => (type === 'display' ? componentBadgeHtml(value) : value || '') },
  { data: 'dispenser', render: (value, type) => (type === 'display' ? componentBadgeHtml(value) : value || '') },
  { data: 'cash_reserve', render: (value, type) => (type === 'display' ? money(value) : value) },
  dateCol('last_seen'),
  textCol('updated_by'),
  {
    data: 'id',
    orderable: false,
    searchable: false,
    width: '90px',
    className: 'text-nowrap action-cell',
    render: (id) => `<div class="kiosk-monitoring-action-slot" data-id="${id}"></div>`,
  },
]

const headers = ['Branch', 'Machine', 'Island', 'Location', 'Type', 'Status', 'Paper', 'Acceptor', 'Dispenser', 'Reserve Cash', 'Last Seen', 'Updated By', 'Action']

const MonitoringTable = ({ data, canExecute, onClear, onAcknowledge }) => {
  const handlers = useRef({ onClear, onAcknowledge })
  handlers.current = { onClear, onAcknowledge }

  const rowMap = useMemo(() => {
    const map = {}
    data.forEach((item) => { map[item.id] = item })
    return map
  }, [data])

  const createdRow = useMemo(() => (row, rowData) => {
    const item = rowMap[rowData.id] ?? rowData
    const slot = row.querySelector('.kiosk-monitoring-action-slot')
    if (!slot || !canExecute) return
    const root = slot.__actionRoot || createRoot(slot)
    slot.__actionRoot = root

    root.render(
      <>
        <ActionButton label="Clear Status" icon="eraser" iconClassName="text-danger" onClick={() => handlers.current.onClear(item)} />
        {!item.is_acknowledged && (
          <ActionButton label="Acknowledge" icon="check" iconClassName="text-success" onClick={() => handlers.current.onAcknowledge(item)} />
        )}
      </>,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowMap, canExecute])

  const options = useMemo(() => ({
    responsive: true,
    pageLength: 25,
    order: [[10, 'desc']],
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    initComplete: function () {
      bindSortLabels(this.api())
      const container = this.api().table().container()
      container.style.marginTop = '0'
      const controlsRow = container.querySelector(':scope > .row')
      controlsRow?.classList.add('mb-3')
    },
    language: { paginate: paginationIcons },
    createdRow,
  }), [createdRow])

  return (
    <DataTable data={data} columns={columns} options={options} className="table dt-responsive align-middle mb-0 w-100">
      <thead className="thead-sm text-uppercase fs-xxs">
        <tr>
          {headers.map((header) => <th key={header}>{header}</th>)}
        </tr>
      </thead>
    </DataTable>
  )
}

export default MonitoringTable
