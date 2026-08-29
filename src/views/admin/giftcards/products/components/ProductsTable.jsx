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

const boolCol = (key) => ({
  data: key,
  render: (value, type) => (type === 'display'
    ? `<span class="badge ${value ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'} badge-label">${value ? 'YES' : 'NO'}</span>`
    : value),
})

const STATUS_BADGE = {
  ACTIVE: 'bg-success-subtle text-success',
  PENDING: 'bg-warning-subtle text-warning',
  DISABLED: 'bg-danger-subtle text-danger',
}

const columns = [
  { data: 'created_at', render: (value, type) => (type === 'display' ? formatDateTime(value) : value || '') },
  textCol('merchant_name'),
  {
    data: 'logo_url',
    orderable: false,
    searchable: false,
    render: (value, type) => (type === 'display'
      ? (value ? `<img src="${escapeHtml(value)}" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:6px" onerror="this.style.display='none'" />` : '—')
      : value),
  },
  textCol('product_name'),
  textCol('denomination_type'),
  { data: 'expiry_in_months', render: (value) => escapeHtml(value != null ? `${value} mo.` : '—') },
  boolCol('reloadable'),
  boolCol('multi_redemption'),
  { data: 'inactivity_trigger_months', render: (value) => escapeHtml(value != null ? `${value} mo.` : '—') },
  {
    data: 'status',
    render: (value, type) => (type === 'display'
      ? `<span class="badge ${STATUS_BADGE[value] || 'bg-secondary-subtle text-secondary'} badge-label">${escapeHtml(value)}</span>`
      : value),
  },
  { data: 'id', orderable: false, searchable: false, width: '130px', className: 'text-nowrap action-cell', render: (id) => `<div class="giftcard-product-action-slot" data-id="${id}"></div>` },
]

const headers = ['Date Created', 'Business Name', 'Logo', 'Product Name', 'Type', 'Expiry', 'Reloadable', 'Multi Redemption', 'Inactivity Trigger', 'Status', 'Action']

const ProductsTable = ({ data, tab, canEdit, onActivate, onDeactivate, onViewTypes }) => {
  const handlers = useRef({ onActivate, onDeactivate, onViewTypes })
  handlers.current = { onActivate, onDeactivate, onViewTypes }

  const rowMap = useMemo(() => {
    const map = {}
    data.forEach((item) => { map[item.id] = item })
    return map
  }, [data])

  const createdRow = useMemo(() => (row, rowData) => {
    const item = rowMap[rowData.id] ?? rowData
    const slot = row.querySelector('.giftcard-product-action-slot')
    if (!slot) return
    const root = slot.__actionRoot || createRoot(slot)
    slot.__actionRoot = root

    root.render(
      <>
        {canEdit && (tab === 'pending' || tab === 'disabled') && (
          <ActionButton label="Activate" icon="circle-check" iconClassName="text-success" onClick={() => handlers.current.onActivate(item)} />
        )}
        {canEdit && (tab === 'pending' || tab === 'active') && (
          <ActionButton label="Deactivate" icon="ban" iconClassName="text-danger" onClick={() => handlers.current.onDeactivate(item)} />
        )}
        {tab === 'active' && (
          <ActionButton
            label={`View product types (${item.pending_types_count ?? 0})`}
            icon="list-details"
            onClick={() => handlers.current.onViewTypes(item)}
          />
        )}
      </>,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowMap, tab, canEdit])

  const options = useMemo(() => ({
    responsive: true,
    orderCellsTop: true,
    order: [[0, 'desc']],
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
              {!['Logo', 'Action'].includes(header) && <FormControl size="sm" type="text" placeholder={header} className="bg-light-subtle border-light" data-col-index={index} />}
            </th>
          ))}
        </tr>
      </thead>
    </DataTable>
  )
}

export default ProductsTable
