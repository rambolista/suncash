import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { bindColumnSearchInputs } from '@/views/admin/apps/access-management/utils/dataTableColumnSearch'
import { bindSortLabels } from '@/views/admin/apps/access-management/utils/dataTableSortLabels'
import { paginationIcons } from '@/views/admin/apps/access-management/utils/paginationIcons'
import DataTableColumnSearchRow from '@/views/admin/apps/access-management/utils/DataTableColumnSearchRow'
import ActionButton from '@/views/admin/merchants/components/ActionButton'
import { escapeHtml, money, percent } from './format'

DataTable.use(DT)

const textCol = (key) => ({ data: key, render: (value) => escapeHtml(value || '—') })
const percentCol = (key) => ({ data: key, render: (value) => escapeHtml(percent(value)) })
const moneyCol = (key) => ({ data: key, render: (value) => escapeHtml(money(value)) })

const columns = [
  textCol('product_name'),
  percentCol('provider_percentage'),
  moneyCol('cap_amount'),
  moneyCol('minimum_amount'),
  { data: 'frequency_in_limit_days' },
  percentCol('agent_percentage'),
  percentCol('suncash_percentage'),
  percentCol('owner_percentage'),
  {
    data: 'id',
    orderable: false,
    searchable: false,
    width: '80px',
    className: 'text-center action-cell',
    render: (id) => `<div class="commission-profile-action-slot" data-id="${id}"></div>`,
  },
]

const headers = [
  'Transaction Type', 'Provider %', 'Cap Amount', 'Minimum Amount',
  'Frequency Limit (Days)', 'Agent %', 'Suncash %', 'Owner %', 'Action',
]

const CommissionProfileTable = ({ rows, canEdit, onEdit }) => {
  const handlers = useRef({ onEdit })
  handlers.current = { onEdit }

  const rowMap = useMemo(() => {
    const map = {}
    rows.forEach((item) => { map[item.id] = item })
    return map
  }, [rows])

  const createdRow = useMemo(() => (row, rowData) => {
    if (!canEdit) return
    const item = rowMap[rowData.id] ?? rowData
    const slot = row.querySelector('.commission-profile-action-slot')
    if (!slot) return
    const root = slot.__actionRoot || createRoot(slot)
    slot.__actionRoot = root

    root.render(<ActionButton label="Edit" icon="edit" onClick={() => handlers.current.onEdit(item)} />)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowMap, canEdit])

  const options = useMemo(() => ({
    responsive: true,
    pageLength: 25,
    orderCellsTop: true,
    order: [[0, 'asc']],
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    initComplete: function () {
      bindColumnSearchInputs(this.api())
      bindSortLabels(this.api())
      const container = this.api().table().container()
      container.style.marginTop = '0'
      const controlsRow = container.querySelector(':scope > .row')
      controlsRow?.classList.add('mb-3')
    },
    language: { paginate: paginationIcons },
    createdRow,
  }), [createdRow])

  return (
    <DataTable data={rows} columns={columns} options={options} className="table dt-responsive align-middle mb-0 w-100">
      <thead className="thead-sm text-uppercase fs-xxs">
        <tr>
          {headers.map((header) => <th key={header}>{header}</th>)}
        </tr>
        <DataTableColumnSearchRow headers={headers} columns={columns} data={rows} />
      </thead>
    </DataTable>
  )
}

export default CommissionProfileTable
