import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { FormControl } from 'react-bootstrap'
import ActionButton from '../../components/ActionButton'
import { baseDataTableOptions, initTableSearchAndSort } from '@/views/admin/apps/access-management/utils/dataTableOptions'

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

const dateCol = (key) => ({
  data: key,
  render: (value, type) => (type === 'display' ? formatDateTime(value) : value || ''),
})

const amountCol = (key) => ({
  data: key,
  // Search/sort against the same 2-decimal value that's displayed — `total`
  // is computed server-side as amount+fee and can carry PHP float-addition
  // drift (e.g. 32.989999999999995), which would otherwise let a search
  // like "10000" match an unrelated total.
  render: (value, type) => (type === 'display' ? `BSD ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : Number(value || 0).toFixed(2)),
})

const columns = [
  dateCol('created_at'),
  textCol('transaction_id'),
  textCol('suntag_shortcode'),
  textCol('payor'),
  textCol('payee'),
  textCol('transaction_type'),
  amountCol('amount'),
  amountCol('fee'),
  amountCol('total'),
  { data: 'id', orderable: false, searchable: false, width: '90px', className: 'text-nowrap action-cell', render: (id) => `<div class="billpay-action-slot" data-id="${id}"></div>` },
]

const headers = ['Created', 'Transaction ID', 'Shortcode', 'From', 'To', 'Type', 'Amount', 'Fee', 'Total', 'Action']

const BillpayTable = ({ data, onView }) => {
  const handlers = useRef({ onView })
  handlers.current = { onView }

  const rowMap = useMemo(() => {
    const map = {}
    data.forEach((item) => { map[item.id] = item })
    return map
  }, [data])

  const createdRow = useMemo(() => (row, rowData) => {
    const item = rowMap[rowData.id] ?? rowData
    const slot = row.querySelector('.billpay-action-slot')
    if (!slot) return
    const root = slot.__actionRoot || createRoot(slot)
    slot.__actionRoot = root

    root.render(<ActionButton label="View" icon="eye" onClick={() => handlers.current.onView(item)} />)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowMap])

  const options = useMemo(() => ({
    ...baseDataTableOptions,
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    initComplete: function () {
      initTableSearchAndSort(this.api())
    },
    createdRow,
  }), [createdRow])

  return (
    <div className="table-responsive">
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
    </div>
  )
}

export default BillpayTable
