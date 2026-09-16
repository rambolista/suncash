import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo } from 'react'
import { baseDataTableOptions, initTableSearchAndSort, resetDataTableContainerSpacing } from '@/views/admin/apps/access-management/utils/dataTableOptions'

import DataTableColumnSearchRow from '@/views/admin/apps/access-management/utils/DataTableColumnSearchRow'
import { escapeHtml, money } from '@/utils/reportHelpers'
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

// Kiosk / Island / Location / Product are filtered via a dropdown of the values actually present, not free text.
const DROPDOWN_COLUMNS = { 0: 'terminal_code', 1: 'island', 2: 'location', 3: 'product' }

const AgentCommissionReportTable = ({ data }) => {
  const options = useMemo(() => ({
    ...baseDataTableOptions,
    pageLength: 25,
    // Legacy defaults to sorting by Agent Commission (last column) descending.
    order: [[7, 'desc']],
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    initComplete: function () {
      initTableSearchAndSort(this.api())
      resetDataTableContainerSpacing(this.api())
    },
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

export default AgentCommissionReportTable
