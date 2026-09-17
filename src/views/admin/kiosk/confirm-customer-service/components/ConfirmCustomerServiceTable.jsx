import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { baseDataTableOptions, initTableSearchAndSort, resetDataTableContainerSpacing } from '@/views/admin/apps/access-management/utils/dataTableOptions'
import DataTableColumnSearchRow from '@/views/admin/apps/access-management/utils/DataTableColumnSearchRow'
import ActionButton from '@/views/admin/merchants/components/ActionButton'
import { escapeHtml, money, formatDateTime } from '@/utils/reportHelpers'
DataTable.use(DT)

const textCol = (key) => ({ data: key, render: (value) => escapeHtml(value || '—') })

const columns = [
  { data: 'created_date', render: (value) => escapeHtml(formatDateTime(value)) },
  textCol('terminal'),
  { data: 'function', render: (value) => escapeHtml(value === 'withdraw' ? 'Withdraw' : 'Deposit') },
  { data: 'amount', render: (value) => escapeHtml(Number(value) > 0 ? money(value) : 'No change') },
  textCol('denominations'),
  {
    data: 'id',
    orderable: false,
    searchable: false,
    width: '160px',
    className: 'text-nowrap action-cell',
    render: (id) => `<div class="confirm-cs-action-slot" data-id="${id}"></div>`,
  },
]

const headers = ['Date/Time', 'Terminal', 'Function', 'Cash', 'Denominations', 'Action']

const ConfirmCustomerServiceTable = ({ data, onCheckTransaction }) => {
  const handlers = useRef({ onCheckTransaction })
  handlers.current = { onCheckTransaction }

  const rowMap = useMemo(() => {
    const map = {}
    data.forEach((item) => { map[item.id] = item })
    return map
  }, [data])

  const createdRow = useMemo(() => (row, rowData) => {
    const item = rowMap[rowData.id] ?? rowData
    const slot = row.querySelector('.confirm-cs-action-slot')
    if (!slot) return
    const root = slot.__actionRoot || createRoot(slot)
    slot.__actionRoot = root

    root.render(
      <ActionButton
        label="Check Transaction"
        icon="search"
        disabled={!item.session_available}
        onClick={() => handlers.current.onCheckTransaction(item)}
      />,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowMap])

  const options = useMemo(() => ({
    ...baseDataTableOptions,
    pageLength: 25,
    order: [[0, 'desc']],
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    initComplete: function () {
      initTableSearchAndSort(this.api())
      resetDataTableContainerSpacing(this.api())
    },
    createdRow,
  }), [createdRow])

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

export default ConfirmCustomerServiceTable
