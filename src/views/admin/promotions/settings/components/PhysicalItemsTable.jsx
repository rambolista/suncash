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

const STATUS_BADGE = {
  ACTIVE: 'bg-success-subtle text-success',
  USED: 'bg-secondary-subtle text-secondary',
}

const DRAW_TYPE_LABELS = {
  weekly_draw: 'WEEKLY DRAW',
  grand_draw: 'GRAND DRAW',
  instant_prize: 'INSTANT PRIZE',
  wu_draw: 'AC PRIZE',
  ps5_draw: 'PS5 PRIZE',
}

const headers = ['Image', 'Branch', 'Merchant', 'Description', 'Qty', 'Draw Type', 'Draw Date', 'Status', 'Action']

const PhysicalItemsTable = ({ data, canEdit, onEdit, onDelete }) => {
  const handlers = useRef({ onEdit, onDelete })
  handlers.current = { onEdit, onDelete }

  const rowMap = useMemo(() => {
    const map = {}
    data.forEach((item) => { map[item.id] = item })
    return map
  }, [data])

  const tableData = useMemo(() => data.map((item) => ({
    ...item,
    quantity_display: `${item.remaining_quantity}/${item.quantity}`,
  })), [data])

  const actionCol = {
    data: 'id',
    orderable: false,
    searchable: false,
    width: '100px',
    className: 'text-nowrap action-cell',
    render: (id) => `<div class="promo-item-action-slot" data-id="${id}"></div>`,
  }

  const columns = useMemo(() => [
    {
      data: 'image_url',
      orderable: false,
      searchable: false,
      render: (value, type) => (type === 'display'
        ? (value ? `<img src="${escapeHtml(value)}" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:6px" onerror="this.style.display='none'" />` : '—')
        : value),
    },
    { data: 'branch_name', render: (value) => escapeHtml(value || '—') },
    { data: 'merchant_name', render: (value) => escapeHtml(value || '—') },
    { data: 'item_description', render: (value) => escapeHtml(value || '—') },
    { data: 'quantity_display' },
    { data: 'draw_type', render: (value) => escapeHtml(DRAW_TYPE_LABELS[value] || value) },
    { data: 'draw_date', render: (value) => escapeHtml(value || '—') },
    {
      data: 'status',
      render: (value, type) => (type === 'display'
        ? `<span class="badge ${STATUS_BADGE[value] || 'bg-secondary-subtle text-secondary'} badge-label">${escapeHtml(value)}</span>`
        : value),
    },
    actionCol,
  ], [])

  const createdRow = useMemo(() => (row, rowData) => {
    if (!canEdit) return
    const item = rowMap[rowData.id] ?? rowData
    const slot = row.querySelector('.promo-item-action-slot')
    if (!slot) return
    const root = slot.__actionRoot || createRoot(slot)
    slot.__actionRoot = root
    root.render(
      <>
        <ActionButton label="Edit" icon="pencil" onClick={() => handlers.current.onEdit(item)} />
        <ActionButton label="Remove" icon="trash" iconClassName="text-danger" onClick={() => handlers.current.onDelete(item)} />
      </>,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowMap, canEdit])

  const options = useMemo(() => ({
    ...baseDataTableOptions,
    pageLength: 25,
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    initComplete: function () {
      initTableSearchAndSort(this.api())
      resetDataTableContainerSpacing(this.api())
    },
    createdRow,
  }), [createdRow])

  return (
    <div className="table-responsive">
      <DataTable data={tableData} columns={canEdit ? columns : columns.slice(0, -1)} options={options} className="table dt-responsive align-middle mb-0 w-100">
        <thead className="thead-sm text-uppercase fs-xxs">
          <tr>
            {(canEdit ? headers : headers.slice(0, -1)).map((header) => <th key={header}>{header}</th>)}
          </tr>
          <DataTableColumnSearchRow headers={canEdit ? headers : headers.slice(0, -1)} columns={canEdit ? columns : columns.slice(0, -1)} data={tableData} />
        </thead>
      </DataTable>
    </div>
  )
}

export default PhysicalItemsTable
