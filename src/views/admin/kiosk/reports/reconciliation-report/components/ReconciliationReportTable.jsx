import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo } from 'react'
import { bindColumnSearchInputs } from '@/views/admin/apps/access-management/utils/dataTableColumnSearch'
import { bindSortLabels } from '@/views/admin/apps/access-management/utils/dataTableSortLabels'
import { paginationIcons } from '@/views/admin/apps/access-management/utils/paginationIcons'
import DataTableColumnSearchRow from '@/views/admin/apps/access-management/utils/DataTableColumnSearchRow'
import { escapeHtml, money } from './format'

DataTable.use(DT)

const textCol = (key) => ({ data: key, render: (value) => escapeHtml(value || '—') })
const moneyCol = (key) => ({ data: key, render: (value) => escapeHtml(money(value)) })

const columns = [
  textCol('kiosk'),
  textCol('island'),
  textCol('location'),
  moneyCol('running_balance'),
  moneyCol('total_cash_in'),
  moneyCol('total_cash_out'),
  moneyCol('total_fee'),
  moneyCol('total_vat'),
  moneyCol('credit_adjustments'),
  moneyCol('debit_adjustments'),
  moneyCol('total_cash_loaded'),
  moneyCol('total_deposits'),
  moneyCol('cash_movement'),
  moneyCol('net_balance'),
]

const headers = [
  'Kiosk', 'Island', 'Location', 'Balance B/F', 'Total Cash In', 'Total Cash Out',
  'Total Fees', 'Total Vat', 'Total Credit Adjustment', 'Total Debit Adjustment',
  'Total Cash Loaded', 'Total Cash Deposit', 'Total Cash Movement', 'Net Balance',
]

// Kiosk / Island / Location are filtered via a dropdown of the values actually present, not free text.
const DROPDOWN_COLUMNS = { 0: 'kiosk', 1: 'island', 2: 'location' }

const ReconciliationReportTable = ({ data }) => {
  const options = useMemo(() => ({
    responsive: false,
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
  }), [])

  return (
    <div className="table-responsive">
    <DataTable data={data} columns={columns} options={options} className="table dt-responsive align-middle mb-0 w-100">
      <thead className="thead-sm text-uppercase fs-xxs">
        <tr>
          {headers.map((header) => <th key={header}>{header}</th>)}
        </tr>
        <DataTableColumnSearchRow headers={headers} columns={columns} data={data} dropdownColumns={DROPDOWN_COLUMNS} />
      </thead>
    </DataTable>
    </div>
  )
}

export default ReconciliationReportTable
