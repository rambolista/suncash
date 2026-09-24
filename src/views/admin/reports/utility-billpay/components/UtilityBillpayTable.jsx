import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo } from 'react'
import { baseDataTableOptions, initTableSearchAndSort, resetDataTableContainerSpacing } from '@/views/admin/apps/access-management/utils/dataTableOptions'
import { escapeHtml, formatDateTime } from '@/utils/reportHelpers'

DataTable.use(DT)

const textCol = (key) => ({ data: key, render: (value) => escapeHtml(value || '—') })
const dateCol = (key) => ({ data: key, render: (value, type) => (type === 'display' ? formatDateTime(value) : value || '') })

const SOURCE_BADGE = (value) => {
  const variant = value === 'KIOSK' ? 'info' : value === 'CustomerApp' ? 'warning' : value === 'WebPOS' ? 'primary' : 'secondary'
  return `<span class="badge bg-${variant}-subtle text-${variant} badge-label">${escapeHtml(value || '—')}</span>`
}

const COLUMNS = [
  { ...dateCol('transaction_date'), className: 'text-nowrap' },
  textCol('transaction_number'),
  textCol('customer_name'),
  textCol('customer_mobile'),
  textCol('biller_code'),
  textCol('bill_account_no'),
  textCol('bill_amount'),
  { data: 'source', render: (value, type) => (type === 'display' ? SOURCE_BADGE(value) : value || '') },
]

const HEADERS = ['Date Time', 'Transaction Number', 'Customer Name', 'Customer Mobile', 'Utility Company', 'Account Number', 'Amount Paid', 'Source']

/** Server-paginated DataTable for Utility Billpay — one already-fetched page rendered at a time, same pattern as Money Transfer. */
const UtilityBillpayTable = ({ data }) => {
  const options = useMemo(() => ({
    ...baseDataTableOptions,
    searching: false,
    order: [[0, 'desc']],
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    initComplete: function () {
      initTableSearchAndSort(this.api())
      resetDataTableContainerSpacing(this.api())
    },
  }), [])

  return (
    <div className="table-responsive">
      <DataTable data={data} columns={COLUMNS} options={options} className="table dt-responsive align-middle mb-0 w-100 small">
        <thead className="thead-sm text-uppercase fs-xxs">
          <tr>
            {HEADERS.map((header, i) => <th key={i}>{header}</th>)}
          </tr>
        </thead>
      </DataTable>
    </div>
  )
}

export default UtilityBillpayTable
