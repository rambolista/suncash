import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { bindColumnSearchInputs } from '@/views/admin/apps/access-management/utils/dataTableColumnSearch'
import { bindSortLabels } from '@/views/admin/apps/access-management/utils/dataTableSortLabels'
import { paginationIcons } from '@/views/admin/apps/access-management/utils/paginationIcons'
import DataTableColumnSearchRow from '@/views/admin/apps/access-management/utils/DataTableColumnSearchRow'
import ActionButton from '@/views/admin/merchants/components/ActionButton'
import { escapeHtml, money } from './format'

DataTable.use(DT)

const STATUS_BADGE = {
  pending: 'bg-warning-subtle text-warning',
  processed: 'bg-success-subtle text-success',
  rejected: 'bg-danger-subtle text-danger',
}
const STATUS_LABEL = { pending: 'Pending', processed: 'Approved', rejected: 'Rejected' }

const textCol = (key) => ({ data: key, render: (value) => escapeHtml(value || '—') })
const moneyCol = (key) => ({ data: key, render: (value) => escapeHtml(money(value)) })

const columns = [
  textCol('kiosk'),
  textCol('island'),
  textCol('location'),
  textCol('partner_name'),
  textCol('partner_mobile'),
  moneyCol('total_amount'),
  moneyCol('total_revenue'),
  textCol('commission_type'),
  textCol('commission_rate'),
  moneyCol('commission_payment'),
  {
    data: 'status',
    render: (value, type) => (type === 'display'
      ? `<span class="badge ${STATUS_BADGE[value] || 'bg-secondary-subtle text-secondary'} badge-label">${escapeHtml(STATUS_LABEL[value] || value)}</span>`
      : (STATUS_LABEL[value] || value)),
  },
  {
    data: 'transaction_id',
    orderable: false,
    searchable: false,
    width: '120px',
    className: 'text-nowrap action-cell',
    render: (id) => `<div class="commission-approval-action-slot" data-id="${id}"></div>`,
  },
]

const headers = [
  'Kiosk', 'Island', 'Location', 'Partner Name', 'Partner Mobile', 'Transaction Volume',
  'Revenue', 'Commission Type', 'Commission Rate', 'Commission Payment', 'Status', 'Action',
]

const DROPDOWN_COLUMNS = { 0: 'kiosk', 1: 'island', 2: 'location' }

const CommissionApprovalTable = ({ data, canApprove, canReject, onApprove, onReject, onHistory }) => {
  const handlers = useRef({ onApprove, onReject, onHistory })
  handlers.current = { onApprove, onReject, onHistory }

  const rowMap = useMemo(() => {
    const map = {}
    data.forEach((item) => { map[item.transaction_id] = item })
    return map
  }, [data])

  const createdRow = useMemo(() => (row, rowData) => {
    const item = rowMap[rowData.transaction_id] ?? rowData
    const slot = row.querySelector('.commission-approval-action-slot')
    if (!slot) return
    const root = slot.__actionRoot || createRoot(slot)
    slot.__actionRoot = root
    const canAdjudicate = item.status === 'pending' && Boolean(item.partner_mobile)

    root.render(
      <>
        {canApprove && canAdjudicate && <ActionButton label="Approve" icon="circle-check" iconClassName="text-success" onClick={() => handlers.current.onApprove(item)} />}
        {canReject && canAdjudicate && <ActionButton label="Reject" icon="circle-x" iconClassName="text-danger" onClick={() => handlers.current.onReject(item)} />}
        <ActionButton label="View History" icon="history" onClick={() => handlers.current.onHistory(item)} />
      </>,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowMap, canApprove, canReject])

  const options = useMemo(() => ({
    responsive: true,
    pageLength: 25,
    orderCellsTop: true,
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    initComplete: function () {
      bindColumnSearchInputs(this.api())
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
        <DataTableColumnSearchRow headers={headers} columns={columns} data={data} dropdownColumns={DROPDOWN_COLUMNS} />
      </thead>
    </DataTable>
  )
}

export default CommissionApprovalTable
