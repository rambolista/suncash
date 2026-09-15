import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { Form } from 'react-bootstrap'
import { bindColumnSearchInputs } from '@/views/admin/apps/access-management/utils/dataTableColumnSearch'
import { bindSortLabels } from '@/views/admin/apps/access-management/utils/dataTableSortLabels'
import { paginationIcons } from '@/views/admin/apps/access-management/utils/paginationIcons'
import DataTableColumnSearchRow from '@/views/admin/apps/access-management/utils/DataTableColumnSearchRow'
import ActionButton from '@/views/admin/merchants/components/ActionButton'
import { escapeHtml, money } from './format'

DataTable.use(DT)

const textCol = (key) => ({ data: key, render: (value) => escapeHtml(value || '—') })
const moneyCol = (key) => ({ data: key, render: (value) => escapeHtml(money(value)) })
const checkCol = (key) => ({
  data: key,
  orderable: false,
  render: (value, type) => (type === 'display' ? (value ? '✅' : '❌') : (value ? '1' : '0')),
})

const columns = [
  textCol('date_added'),
  textCol('kiosk_id'),
  textCol('kiosk_location'),
  moneyCol('total_withdrawn'),
  moneyCol('recycled'),
  moneyCol('not_recycled'),
  textCol('deposit_status_label'),
  checkCol('in_custody'),
  checkCol('secured'),
  moneyCol('held'),
  textCol('held_since'),
  textCol('last_updated_by'),
  textCol('notes'),
  {
    data: 'id',
    orderable: false,
    searchable: false,
    width: '180px',
    className: 'text-nowrap action-cell',
    render: (id) => `<div class="cash-mgmt-action-slot" data-id="${id}"></div>`,
  },
]

const headers = [
  'Date Added', 'Kiosk ID', 'Kiosk Location', 'Total Withdrawn', 'Recycled', 'Not Recycled',
  'Deposit Status', 'In Custody', 'Secured', 'Held', 'Held Since', 'Last Updated By', 'Notes', 'Action',
]

const RowAction = ({ item, canExecute, onAction, onView }) => {
  if (item.is_view_only) {
    return <ActionButton label="View Details" icon="eye" onClick={() => onView(item)} />
  }

  if (!canExecute) {
    return <span className="text-muted small">No access</span>
  }

  return (
    <Form.Select
      size="sm"
      defaultValue=""
      onChange={(e) => {
        const action = e.target.value
        if (!action) return
        onAction(item, action)
        e.target.value = ''
      }}
    >
      <option value="">Select Action</option>
      {item.available_actions.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
    </Form.Select>
  )
}

const CashManagementTable = ({ data, canExecute, onAction, onView }) => {
  const handlers = useRef({ canExecute, onAction, onView })
  handlers.current = { canExecute, onAction, onView }

  const rowMap = useMemo(() => {
    const map = {}
    data.forEach((item) => { map[item.id] = item })
    return map
  }, [data])

  const createdRow = useMemo(() => (row, rowData) => {
    const item = rowMap[rowData.id] ?? rowData
    const slot = row.querySelector('.cash-mgmt-action-slot')
    if (!slot) return
    const root = slot.__actionRoot || createRoot(slot)
    slot.__actionRoot = root

    root.render(
      <RowAction
        item={item}
        canExecute={handlers.current.canExecute}
        onAction={handlers.current.onAction}
        onView={handlers.current.onView}
      />,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowMap])

  const options = useMemo(() => ({
    responsive: false,
    pageLength: 25,
    orderCellsTop: true,
    order: [[0, 'desc']],
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

export default CashManagementTable
