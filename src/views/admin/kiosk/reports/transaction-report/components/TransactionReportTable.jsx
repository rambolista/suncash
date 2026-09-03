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
  textCol('datetime'),
  textCol('terminal_code'),
  textCol('location'),
  textCol('island'),
  textCol('product'),
  textCol('transaction_id'),
  textCol('customer_number'),
  moneyCol('total_amount'),
  moneyCol('fee_amount'),
  moneyCol('vat_amount'),
  moneyCol('total_fees'),
  moneyCol('amount'),
]

const headers = [
  'Date/Time', 'Kiosk', 'Location', 'Island', 'Product', 'Transaction ID',
  'Customer / Account No', 'Cash Received', 'Fee', 'VAT', 'Total Fees', 'Product Amount',
]

// Kiosk / Location / Island / Product are filtered via a dropdown of the values actually present, not free text.
const DROPDOWN_COLUMNS = { 1: 'terminal_code', 2: 'location', 3: 'island', 4: 'product' }

const TransactionReportTable = ({ data }) => {
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
        <DataTableColumnSearchRow headers={headers} columns={columns} data={data} dropdownColumns={DROPDOWN_COLUMNS} />
      </thead>
    </DataTable>
  )
}

export default TransactionReportTable
