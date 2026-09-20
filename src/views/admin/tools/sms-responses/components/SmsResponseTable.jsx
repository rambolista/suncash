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

const columns = [
  {
    data: 'response_title',
    render: (value, type, row) => (type === 'display' ? `${escapeHtml(value)}${row.is_inherited ? ' <span class="text-muted">*</span>' : ''}` : value),
  },
  { data: 'message_template', render: (value) => escapeHtml(value || '—') },
  {
    data: 'response_title',
    orderable: false,
    searchable: false,
    width: '90px',
    className: 'text-nowrap action-cell',
    render: (value) => `<div class="sms-response-action-slot" data-title="${escapeHtml(value)}"></div>`,
  },
]

const headers = ['Template', 'Message / Response', 'Action']

/** `*` marks a row inherited from the "All Merchants" baseline rather than overridden for the currently selected merchant — same convention legacy used. */
const SmsResponseTable = ({ data, canEdit, onEdit }) => {
  const handlers = useRef({ onEdit })
  handlers.current = { onEdit }

  const rowMap = useMemo(() => {
    const map = {}
    data.forEach((item) => { map[item.response_title] = item })
    return map
  }, [data])

  const createdRow = useMemo(() => (row, rowData) => {
    if (!canEdit) return
    const item = rowMap[rowData.response_title] ?? rowData
    const slot = row.querySelector('.sms-response-action-slot')
    if (!slot) return
    const root = slot.__actionRoot || createRoot(slot)
    slot.__actionRoot = root
    root.render(<ActionButton label="Edit" icon="pencil" onClick={() => handlers.current.onEdit(item)} />)
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
      <DataTable data={data} columns={canEdit ? columns : columns.slice(0, 2)} options={options} className="table dt-responsive align-middle mb-0 w-100">
        <thead className="thead-sm text-uppercase fs-xxs">
          <tr>
            {(canEdit ? headers : headers.slice(0, 2)).map((header) => <th key={header}>{header}</th>)}
          </tr>
          <DataTableColumnSearchRow headers={canEdit ? headers : headers.slice(0, 2)} columns={canEdit ? columns : columns.slice(0, 2)} data={data} />
        </thead>
      </DataTable>
    </div>
  )
}

export default SmsResponseTable
