import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { FormControl } from 'react-bootstrap'
import { baseDataTableOptions, initTableSearchAndSort, resetDataTableContainerSpacing } from '@/views/admin/apps/access-management/utils/dataTableOptions'

import ActionButton from '@/views/admin/merchants/components/ActionButton'
import { escapeHtml, formatDateTime, money } from '@/utils/reportHelpers'
DataTable.use(DT)

const textCol = (key) => ({ data: key, render: (value) => escapeHtml(value || '—') })

const columns = [
  { data: 'create_date', render: (value, type) => (type === 'display' ? formatDateTime(value) : value || '') },
  textCol('machine'),
  textCol('island_name'),
  textCol('location'),
  { data: 'balance', render: (value, type) => (type === 'display' ? money(value, 'BSD ') : value) },
  {
    data: 'id',
    orderable: false,
    searchable: false,
    width: '110px',
    className: 'text-nowrap action-cell',
    render: (id) => `<div class="kiosk-statement-action-slot" data-id="${id}"></div>`,
  },
]

const headers = ['Registered Date', 'Machine', 'Island', 'Location', 'Balance', 'Action']

const StatementTable = ({ data, onViewDetails }) => {
  const handlers = useRef({ onViewDetails })
  handlers.current = { onViewDetails }

  const rowMap = useMemo(() => {
    const map = {}
    data.forEach((item) => { map[item.id] = item })
    return map
  }, [data])

  const createdRow = useMemo(() => (row, rowData) => {
    const item = rowMap[rowData.id] ?? rowData
    const slot = row.querySelector('.kiosk-statement-action-slot')
    if (!slot) return
    const root = slot.__actionRoot || createRoot(slot)
    slot.__actionRoot = root

    root.render(<ActionButton label="View Details" icon="eye" onClick={() => handlers.current.onViewDetails(item)} />)
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
        <tr className="column-search-input-bar">
          {headers.map((header, index) => (
            <th key={header}>
              {header !== 'Action' && <FormControl size="sm" type="text" placeholder={header} className="bg-light-subtle border-light" data-col-index={index} />}
            </th>
          ))}
        </tr>
      </thead>
    </DataTable>
    </div>
  )
}

export default StatementTable
