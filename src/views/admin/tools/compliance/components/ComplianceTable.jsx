import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { baseDataTableOptions, initTableSearchAndSort, resetDataTableContainerSpacing } from '@/views/admin/apps/access-management/utils/dataTableOptions'
import DataTableColumnSearchRow from '@/views/admin/apps/access-management/utils/DataTableColumnSearchRow'
import ActionButton from '@/views/admin/merchants/components/ActionButton'
import { escapeHtml } from '@/utils/reportHelpers'

DataTable.use(DT)

const headers = ['Name', 'Other Info', 'Type', 'Type Description', 'Action']

const ComplianceTable = ({ data, canEdit, onEdit, onDelete }) => {
  const handlers = useRef({ onEdit, onDelete })
  handlers.current = { onEdit, onDelete }

  const rowMap = useMemo(() => {
    const map = {}
    data.forEach((item) => { map[item.id] = item })
    return map
  }, [data])

  const actionCol = {
    data: 'id',
    orderable: false,
    searchable: false,
    width: '100px',
    className: 'text-nowrap action-cell',
    render: (id) => `<div class="compliance-action-slot" data-id="${id}"></div>`,
  }

  const columns = useMemo(() => [
    { data: 'name', render: (value) => escapeHtml(value || '—') },
    { data: 'other_info', render: (value) => escapeHtml(value || '—') },
    { data: 'type', render: (value) => escapeHtml(value || '—') },
    { data: 'type_desc', render: (value) => escapeHtml(value || '—') },
    actionCol,
  ], [])

  const createdRow = useMemo(() => (row, rowData) => {
    if (!canEdit) return
    const item = rowMap[rowData.id] ?? rowData
    const slot = row.querySelector('.compliance-action-slot')
    if (!slot) return
    const root = slot.__actionRoot || createRoot(slot)
    slot.__actionRoot = root
    root.render(
      <>
        <ActionButton label="Edit" icon="pencil" onClick={() => handlers.current.onEdit(item)} />
        <ActionButton label="Remove" icon="trash" iconClassName="text-danger" onClick={() => handlers.current.onDelete(item)} />
      </>,
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

export default ComplianceTable
