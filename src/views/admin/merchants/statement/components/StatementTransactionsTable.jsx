import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo } from 'react'
import { FormControl } from 'react-bootstrap'
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
  const date = new Date(String(value).replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return escapeHtml(value)
  return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const money = (value) => `BSD ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const TYPE_BADGE = {
  CREDIT: 'bg-success-subtle text-success',
  DEBIT: 'bg-danger-subtle text-danger',
}

const columns = [
  { data: 'timestamp', render: (value, type) => (type === 'display' ? formatDateTime(value) : value || '') },
  { data: 'transtype', render: (value, type) => (type === 'display' ? `<span class="badge ${TYPE_BADGE[value] || 'bg-secondary-subtle text-secondary'} badge-label">${escapeHtml(value)}</span>` : value) },
  { data: 'description', render: (value) => escapeHtml(value || '—') },
  { data: 'amount', render: (value, type) => (type === 'display' ? money(value) : value) },
  { data: 'available_balance', render: (value, type) => (type === 'display' ? money(value) : value) },
  { data: 'onhold_balance', render: (value, type) => (type === 'display' ? money(value) : value) },
  { data: 'running_balance', render: (value, type) => (type === 'display' ? money(value) : value) },
  { data: 'reference_no', render: (value) => escapeHtml(value || '—') },
]

const headers = ['Timestamp', 'Transaction Type', 'Description', 'Amount', 'Available Balance', 'Onhold Balance', 'Total Balance', 'Reference']

const StatementTransactionsTable = ({ data }) => {
  const options = useMemo(() => ({
    responsive: true,
    orderCellsTop: true,
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    initComplete: function () {
      bindColumnSearchInputs(this.api())
      bindSortLabels(this.api())
    },
    language: { paginate: paginationIcons },
  }), [])

  return (
    <DataTable data={data} columns={columns} options={options} className="table dt-responsive align-middle mb-0 w-100">
      <thead className="thead-sm text-uppercase fs-xxs">
        <tr>
          {headers.map((header) => <th key={header}>{header}</th>)}
        </tr>
        <tr className="column-search-input-bar">
          {headers.map((header, index) => (
            <th key={header}>
              <FormControl size="sm" type="text" placeholder={header} className="bg-light-subtle border-light" data-col-index={index} />
            </th>
          ))}
        </tr>
      </thead>
    </DataTable>
  )
}

export default StatementTransactionsTable
