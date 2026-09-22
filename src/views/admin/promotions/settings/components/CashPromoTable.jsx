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
  instant_prize: 'INSTANT PRIZE',
}

const resolveTargetGroup = (setting, islands) => {
  const islandName = (id) => islands.find((island) => island.id === Number(id))?.name || `Island #${id}`

  if (setting.target_group_type === 'island' || setting.target_group_type === 'multiple') {
    const ids = String(setting.target_group || '').split(',').filter(Boolean)
    return ids.map(islandName).join(', ') || '—'
  }

  if (setting.target_group_type === 'percentage') {
    const totalQuantity = Number(setting.quantity) || 0
    return String(setting.target_group || '').split(',').filter(Boolean)
      .map((pair) => {
        const [islandId, quantity] = pair.split('-')
        if (Number(islandId) === 0) return null
        const pct = totalQuantity > 0 ? Math.round((Number(quantity) / totalQuantity) * 100) : 0
        return `${islandName(islandId)} (${pct}%)`
      })
      .filter(Boolean)
      .join(', ') || '—'
  }

  return 'All Islands'
}

const headers = ['ID', 'Created', 'Prize', 'Qty', 'Description', 'Draw Type', 'Target Group', 'Draw Date', 'Status', 'Action']

const CashPromoTable = ({ data, islands, canEdit, onEdit, onDelete }) => {
  const handlers = useRef({ onEdit, onDelete })
  handlers.current = { onEdit, onDelete }

  const rowMap = useMemo(() => {
    const map = {}
    data.forEach((item) => { map[item.id] = item })
    return map
  }, [data])

  const tableData = useMemo(() => data.map((setting) => ({
    ...setting,
    target_group_display: resolveTargetGroup(setting, islands),
    quantity_display: `${setting.remaining_quantity}/${setting.quantity}`,
  })), [data, islands])

  const actionCol = {
    data: 'id',
    orderable: false,
    searchable: false,
    width: '100px',
    className: 'text-nowrap action-cell',
    render: (id) => `<div class="cash-promo-action-slot" data-id="${id}"></div>`,
  }

  const columns = useMemo(() => [
    { data: 'id' },
    { data: 'created_date', render: (value) => escapeHtml(value || '—') },
    { data: 'price', render: (value) => escapeHtml(`$${Number(value).toLocaleString()}`) },
    { data: 'quantity_display' },
    { data: 'description', render: (value) => escapeHtml(value || '—') },
    { data: 'draw_type', render: (value) => escapeHtml(DRAW_TYPE_LABELS[value] || value) },
    { data: 'target_group_display', render: (value) => escapeHtml(value) },
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
    const slot = row.querySelector('.cash-promo-action-slot')
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
    order: [[0, 'desc']],
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

export default CashPromoTable
