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
  0: 'bg-warning-subtle text-warning',
  1: 'bg-success-subtle text-success',
  2: 'bg-secondary-subtle text-secondary',
}

const headers = ['Name', 'Mobile', 'Amount', 'Email', 'Issuer', 'Issued ID', 'Voucher Number', 'Pin', 'Status', 'Action']

/** Lists a single batch's recipient rows — legacy's `#bv_tbl`. Skip is only offered for still-unprocessed (status 0) rows. */
const VoucherBatchTable = ({ data, canEdit, onSkip }) => {
  const handlers = useRef({ onSkip })
  handlers.current = { onSkip }

  const rowMap = useMemo(() => {
    const map = {}
    data.forEach((item) => { map[item.id] = item })
    return map
  }, [data])

  const actionCol = {
    data: 'id',
    orderable: false,
    searchable: false,
    width: '90px',
    className: 'text-nowrap action-cell',
    render: (id) => `<div class="voucher-batch-action-slot" data-id="${id}"></div>`,
  }

  const columns = useMemo(() => [
    { data: 'name', render: (value) => escapeHtml(value || '—') },
    { data: 'mobile', render: (value) => escapeHtml(value || '—') },
    { data: 'amount', render: (value, type) => (type === 'display' ? escapeHtml(money(value)) : value) },
    { data: 'email', render: (value) => escapeHtml(value || '—') },
    { data: 'issuer', render: (value) => escapeHtml(value || '—') },
    { data: 'issued_id', render: (value) => escapeHtml(value || '—') },
    { data: 'voucher_number', render: (value) => escapeHtml(value || '—') },
    { data: 'pin', render: (value) => escapeHtml(value || '—') },
    {
      data: 'status_label',
      render: (value, type, row) => (type === 'display'
        ? `<span class="badge ${STATUS_BADGE[row.status] ?? 'bg-secondary-subtle text-secondary'} badge-label">${escapeHtml(value)}</span>`
        : value),
    },
    actionCol,
  ], [])

  const createdRow = useMemo(() => (row, rowData) => {
    if (!canEdit) return
    const item = rowMap[rowData.id] ?? rowData
    const slot = row.querySelector('.voucher-batch-action-slot')
    if (!slot) return
    const root = slot.__actionRoot || createRoot(slot)
    slot.__actionRoot = root
    root.render(
      item.status === 0
        ? <ActionButton label="Cancel" icon="ban" iconClassName="text-danger" onClick={() => handlers.current.onSkip(item)} />
        : null,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowMap, canEdit])

  const options = useMemo(() => ({
    ...baseDataTableOptions,
    pageLength: 25,
    order: [[8, 'asc']],
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    initComplete: function () {
      initTableSearchAndSort(this.api())
      resetDataTableContainerSpacing(this.api())
    },
    createdRow,
  }), [createdRow])

  return (
    <div className="table-responsive">
      <DataTable data={data} columns={canEdit ? columns : columns.slice(0, -1)} options={options} className="table dt-responsive align-middle mb-0 w-100">
        <thead className="thead-sm text-uppercase fs-xxs">
          <tr>
            {(canEdit ? headers : headers.slice(0, -1)).map((header) => <th key={header}>{header}</th>)}
          </tr>
          <DataTableColumnSearchRow headers={canEdit ? headers : headers.slice(0, -1)} columns={canEdit ? columns : columns.slice(0, -1)} data={data} />
        </thead>
      </DataTable>
    </div>
  )
}

export default VoucherBatchTable
