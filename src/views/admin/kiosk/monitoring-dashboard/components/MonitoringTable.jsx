import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { bindSortLabels } from '@/views/admin/apps/access-management/utils/dataTableSortLabels'
import { paginationIcons } from '@/views/admin/apps/access-management/utils/paginationIcons'
import ActionButton from '../../../merchants/components/ActionButton'
import { escapeHtml, formatDateTime, money } from '@/utils/reportHelpers'

DataTable.use(DT)

const textCol = (key) => ({ data: key, render: (value) => escapeHtml(value || '—') })
const dateCol = (key) => ({ data: key, render: (value, type) => (type === 'display' ? formatDateTime(value) : value || '') })

/** legacy's textStatusClass() — same status-ok/status-warning/status-error/status-grey buckets, for the Paper/Acceptor/Dispenser text columns. */
const TEXT_STATUS_VARIANT = {
  ok: 'success', idle: 'success',
  warning: 'warning', 'paper low': 'warning',
  low: 'danger', high: 'danger', full: 'danger', 'hardware issue': 'danger', jammed: 'danger', jam: 'danger',
  'cover open': 'danger', spooling: 'danger', 'not found or monitoring': 'danger', 'drag paper motor on': 'danger',
  'n/a': 'secondary',
}

const badgeHtml = (variant, label) => `<span class="badge bg-${variant}-subtle text-${variant} badge-label">${escapeHtml(label)}</span>`

const componentBadgeHtml = (value) => {
  if (!value) return '<span class="text-muted">—</span>'
  const variant = TEXT_STATUS_VARIANT[String(value).toLowerCase()] ?? 'danger'
  return badgeHtml(variant, value)
}

/** legacy's cashLevelStatusClass() bucket, already resolved server-side into acceptor_level/dispenser_level. */
const CASH_LEVEL_VARIANT = { ok: 'success', warning: 'warning', full: 'danger', critical: 'danger', na: 'secondary' }

const cashLevelHtml = (value, level) => {
  if (value === null || value === undefined) return '<span class="text-muted">N/A</span>'
  return badgeHtml(CASH_LEVEL_VARIANT[level] ?? 'secondary', money(value))
}

/** Reserve Cash is legacy's one hardcoded-green column (`cash_reserve_class status-ok`) — never colored by value. */
const reserveCashHtml = (value) => `<span class="badge bg-success-subtle text-success badge-label">${escapeHtml(money(value))}</span>`

const cashMgmtHtml = (value, row) => {
  if (!value) return '<span class="text-muted">—</span>'
  const variant = row.acceptor_level === 'full' || row.dispenser_level === 'critical'
    ? 'danger'
    : (row.acceptor_level === 'warning' || row.dispenser_level === 'warning' ? 'warning' : 'success')
  return badgeHtml(variant, value)
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
  { data: 'cash_reserve', render: (value, type) => (type === 'display' ? reserveCashHtml(value) : value) },
  { data: 'acceptor_cash', render: (value, type, row) => (type === 'display' ? cashLevelHtml(value, row.acceptor_level) : value) },
  { data: 'dispenser_cash', render: (value, type, row) => (type === 'display' ? cashLevelHtml(value, row.dispenser_level) : (value ?? '')) },
  { data: 'cash_mgmt', render: (value, type, row) => (type === 'display' ? cashMgmtHtml(value, row) : value || '') },
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

const headers = ['Branch', 'Machine', 'Island', 'Location', 'Type', 'Status', 'Paper', 'Acceptor', 'Dispenser', 'Reserve Cash', 'Acceptor Cash', 'Dispenser Cash', 'Cash Mgmt', 'Last Seen', 'Updated By', 'Action']

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
    responsive: false,
    pageLength: 25,
    order: [[13, 'desc']],
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
    <div className="table-responsive">
    <DataTable data={data} columns={columns} options={options} className="table dt-responsive align-middle mb-0 w-100">
      <thead className="thead-sm text-uppercase fs-xxs">
        <tr>
          {headers.map((header) => <th key={header}>{header}</th>)}
        </tr>
      </thead>
    </DataTable>
    </div>
  )
}

export default MonitoringTable
