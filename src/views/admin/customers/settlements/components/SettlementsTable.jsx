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

const dateCol = (key) => ({ data: key, render: (value, type) => (type === 'display' ? formatDateTime(value) : value || '') })

const amountCol = (key) => ({
  data: key,
  render: (value, type) => (type === 'display' ? `BSD ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value),
})

const SettlementsTable = ({ data, tab, onView }) => {
  const handlers = useRef({ onView })
  handlers.current = { onView }

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
    render: (id) => `<div class="customer-settlement-action-slot" data-id="${id}"></div>`,
  }

  const columns = useMemo(() => {
    const base = [
      dateCol('created_date'),
      textCol('transaction_id'),
      textCol('customer_name'),
      textCol('channel'),
      textCol('withdrawal_type'),
      amountCol('amount'),
    ]

    if (tab === 'pending') {
      return [...base, { data: 'due_date', render: (value) => (value ? (value === 'OverDue' ? '<span class="text-danger fw-semibold">OverDue</span>' : formatDateTime(value)) : '—') }, actionCol]
    }

    return [...base, dateCol('updated_date'), textCol('updated_by_user'), actionCol]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const headers = useMemo(() => {
    const base = ['Date/Time Submitted', 'Transaction ID', 'Customer Name', 'Processed From', 'Withdrawal Type', 'Amount']
    if (tab === 'pending') return [...base, 'Due Date', 'Action']
    if (tab === 'approved') return [...base, 'Date Processed', 'Processed By', 'Action']
    return [...base, 'Date Rejected', 'Rejected By', 'Action']
  }, [tab])

  const createdRow = useMemo(() => (row, rowData) => {
    const item = rowMap[rowData.id] ?? rowData
    const slot = row.querySelector('.customer-settlement-action-slot')
    if (!slot) return
    const root = slot.__actionRoot || createRoot(slot)
    slot.__actionRoot = root

    root.render(<ActionButton label="View" icon="eye" onClick={() => handlers.current.onView(item)} />)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowMap, tab])

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
              {header !== 'Action' && <FormControl size="sm" type="text" placeholder={header} className="bg-light-subtle border-light" data-col-index={index} />}
            </th>
          ))}
        </tr>
      </thead>
    </DataTable>
  )
}

export default SettlementsTable
