import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import ActionButton from '../../../merchants/components/ActionButton'
import { paginationIcons } from '../../../apps/access-management/utils/paginationIcons'
import { initTableSearchAndSort, resetDataTableContainerSpacing } from '../../../apps/access-management/utils/dataTableOptions'
import { escapeHtml } from '@/utils/reportHelpers'
import { ACTION_CONFIG, STATUS_ACTIONS, STATUS_COLORS, STATUS_LABELS } from '../paymentActions'

DataTable.use(DT)

const textCol = (key) => ({ data: key, render: (value) => escapeHtml(value || '—') })

const typeCol = {
  data: 'payment_type',
  render: (value, type, row) => {
    if (type !== 'display') return value
    const manual = row.source === 'MANUAL' ? ' <span class="badge bg-secondary-subtle text-secondary ms-1">Manual</span>' : ''
    return `${escapeHtml(value)}${manual}`
  },
}

const statusCol = {
  data: 'status',
  render: (value, type) => {
    if (type !== 'display') return value
    return `<span class="badge text-white" style="background-color:${STATUS_COLORS[value] || '#6c757d'}">${escapeHtml(STATUS_LABELS[value] || value)}</span>`
  },
}

const columns = [
  textCol('transaction_date'),
  textCol('transaction_id'),
  typeCol,
  textCol('company_name'),
  textCol('payment_method'),
  { data: 'amount', render: (value) => `$${escapeHtml(value)}` },
  textCol('settlement_period'),
  statusCol,
  {
    data: 'id',
    orderable: false,
    searchable: false,
    width: '160px',
    className: 'text-nowrap action-cell',
    render: (id) => `<div class="payment-mgmt-action-slot" data-id="${id}"></div>`,
  },
]

const headers = ['Date/Time', 'Transaction ID', 'Payment Type', 'Company Name', 'Payment Method', 'Amount', 'Settlement Period', 'Status', 'Actions']

const PaymentManagementTable = ({ data, permissions, onView, onEdit, onHistory, onAction, onReasonAction, onCloneDraft }) => {
  const handlers = useRef({})
  handlers.current = { onView, onEdit, onHistory, onAction, onReasonAction, onCloneDraft }

  const rowMap = useMemo(() => {
    const map = {}
    data.forEach((item) => { map[item.id] = item })
    return map
  }, [data])

  const createdRow = useMemo(() => (row, rowData) => {
    const item = rowMap[rowData.id] ?? rowData
    const slot = row.querySelector('.payment-mgmt-action-slot')
    if (!slot) return
    const root = slot.__actionRoot || createRoot(slot)
    slot.__actionRoot = root

    const actionKeys = STATUS_ACTIONS[item.status] || []
    const h = handlers.current

    const runAction = (key) => {
      const config = ACTION_CONFIG[key]
      if (key === 'clone_draft') return h.onCloneDraft(item)
      if (config.reasonRequired) return h.onReasonAction(item, key)
      return h.onAction(item, key)
    }

    root.render(
      <>
        {permissions.can_view && <ActionButton label="View" icon="eye" onClick={() => h.onView(item)} />}
        {actionKeys.includes('edit') && permissions.can_edit && <ActionButton label="Edit" icon="edit" onClick={() => h.onEdit(item)} />}
        {actionKeys.filter((k) => k !== 'edit').map((key) => {
          const config = ACTION_CONFIG[key]
          if (!permissions[config.permission]) return null
          return <ActionButton key={key} label={config.label} icon={config.icon} iconClassName={`text-${config.variant}`} onClick={() => runAction(key)} />
        })}
        {permissions.can_view && <ActionButton label="History" icon="history" onClick={() => h.onHistory(item)} />}
      </>,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowMap, permissions])

  const options = useMemo(() => ({
    responsive: false,
    pageLength: 25,
    order: [[0, 'desc']],
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    language: { paginate: paginationIcons },
    createdRow,
    initComplete: function () {
      initTableSearchAndSort(this.api())
      resetDataTableContainerSpacing(this.api())
    },
  }), [createdRow])

  return (
    <div className="table-responsive">
      <DataTable data={data} columns={columns} options={options} className="table dt-responsive align-middle mb-0 w-100 small">
        <thead className="thead-sm text-uppercase fs-xxs">
          <tr>
            {headers.map((header) => <th key={header}>{header}</th>)}
          </tr>
        </thead>
      </DataTable>
    </div>
  )
}

export default PaymentManagementTable
