import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { Button } from 'react-bootstrap'
import { baseDataTableOptions, initTableSearchAndSort, resetDataTableContainerSpacing } from '@/views/admin/apps/access-management/utils/dataTableOptions'
import DataTableColumnSearchRow from '@/views/admin/apps/access-management/utils/DataTableColumnSearchRow'
import ActionButton from '@/views/admin/merchants/components/ActionButton'
import { escapeHtml } from '@/utils/reportHelpers'

DataTable.use(DT)

const VALIDATION_LABELS = {
  all: 'All Fields',
  except_name: 'Except Name',
  name_only: 'Only Name',
}

const textCol = (key) => ({ data: key, render: (value) => escapeHtml(value || '—') })

const headers = ['Card Holder Name', 'Last 4 Digit Card Number', 'Expiry Date', 'Card Type', 'Validation Type', 'Action']

const CardBlacklistTable = ({ data, canEdit, onEdit, onToggle }) => {
  const handlers = useRef({ onEdit, onToggle })
  handlers.current = { onEdit, onToggle }

  const rowMap = useMemo(() => {
    const map = {}
    data.forEach((item) => { map[item.id] = item })
    return map
  }, [data])

  const actionCol = {
    data: 'id',
    orderable: false,
    searchable: false,
    width: '150px',
    className: 'text-nowrap action-cell',
    render: (id) => `<div class="card-blacklist-action-slot" data-id="${id}"></div>`,
  }

  const columns = useMemo(() => [
    textCol('name'),
    textCol('last_4_digit_number'),
    textCol('expiry_date'),
    textCol('card_type'),
    { data: 'validation_type', render: (value) => escapeHtml(VALIDATION_LABELS[value] || value || '—') },
    actionCol,
  ], [])

  const createdRow = useMemo(() => (row, rowData) => {
    if (!canEdit) return
    const item = rowMap[rowData.id] ?? rowData
    const slot = row.querySelector('.card-blacklist-action-slot')
    if (!slot) return
    const root = slot.__actionRoot || createRoot(slot)
    slot.__actionRoot = root
    const isActive = item.is_active === 'Y'
    root.render(
      <div className="d-flex gap-1">
        <Button size="sm" variant={isActive ? 'primary' : 'danger'} onClick={() => handlers.current.onToggle(item)}>
          {isActive ? 'Inactivate' : 'Activate'}
        </Button>
        <ActionButton label="Edit" icon="pencil" onClick={() => handlers.current.onEdit(item)} />
      </div>,
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

export default CardBlacklistTable
