import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { baseDataTableOptions, initTableSearchAndSort, resetDataTableContainerSpacing } from '@/views/admin/apps/access-management/utils/dataTableOptions'
import DataTableColumnSearchRow from '@/views/admin/apps/access-management/utils/DataTableColumnSearchRow'
import ActionButton from '@/views/admin/merchants/components/ActionButton'
import { escapeHtml, money } from '@/utils/reportHelpers'

DataTable.use(DT)

const STATUS_BADGE = {
  active: 'bg-warning-subtle text-warning',
  paid: 'bg-success-subtle text-success',
}

/** Lists Customer Benefits Distribution rows — shared by the All/Active/Paid tabs, which differ only in whether a batch-name column and a per-row Process action are shown. */
const CustomerBenefitsTable = ({ data, showBatchName, showAction, canEdit, onProcessRow }) => {
  const handlers = useRef({ onProcessRow })
  handlers.current = { onProcessRow }

  const rowMap = useMemo(() => {
    const map = {}
    data.forEach((item) => { map[item.id] = item })
    return map
  }, [data])

  const baseColumns = [
    { data: 'name', render: (value) => escapeHtml(value || '—') },
    { data: 'mobile', render: (value) => escapeHtml(value || '—') },
    { data: 'amount', render: (value, type) => (type === 'display' ? escapeHtml(money(value)) : value) },
    { data: 'email', render: (value) => escapeHtml(value || '—') },
    { data: 'issuer', render: (value) => escapeHtml(value || '—') },
    { data: 'issued_id', render: (value) => escapeHtml(value || '—') },
  ]

  const batchNameColumn = { data: 'batch_name', render: (value) => escapeHtml(value || '—') }

  const statusColumn = {
    data: 'status_label',
    render: (value, type, row) => (type === 'display'
      ? `<span class="badge ${STATUS_BADGE[row.status] ?? 'bg-secondary-subtle text-secondary'} badge-label">${escapeHtml(value)}</span>`
      : value),
  }

  const actionColumn = {
    data: 'id',
    orderable: false,
    searchable: false,
    width: '90px',
    className: 'text-nowrap action-cell',
    render: (id) => `<div class="customer-benefit-action-slot" data-id="${id}"></div>`,
  }

  const headers = ['Name', 'Mobile', 'Amount', 'Email', 'Issuer', 'NIB Number', ...(showBatchName ? ['Batch Name'] : []), 'Status', ...(showAction ? ['Action'] : [])]

  const columns = useMemo(() => [
    ...baseColumns,
    ...(showBatchName ? [batchNameColumn] : []),
    statusColumn,
    ...(showAction ? [actionColumn] : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [showBatchName, showAction])

  const createdRow = useMemo(() => (row, rowData) => {
    if (!showAction || !canEdit) return
    const item = rowMap[rowData.id] ?? rowData
    const slot = row.querySelector('.customer-benefit-action-slot')
    if (!slot) return
    const root = slot.__actionRoot || createRoot(slot)
    slot.__actionRoot = root
    root.render(
      item.status === 'active'
        ? <ActionButton label="Process" icon="play" iconClassName="text-primary" onClick={() => handlers.current.onProcessRow(item)} />
        : null,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowMap, canEdit, showAction])

  const statusColumnIndex = headers.indexOf('Status')

  const options = useMemo(() => ({
    ...baseDataTableOptions,
    pageLength: 25,
    order: [[statusColumnIndex, 'asc']],
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    initComplete: function () {
      initTableSearchAndSort(this.api())
      resetDataTableContainerSpacing(this.api())
    },
    createdRow,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [createdRow, statusColumnIndex])

  return (
    <div className="table-responsive">
      <DataTable data={data} columns={columns} options={options} className="table dt-responsive align-middle mb-0 w-100">
        <thead className="thead-sm text-uppercase fs-xxs">
          <tr>
            {headers.map((header) => <th key={header}>{header}</th>)}
          </tr>
          <DataTableColumnSearchRow headers={headers} columns={columns} data={data} />
        </thead>
      </DataTable>
    </div>
  )
}

export default CustomerBenefitsTable
