import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { FormControl } from 'react-bootstrap'
import { bindColumnSearchInputs } from '@/views/admin/apps/access-management/utils/dataTableColumnSearch'
import { bindSortLabels } from '@/views/admin/apps/access-management/utils/dataTableSortLabels'
import { paginationIcons } from '@/views/admin/apps/access-management/utils/paginationIcons'
import ActionButton from './ActionButton'

DataTable.use(DT)

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const textCol = (key) => ({ data: key, render: (value) => escapeHtml(value || '—') })

const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(String(value).replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return escapeHtml(value)
  return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const dateCol = (key) => ({
  data: key,
  render: (value, type) => (type === 'display' ? formatDateTime(value) : value || ''),
})

const columns = [
  dateCol('creation_date'),
  textCol('client_id'),
  textCol('dba_name'),
  textCol('phone_no'),
  textCol('island'),
  textCol('suntag_shortcode'),
  { data: 'id', orderable: false, searchable: false, width: '130px', className: 'text-nowrap action-cell', render: (id) => `<div class="merchant-type-action-slot" data-id="${id}"></div>` },
]

const headers = ['Created', 'Client ID', 'Name', 'Phone', 'Island', 'Short Code', 'Action']

/** Shared pending/approved/rejected DataTable list for Business Management and Charity Management — same shape, only the filter and approve/reject wording differ per caller. */
const MerchantTypeQueueTable = ({ tab, data, canApprove, canEdit, onView, onApprove, onReject, onActivate }) => {
  const handlers = useRef({ onView, onApprove, onReject, onActivate })
  handlers.current = { onView, onApprove, onReject, onActivate }

  const rowMap = useMemo(() => {
    const map = {}
    data.forEach((item) => { map[item.id] = item })
    return map
  }, [data])

  const createdRow = useMemo(() => (row, rowData) => {
    const item = rowMap[rowData.id] ?? rowData
    const slot = row.querySelector('.merchant-type-action-slot')
    if (!slot) return
    const root = slot.__actionRoot || createRoot(slot)
    slot.__actionRoot = root

    root.render(
      <div className="d-flex gap-1">
        <ActionButton label="Initial Info" icon="file-info" onClick={() => handlers.current.onView(item)} />
        {tab === 'pending' && canApprove && (
          <>
            <ActionButton label="Approve" icon="check" iconClassName="text-success" onClick={() => handlers.current.onApprove(item)} />
            <ActionButton label="Reject" icon="x" iconClassName="text-danger" onClick={() => handlers.current.onReject(item)} />
          </>
        )}
        {tab === 'approved' && canEdit && Number(item.client_status_id) === -1 && (
          <ActionButton label="Activate" icon="circle-check" iconClassName="text-success" onClick={() => handlers.current.onActivate(item)} />
        )}
      </div>
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, canApprove, canEdit, rowMap])

  const options = useMemo(() => ({
    responsive: true,
    orderCellsTop: true,
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    initComplete: function () {
      bindColumnSearchInputs(this.api())
      bindSortLabels(this.api())
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

export default MerchantTypeQueueTable
