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
  textCol('kiosk'),
  textCol('island'),
  textCol('location'),
  moneyCol('cash_acceptor'),
  moneyCol('cash_dispenser'),
  moneyCol('cash_reserve'),
  moneyCol('cash_reject'),
  moneyCol('cash_exposure'),
]

const headers = ['Kiosk', 'Island', 'Location', 'Total Cash in Acceptor', 'Total Cash Dispenser', 'Total Cash Reserve', 'Total Cash Reject Bin', 'Cash Exposure']

// Kiosk / Island / Location are filtered via a dropdown of the values actually present, not free text.
const DROPDOWN_COLUMNS = { 0: 'kiosk', 1: 'island', 2: 'location' }

/** Legacy highlights a row pale-yellow when the acceptor is at/above its high-alert threshold or the dispenser is at/below its low-alert threshold. */
const createdRow = (row, rowData) => {
  if (rowData.flagged) {
    row.style.backgroundColor = 'rgba(255, 221, 87, 0.18)'
  }
}

const CashExposureReportTable = ({ data }) => {
  const options = useMemo(() => ({
    ...baseDataTableOptions,
    pageLength: 25,
    order: [[7, 'desc']],
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    initComplete: function () {
      initTableSearchAndSort(this.api())
      resetDataTableContainerSpacing(this.api())
    },
    createdRow,
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

export default CashExposureReportTable
