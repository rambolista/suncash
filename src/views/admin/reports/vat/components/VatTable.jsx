import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo } from 'react'
import { baseDataTableOptions, initTableSearchAndSort, resetDataTableContainerSpacing } from '@/views/admin/apps/access-management/utils/dataTableOptions'
import DataTableColumnSearchRow from '@/views/admin/apps/access-management/utils/DataTableColumnSearchRow'
import { escapeHtml } from '@/utils/reportHelpers'

DataTable.use(DT)

const headers = ['Transaction Id', 'Transaction Date', 'Transaction Type', 'Transaction Amount', 'Fee Amount', 'Vat', 'Tax Stamp']

// Money cells are pre-formatted ("1,234.50"): sort on the number, show the text.
const toNumber = (value) => Number(String(value).replace(/,/g, '')) || 0
const money = (key) => ({ data: key, className: 'text-end', render: (value, type) => (type === 'display' ? escapeHtml(value) : toNumber(value)) })

/** Money-transfer VAT rows for the chosen period (legacy `reports/vat.php`). */
const VatTable = ({ data }) => {
  const columns = useMemo(() => [
    { data: 'transaction_id', render: (value) => escapeHtml(value || '—') },
    // Shows the day ("March 04 2018") like legacy; sorts on the full timestamp.
    { data: 'transaction_date', className: 'text-nowrap', render: (value, type, row) => (type === 'sort' ? row.sort_date : escapeHtml(value)) },
    { data: 'transaction_type', render: (value) => escapeHtml(value || '—') },
    money('amount'),
    money('fee'),
    money('vat'),
    money('stamp'),
  ], [])

  const options = useMemo(() => ({
    ...baseDataTableOptions,
    pageLength: 25,
    order: [], // (date, id) order from the server until a header is clicked
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
            {headers.map((header, i) => <th key={header} className={i >= 3 ? 'text-end' : ''}>{header}</th>)}
          </tr>
          <DataTableColumnSearchRow headers={headers} columns={columns} data={data} />
        </thead>
      </DataTable>
    </div>
  )
}

export default VatTable
