import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { FormControl } from 'react-bootstrap'
import { bindColumnSearchInputs } from '@/views/admin/apps/access-management/utils/dataTableColumnSearch'
import { bindSortLabels } from '@/views/admin/apps/access-management/utils/dataTableSortLabels'
import { paginationIcons } from '@/views/admin/apps/access-management/utils/paginationIcons'
import ActionButton from '../../../merchants/components/ActionButton'

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

const STATUS_BADGE = {
  active: 'bg-success-subtle text-success',
  inactive: 'bg-warning-subtle text-warning',
  deactive: 'bg-danger-subtle text-danger',
}

const columns = [
  textCol('suntag_shortcode'),
  textCol('merchant_name'),
  textCol('entity_type'),
  textCol('device_id'),
  textCol('device_type'),
  textCol('brand_name'),
  textCol('model'),
  textCol('connection_type'),
  { data: 'created_at', render: (value, type) => (type === 'display' ? formatDateTime(value) : value || '') },
  {
    data: 'status',
    render: (value, type) => (type === 'display'
      ? `<span class="badge ${STATUS_BADGE[value] || 'bg-secondary-subtle text-secondary'} badge-label text-uppercase">${escapeHtml(value)}</span>`
      : value),
  },
  { data: 'id', orderable: false, searchable: false, width: '130px', className: 'text-nowrap action-cell', render: (id) => `<div class="terminal-action-slot" data-id="${id}"></div>` },
]

const headers = ['Merchant ID', 'Merchant Name', 'Entity Type', 'Device ID', 'Device Type', 'Brand', 'Model', 'Connection Type', 'Registered', 'Status', 'Action']

const TerminalsTable = ({ data, onEdit, onToggleStatus, onDelete, canEdit, canDelete }) => {
  const handlers = useRef({ onEdit, onToggleStatus, onDelete })
  handlers.current = { onEdit, onToggleStatus, onDelete }

  const rowMap = useMemo(() => {
    const map = {}
    data.forEach((item) => { map[item.id] = item })
    return map
  }, [data])

  const createdRow = useMemo(() => (row, rowData) => {
    const item = rowMap[rowData.id] ?? rowData
    const slot = row.querySelector('.terminal-action-slot')
    if (!slot) return
    const root = slot.__actionRoot || createRoot(slot)
    slot.__actionRoot = root

    const isActive = item.status === 'active'
    root.render(
      <>
        {canEdit && <ActionButton label="Edit" icon="edit" onClick={() => handlers.current.onEdit(item)} />}
        {canEdit && (
          <ActionButton
            label={isActive ? 'Deactivate' : 'Activate'}
            icon={isActive ? 'player-pause' : 'player-play'}
            iconClassName={isActive ? 'text-warning' : 'text-success'}
            onClick={() => handlers.current.onToggleStatus(item)}
          />
        )}
        {canDelete && <ActionButton label="Delete" icon="trash" iconClassName="text-danger" onClick={() => handlers.current.onDelete(item)} />}
      </>,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowMap, canEdit, canDelete])

  const options = useMemo(() => ({
    responsive: true,
    orderCellsTop: true,
    order: [[8, 'desc']],
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    initComplete: function () {
      bindColumnSearchInputs(this.api())
      bindSortLabels(this.api())
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
        <tr className="column-search-input-bar">
          {headers.map((header, index) => (
            <th key={header}>
              {header !== 'Action' && <FormControl size="sm" type="text" placeholder={header} className="bg-light-subtle border-light" data-col-index={index} />}
            </th>
          ))}
        </tr>
      </thead>
    </DataTable>
  )
}

export default TerminalsTable
