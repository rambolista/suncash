import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo } from 'react'
import { baseDataTableOptions, initTableSearchAndSort, resetDataTableContainerSpacing } from '@/views/admin/apps/access-management/utils/dataTableOptions'
import DataTableColumnSearchRow from '@/views/admin/apps/access-management/utils/DataTableColumnSearchRow'
import { escapeHtml } from '@/utils/reportHelpers'

DataTable.use(DT)

const textCol = (key) => ({ data: key, render: (value) => escapeHtml(value || '—') })

const columns = [
  textCol('transaction_date'),
  textCol('branch'),
  textCol('terminal'),
  textCol('location'),
  textCol('island'),
  textCol('product'),
  textCol('transaction_id'),
  textCol('voucher_code'),
  textCol('cash_received'),
  textCol('fee_amount'),
  textCol('vat_amount'),
  textCol('total_fees'),
  textCol('product_amount'),
  textCol('feature'),
  textCol('error_message'),
]

const headers = [
  'Date/Time', 'Branch', 'Kiosk', 'Location', 'Island', 'Product', 'Transaction ID', 'Voucher Code',
  'Cash Received', 'Fee', 'VAT', 'Total Fees', 'Product Amount', 'Feature', 'Error Message',
]

const CreditVoucherReportTable = ({ data }) => {
  const options = useMemo(() => ({
    ...baseDataTableOptions,
    pageLength: 25,
    order: [[0, 'desc']],
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    initComplete: function () {
      initTableSearchAndSort(this.api())
      resetDataTableContainerSpacing(this.api())
    },
  }), [])

  return (
    <div className="table-responsive">
      <DataTable data={data} columns={columns} options={options} className="table dt-responsive align-middle mb-0 w-100 small">
        <thead className="thead-sm text-uppercase fs-xxs">
          <tr>
            {headers.map((header) => <th key={header}>{header}</th>)}
          </tr>
          <DataTableColumnSearchRow headers={headers} columns={columns} data={data} />
        </thead>
      </DataTable>
    </div>
  )
}

export default CreditVoucherReportTable
