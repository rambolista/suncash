import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { FormControl } from 'react-bootstrap'
import { bindColumnSearchInputs } from '@/views/admin/apps/access-management/utils/dataTableColumnSearch'
import { bindSortLabels } from '@/views/admin/apps/access-management/utils/dataTableSortLabels'
import { paginationIcons } from '@/views/admin/apps/access-management/utils/paginationIcons'
import ActionButton from '@/views/admin/merchants/components/ActionButton'
import { escapeHtml } from './format'

DataTable.use(DT)

const textCol = (key) => ({ data: key, render: (value) => escapeHtml(value || '—') })

const columns = [
  textCol('replenishment_date'),
  textCol('kiosk_terminal'),
  textCol('island'),
  textCol('location'),
  {
    data: 'terminal_id',
    orderable: false,
    searchable: false,
    width: '220px',
    className: 'text-nowrap action-cell',
    render: (id) => `<div class="kiosk-replenish-action-slot" data-id="${id}"></div>`,
  },
]

const headers = ['Replenishment Date', 'Kiosk Terminal', 'Island', 'Location', 'Action']

const ReplenishTable = ({ data, onViewMeter, onViewAddCash, onViewClearAcceptor }) => {
  const handlers = useRef({ onViewMeter, onViewAddCash, onViewClearAcceptor })
  handlers.current = { onViewMeter, onViewAddCash, onViewClearAcceptor }

  const rowMap = useMemo(() => {
    const map = {}
    data.forEach((item) => { map[item.terminal_id] = item })
    return map
  }, [data])

  const createdRow = useMemo(() => (row, rowData) => {
    const item = rowMap[rowData.terminal_id] ?? rowData
    const slot = row.querySelector('.kiosk-replenish-action-slot')
    if (!slot) return
    const root = slot.__actionRoot || createRoot(slot)
    slot.__actionRoot = root

    root.render(
      <>
        <ActionButton label="View Meter" icon="gauge" onClick={() => handlers.current.onViewMeter(item)} />
        <ActionButton label="View Add Cash" icon="cash" onClick={() => handlers.current.onViewAddCash(item)} />
        <ActionButton label="View Clear Acceptor" icon="eraser" onClick={() => handlers.current.onViewClearAcceptor(item)} />
      </>,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowMap])

  const options = useMemo(() => ({
    responsive: true,
    pageLength: 25,
    orderCellsTop: true,
    order: [[1, 'asc']],
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
    <DataTable data={data} columns={columns} options={options} className="table dt-responsive align-middle mb-0 w-100">
      <thead className="thead-sm text-uppercase fs-xxs">
        <tr>
          {headers.map((header) => <th key={header}>{header}</th>)}
        </tr>
        <tr className="column-search-input-bar">
          {headers.map((header, index) => (
            <th key={header}>
              {header !== 'Action' && <FormControl size="sm" type="text" placeholder={header} className="bg-light-subtle border-light" data-col-index={index} />}
            </th>
          ))}
        </tr>
      </thead>
    </DataTable>
  )
}

export default ReplenishTable
