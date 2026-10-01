import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo } from 'react'
import { baseDataTableOptions, initTableSearchAndSort, resetDataTableContainerSpacing } from '@/views/admin/apps/access-management/utils/dataTableOptions'
import DataTableColumnSearchRow from '@/views/admin/apps/access-management/utils/DataTableColumnSearchRow'
import { escapeHtml } from '@/utils/reportHelpers'

DataTable.use(DT)

const STATUS_BADGE = {
  ACTIVE: 'bg-success-subtle text-success',
  INACTIVE: 'bg-secondary-subtle text-secondary',
}

const textCol = (key) => ({ data: key, render: (value) => escapeHtml(value || '—') })

const headers = ['Account Name', 'Device No', 'Type', 'Status', 'Created Date']

const SanddollarTable = ({ data }) => {
  const columns = useMemo(() => [
    textCol('account_name'),
    textCol('device_no'),
    { data: 'type', render: (value) => escapeHtml((value || '—').toUpperCase()) },
    {
      data: 'status',
      render: (value, type) => (type === 'display'
        ? `<span class="badge ${STATUS_BADGE[value] || 'bg-secondary-subtle text-secondary'} badge-label">${escapeHtml(value)}</span>`
        : value),
    },
    textCol('created_date'),
  ], [])

  const options = useMemo(() => ({
    ...baseDataTableOptions,
    pageLength: 25,
    order: [[4, 'desc']],
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

export default SanddollarTable
