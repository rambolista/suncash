import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo } from 'react'
import { FormControl } from 'react-bootstrap'
import { bindColumnSearchInputs } from '@/views/admin/apps/access-management/utils/dataTableColumnSearch'
import { bindSortLabels } from '@/views/admin/apps/access-management/utils/dataTableSortLabels'
import { paginationIcons } from '@/views/admin/apps/access-management/utils/paginationIcons'
import { escapeHtml, formatDateTime, money } from '../../components/format'

DataTable.use(DT)

const textCol = (key) => ({ data: key, render: (value) => escapeHtml(value || '—') })

const ENTRY_BADGE = {
  CREDIT: 'bg-success-subtle text-success',
  DEBIT: 'bg-danger-subtle text-danger',
}

const columns = [
  { data: 'transaction_date', render: (value, type) => (type === 'display' ? formatDateTime(value) : value || '') },
  textCol('transaction_id'),
  textCol('machine'),
  textCol('location'),
  textCol('transaction_type'),
  { data: 'total_amount', render: (value, type) => (type === 'display' ? money(value) : value) },
  {
    data: 'finance_type',
    render: (value, type) => (type === 'display'
      ? `<span class="badge ${ENTRY_BADGE[value] || 'bg-secondary-subtle text-secondary'} badge-label">${escapeHtml(value || '—')}</span>`
      : value),
  },
  { data: 'balance', render: (value, type) => (type === 'display' ? money(value) : value) },
]

const headers = ['Transaction Date', 'Transaction Id', 'Machine', 'Location', 'Product', 'Total Amount', 'Entry Type', 'Balance']

const LedgerTable = ({ data }) => {
  const options = useMemo(() => ({
    responsive: true,
    pageLength: 25,
    orderCellsTop: true,
    order: [[0, 'desc']],
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

export default LedgerTable
