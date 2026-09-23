import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo } from 'react'
import { baseDataTableOptions, initTableSearchAndSort, resetDataTableContainerSpacing } from '@/views/admin/apps/access-management/utils/dataTableOptions'
import DataTableColumnSearchRow from '@/views/admin/apps/access-management/utils/DataTableColumnSearchRow'
import { escapeHtml, formatDateTime, money } from '@/utils/reportHelpers'

DataTable.use(DT)

const textCol = (key) => ({ data: key, render: (value) => escapeHtml(value || '—') })

const headers = ['Timestamp', 'Merchant Name', 'Order ID', 'Transaction ID', 'Amount', 'Card Name', 'Last 4 Digit Card Number', 'Card Type', 'Source', 'Auth Code', 'Status', 'Status Description']

const columns = [
  { data: 'date_created', render: (value, type) => (type === 'display' ? formatDateTime(value) : value || '') },
  textCol('merchant_name'),
  textCol('order_id'),
  textCol('reference_number'),
  { data: 'amount', render: (value, type) => (type === 'display' ? escapeHtml(money(value)) : value) },
  textCol('card_name'),
  textCol('last_4_digit_card'),
  textCol('card_type'),
  textCol('source'),
  textCol('auth_code'),
  textCol('status'),
  textCol('message'),
]

const CardLogsTable = ({ data }) => {
  const options = useMemo(() => ({
    ...baseDataTableOptions,
    order: [[0, 'desc']],
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
          <DataTableColumnSearchRow headers={headers} columns={columns} data={data} />
        </thead>
      </DataTable>
    </div>
  )
}

export default CardLogsTable
