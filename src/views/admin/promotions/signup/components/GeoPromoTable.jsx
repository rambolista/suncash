import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { FormControl, OverlayTrigger, Tooltip } from 'react-bootstrap'
import Icon from '@/components/wrappers/Icon'
import { Button } from 'react-bootstrap'
import { bindColumnSearchInputs } from '@/views/admin/apps/access-management/utils/dataTableColumnSearch'
import { bindSortLabels } from '@/views/admin/apps/access-management/utils/dataTableSortLabels'
import { paginationIcons } from '@/views/admin/apps/access-management/utils/paginationIcons'

DataTable.use(DT)

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const formatDateTime = (value) => {
  if (!value) return '—'
  const parsed = new Date(String(value).replace(' ', 'T'))
  if (Number.isNaN(parsed.getTime())) return String(value)
  return `${parsed.toLocaleDateString()} ${parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

const formatDate = (value) => {
  if (!value) return '—'
  const parsed = new Date(String(value).length <= 10 ? `${value}T00:00:00` : value)
  if (Number.isNaN(parsed.getTime())) return String(value)
  return parsed.toLocaleDateString()
}

const ActionButton = ({ label, icon, iconClassName, onClick }) => (
  <OverlayTrigger placement="top" delay={{ show: 250, hide: 0 }} overlay={<Tooltip>{label}</Tooltip>}>
    <Button variant="light" size="sm" className="btn-icon rounded-circle" aria-label={label} onClick={onClick}>
      <Icon icon={icon} className={`fs-lg${iconClassName ? ` ${iconClassName}` : ''}`} />
    </Button>
  </OverlayTrigger>
)

const columns = [
  { data: 'create_date', render: (value, type) => (type === 'display' ? escapeHtml(formatDateTime(value)) : value) },
  { data: 'promo_description', render: (value) => escapeHtml(value || '—') },
  { data: 'promo_amount', render: (value, type) => (type === 'display' ? `$${Number(value || 0).toLocaleString()}` : value) },
  { data: 'promo_country', render: (value) => escapeHtml(value || '—') },
  { data: 'date_from', render: (value, type) => (type === 'display' ? escapeHtml(formatDate(value)) : value) },
  { data: 'date_to', render: (value, type) => (type === 'display' ? escapeHtml(formatDate(value)) : value) },
  { data: 'id', orderable: false, searchable: false, width: '110px', className: 'text-nowrap action-cell', render: (id) => `<div class="geo-promo-action-slot" data-id="${id}"></div>` },
]

const GeoPromoTable = ({ data, canEdit, canDelete, onView, onEdit, onDelete }) => {
  const handlers = useRef({ onView, onEdit, onDelete })
  handlers.current = { onView, onEdit, onDelete }

  const rowMap = useMemo(() => {
    const map = {}
    data.forEach((item) => { map[item.id] = item })
    return map
  }, [data])

  const options = useMemo(() => ({
    responsive: true,
    orderCellsTop: true,
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    initComplete: function () {
      bindColumnSearchInputs(this.api())
      bindSortLabels(this.api())
    },
    language: { paginate: paginationIcons },
    createdRow: (row, rowData) => {
      const item = rowMap[rowData.id] ?? rowData
      const slot = row.querySelector('.geo-promo-action-slot')
      if (!slot) return
      const root = slot.__actionRoot || createRoot(slot)
      slot.__actionRoot = root
      root.render(
        <div className="d-flex gap-1">
          <ActionButton label="View" icon="eye" onClick={() => handlers.current.onView?.(item)} />
          {canEdit && <ActionButton label="Edit" icon="edit" onClick={() => handlers.current.onEdit?.(item)} />}
          {canDelete && <ActionButton label="Remove" icon="trash" iconClassName="text-danger" onClick={() => handlers.current.onDelete?.(item)} />}
        </div>
      )
    },
  }), [canEdit, canDelete, rowMap])

  return (
    <DataTable data={data} columns={columns} options={options} className="table dt-responsive align-middle mb-0 w-100">
      <thead className="thead-sm text-uppercase fs-xxs">
        <tr>
          <th>Created</th>
          <th>Description</th>
          <th>Amount</th>
          <th>Country</th>
          <th>Date From</th>
          <th>Date To</th>
          <th>Actions</th>
        </tr>
        <tr className="column-search-input-bar">
          <th><FormControl size="sm" type="text" placeholder="Created" className="bg-light-subtle border-light" data-col-index="0" /></th>
          <th><FormControl size="sm" type="text" placeholder="Description" className="bg-light-subtle border-light" data-col-index="1" /></th>
          <th><FormControl size="sm" type="text" placeholder="Amount" className="bg-light-subtle border-light" data-col-index="2" /></th>
          <th><FormControl size="sm" type="text" placeholder="Country" className="bg-light-subtle border-light" data-col-index="3" /></th>
          <th><FormControl size="sm" type="text" placeholder="Date From" className="bg-light-subtle border-light" data-col-index="4" /></th>
          <th><FormControl size="sm" type="text" placeholder="Date To" className="bg-light-subtle border-light" data-col-index="5" /></th>
          <th />
        </tr>
      </thead>
    </DataTable>
  )
}

export default GeoPromoTable
