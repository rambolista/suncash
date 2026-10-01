import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo } from 'react'
import { baseDataTableOptions, initTableSearchAndSort, resetDataTableContainerSpacing } from '@/views/admin/apps/access-management/utils/dataTableOptions'
import DataTableColumnSearchRow from '@/views/admin/apps/access-management/utils/DataTableColumnSearchRow'
import { escapeHtml, formatDateTime } from '@/utils/reportHelpers'

DataTable.use(DT)

const headers = ['Ticket', 'Created Date', 'Prize', 'Item Image']

const InstantWinnersTable = ({ data }) => {
  const columns = useMemo(() => [
    { data: 'ticket_id', render: (value) => escapeHtml(value || '—') },
    { data: 'created_date', render: (value, type) => (type === 'display' ? formatDateTime(value) : value || '') },
    { data: 'prize_description', render: (value) => escapeHtml(value || '—') },
    {
      data: 'item_image',
      orderable: false,
      searchable: false,
      render: (value, type) => (type === 'display'
        ? (value ? `<div class="text-center"><img src="${escapeHtml(value)}" alt="" style="height:60px;width:60px;object-fit:cover" /></div>` : '')
        : value),
    },
  ], [])

  const options = useMemo(() => ({
    ...baseDataTableOptions,
    pageLength: 25,
    order: [[1, 'desc']],
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

export default InstantWinnersTable
