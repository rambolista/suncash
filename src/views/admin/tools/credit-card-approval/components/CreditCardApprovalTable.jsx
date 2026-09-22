import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { baseDataTableOptions, initTableSearchAndSort, resetDataTableContainerSpacing } from '@/views/admin/apps/access-management/utils/dataTableOptions'
import DataTableColumnSearchRow from '@/views/admin/apps/access-management/utils/DataTableColumnSearchRow'
import ActionButton from '@/views/admin/merchants/components/ActionButton'
import { escapeHtml, formatDateTime } from '@/utils/reportHelpers'

DataTable.use(DT)

const STATUS_BADGE = {
  for_approval: 'bg-warning-subtle text-warning',
  approved: 'bg-success-subtle text-success',
  rejected: 'bg-danger-subtle text-danger',
}

const STATUS_LABELS = { for_approval: 'For Approval', approved: 'Approved', rejected: 'Rejected' }

const BASE_HEADERS = ['Date Created', 'Card Name', 'Last 4 Digits', 'Type', 'ID Number', 'Status']

const CreditCardApprovalTable = ({ data, tab, canEdit, onView, onApprove, onReject }) => {
  const handlers = useRef({ onView, onApprove, onReject })
  handlers.current = { onView, onApprove, onReject }

  const rowMap = useMemo(() => {
    const map = {}
    data.forEach((item) => { map[item.id] = item })
    return map
  }, [data])

  const actionCol = {
    data: 'id',
    orderable: false,
    searchable: false,
    width: tab === 'pending' ? '220px' : '90px',
    className: 'text-nowrap action-cell',
    render: (id) => `<div class="cc-approval-action-slot" data-id="${id}"></div>`,
  }

  const columns = useMemo(() => {
    const base = [
      { data: 'created_at', render: (value, type) => (type === 'display' ? escapeHtml(formatDateTime(value)) : value || '') },
      { data: 'card_name', render: (value) => escapeHtml(value || '—') },
      { data: 'card_last4digits', render: (value) => escapeHtml(value || '—') },
      { data: 'card_type', render: (value) => escapeHtml(value || '—') },
      { data: 'id_number', render: (value) => escapeHtml(value || '—') },
      {
        data: 'status',
        render: (value, type) => (type === 'display'
          ? `<span class="badge ${STATUS_BADGE[value] || 'bg-secondary-subtle text-secondary'} badge-label">${escapeHtml(STATUS_LABELS[value] || value)}</span>`
          : value),
      },
    ]
    if (tab === 'rejected') base.push({ data: 'remarks', render: (value) => escapeHtml(value || '—') })
    return [...base, actionCol]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const headers = useMemo(() => [
    ...BASE_HEADERS,
    ...(tab === 'rejected' ? ['Reason'] : []),
    'Action',
  ], [tab])

  const createdRow = useMemo(() => (row, rowData) => {
    const item = rowMap[rowData.id] ?? rowData
    const slot = row.querySelector('.cc-approval-action-slot')
    if (!slot) return
    const root = slot.__actionRoot || createRoot(slot)
    slot.__actionRoot = root
    root.render(
      <>
        <ActionButton label="View" icon="eye" onClick={() => handlers.current.onView(item)} />
        {canEdit && tab === 'pending' && (
          <>
            <ActionButton label="Approve" icon="circle-check" iconClassName="text-success" onClick={() => handlers.current.onApprove(item)} />
            <ActionButton label="Reject" icon="ban" iconClassName="text-danger" onClick={() => handlers.current.onReject(item)} />
          </>
        )}
      </>,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowMap, tab, canEdit])

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

export default CreditCardApprovalTable
