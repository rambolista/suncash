import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo } from 'react'
import { FormControl } from 'react-bootstrap'
import { bindColumnSearchInputs } from '@/views/admin/apps/access-management/utils/dataTableColumnSearch'
import { bindSortLabels } from '@/views/admin/apps/access-management/utils/dataTableSortLabels'
import { paginationIcons } from '@/views/admin/apps/access-management/utils/paginationIcons'
import { escapeHtml, money } from './format'

DataTable.use(DT)

const textCol = (key) => ({ data: key, render: (value) => escapeHtml(value || '—') })
const moneyCol = (key) => ({ data: key, render: (value) => escapeHtml(money(value)) })

const columns = [
  textCol('terminal_code'),
  textCol('island'),
  textCol('location'),
  textCol('product'),
  { data: 'transaction_count', render: (value) => escapeHtml(value ?? 0) },
  moneyCol('amount'),
  moneyCol('total_fees'),
  moneyCol('agent_commission'),
]

const headers = ['Kiosk', 'Island', 'Location', 'Product', 'Transaction Count', 'Amount', 'Fees', 'Agent Commission']

const AgentCommissionReportTable = ({ data }) => {
  const options = useMemo(() => ({
    responsive: true,
    pageLength: 25,
    orderCellsTop: true,
    // Legacy defaults to sorting by Agent Commission (last column) descending.
    order: [[7, 'desc']],
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

export default AgentCommissionReportTable
