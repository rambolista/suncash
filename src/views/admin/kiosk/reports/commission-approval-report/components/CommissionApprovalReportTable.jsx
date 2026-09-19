import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo } from 'react'
import { baseDataTableOptions, initTableSearchAndSort, resetDataTableContainerSpacing } from '@/views/admin/apps/access-management/utils/dataTableOptions'

import DataTableColumnSearchRow from '@/views/admin/apps/access-management/utils/DataTableColumnSearchRow'
import { escapeHtml, money } from '@/utils/reportHelpers'
DataTable.use(DT)

const STATUS_BADGE = {
  pending: 'bg-warning-subtle text-warning',
  processed: 'bg-success-subtle text-success',
  rejected: 'bg-danger-subtle text-danger',
}
const STATUS_LABEL = { pending: 'Pending', processed: 'Approved', rejected: 'Rejected' }

const textCol = (key) => ({ data: key, render: (value) => escapeHtml(value || '—') })
const moneyCol = (key) => ({ data: key, render: (value) => escapeHtml(money(value)) })

const columns = [
  textCol('create_date'),
  textCol('kiosk'),
  textCol('partner_name'),
  textCol('partner_mobile'),
  moneyCol('total_amount'),
  moneyCol('total_revenue'),
  textCol('commission_type'),
  textCol('commission_rate'),
  moneyCol('commission_payment'),
  {
    data: 'status',
    render: (value, type) => (type === 'display'
      ? `<span class="badge ${STATUS_BADGE[value] || 'bg-secondary-subtle text-secondary'} badge-label">${escapeHtml(STATUS_LABEL[value] || value)}</span>`
      : (STATUS_LABEL[value] || value)),
  },
  textCol('decided_by'),
  textCol('note'),
]

const headers = [
  'Transaction Date', 'Kiosk', 'Partner Name', 'Partner Mobile', 'Transaction Volume',
  'Revenue', 'Commission Type', 'Commission Rate', 'Commission Payment', 'Status', 'Approved/Rejected By', 'Note',
]

const CommissionApprovalReportTable = ({ data }) => {
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

export default CommissionApprovalReportTable
