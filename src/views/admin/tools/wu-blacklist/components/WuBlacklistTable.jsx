import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { Button } from 'react-bootstrap'
import { baseDataTableOptions, initTableSearchAndSort, resetDataTableContainerSpacing } from '@/views/admin/apps/access-management/utils/dataTableOptions'
import DataTableColumnSearchRow from '@/views/admin/apps/access-management/utils/DataTableColumnSearchRow'
import { escapeHtml } from '@/utils/reportHelpers'

DataTable.use(DT)

const STATUS_BADGE = {
  active: 'bg-success-subtle text-success',
  inactive: 'bg-secondary-subtle text-secondary',
}

const textCol = (key) => ({ data: key, render: (value) => escapeHtml(value || '—') })

const headers = ['Name', 'Status', 'Action']

const WuBlacklistTable = ({ data, canEdit, onToggle }) => {
  const handlers = useRef({ onToggle })
  handlers.current = { onToggle }

  const rowMap = useMemo(() => {
    const map = {}
    data.forEach((item) => { map[item.id] = item })
    return map
  }, [data])

  const actionCol = {
    data: 'id',
    orderable: false,
    searchable: false,
    width: '110px',
    className: 'text-nowrap action-cell',
    render: (id) => `<div class="wu-blacklist-action-slot" data-id="${id}"></div>`,
  }

  const columns = useMemo(() => [
    textCol('name'),
    {
      data: 'status',
      render: (value, type) => (type === 'display'
        ? `<span class="badge ${STATUS_BADGE[value] || 'bg-secondary-subtle text-secondary'} badge-label">${escapeHtml((value || '').toUpperCase())}</span>`
        : value),
    },
    actionCol,
  ], [])

  const createdRow = useMemo(() => (row, rowData) => {
    if (!canEdit) return
    const item = rowMap[rowData.id] ?? rowData
    const slot = row.querySelector('.wu-blacklist-action-slot')
    if (!slot) return
    const root = slot.__actionRoot || createRoot(slot)
    slot.__actionRoot = root
    const isActive = item.status === 'active'
    root.render(
      <Button
        size="sm"
        variant={isActive ? 'primary' : 'warning'}
        onClick={() => handlers.current.onToggle(item)}
      >
        {isActive ? 'Inactivate' : 'Activate'}
      </Button>,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowMap, canEdit])

  const options = useMemo(() => ({
    ...baseDataTableOptions,
    pageLength: 25,
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    initComplete: function () {
      initTableSearchAndSort(this.api())
      resetDataTableContainerSpacing(this.api())
    },
    createdRow,
  }), [createdRow])

  return (
    <div className="table-responsive">
      <DataTable data={data} columns={canEdit ? columns : columns.slice(0, -1)} options={options} className="table dt-responsive align-middle mb-0 w-100">
        <thead className="thead-sm text-uppercase fs-xxs">
          <tr>
            {(canEdit ? headers : headers.slice(0, -1)).map((header) => <th key={header}>{header}</th>)}
          </tr>
          <DataTableColumnSearchRow headers={canEdit ? headers : headers.slice(0, -1)} columns={canEdit ? columns : columns.slice(0, -1)} data={data} />
        </thead>
      </DataTable>
    </div>
  )
}

export default WuBlacklistTable
