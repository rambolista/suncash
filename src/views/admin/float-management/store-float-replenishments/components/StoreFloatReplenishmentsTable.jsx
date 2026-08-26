import { useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { Badge, FormControl } from 'react-bootstrap'
import ActionButton from '../../components/ActionButton'
import FloatDataTable from '../../components/FloatDataTable'
import { escapeHtml, money } from '../../components/format'

const moneyCol = (key) => ({ data: key, render: (value, type) => (type === 'display' ? escapeHtml(money(value)) : value) })
const textCol = (key) => ({ data: key, render: (value) => escapeHtml(value || '—') })
const merchantCol = { data: 'merchant_name', render: (value) => escapeHtml(value || '—') }
const actionCol = { data: 'id', orderable: false, searchable: false, width: '110px', className: 'text-nowrap action-cell', render: (id) => `<div class="store-float-repl-action-slot" data-id="${id}"></div>` }

const COLUMNS_BY_TAB = {
  pending: {
    columns: [textCol('create_date'), merchantCol, moneyCol('amount'), textCol('create_by'), actionCol],
    headers: ['Created', 'Merchant', 'Amount', 'Created By', 'Action'],
  },
  approved: {
    columns: [
      textCol('create_date'), merchantCol, moneyCol('amount'), textCol('create_by'), textCol('approve_date'), textCol('approve_by'),
      {
        data: 'status',
        render: (value, type) => {
          if (type !== 'display') return value
          return value === 'CONFIRMED'
            ? '<span class="badge bg-success-subtle text-success badge-label">CONFIRMED</span>'
            : '<span class="badge bg-warning-subtle text-warning badge-label">FOR CONFIRMATION</span>'
        },
      },
      actionCol,
    ],
    headers: ['Created', 'Merchant', 'Amount', 'Created By', 'Approved', 'Approved By', 'Status', 'Action'],
  },
  rejected: {
    columns: [textCol('create_date'), merchantCol, moneyCol('amount'), textCol('create_by'), textCol('rejected_date'), textCol('rejected_by')],
    headers: ['Created', 'Merchant', 'Amount', 'Created By', 'Rejected', 'Rejected By'],
  },
}

const StoreFloatReplenishmentsTable = ({ tab, data, canApprove, onApprove, onReject, onConfirm }) => {
  const handlers = useRef({ onApprove, onReject, onConfirm })
  handlers.current = { onApprove, onReject, onConfirm }

  const tableData = useMemo(
    () => data.map((row) => ({ ...row, merchant_name: row.merchant?.dba_name || row.merchant?.legal_name || `Merchant #${row.merchant_id}` })),
    [data]
  )

  const rowMap = useMemo(() => {
    const map = {}
    tableData.forEach((item) => { map[item.id] = item })
    return map
  }, [tableData])

  const { columns, headers } = COLUMNS_BY_TAB[tab]

  const createdRow = useMemo(() => (row, rowData) => {
    const item = rowMap[rowData.id] ?? rowData
    const slot = row.querySelector('.store-float-repl-action-slot')
    if (!slot) return
    const root = slot.__actionRoot || createRoot(slot)
    slot.__actionRoot = root

    if (tab === 'pending') {
      root.render(canApprove ? (
        <div className="d-flex gap-1">
          <ActionButton label="Approve" icon="check" iconClassName="text-success" onClick={() => handlers.current.onApprove(item)} />
          <ActionButton label="Reject" icon="x" iconClassName="text-danger" onClick={() => handlers.current.onReject(item)} />
        </div>
      ) : null)
    } else if (tab === 'approved') {
      root.render(canApprove && item.status !== 'CONFIRMED' ? (
        <div className="d-flex gap-1">
          <ActionButton label="Confirm" icon="check" iconClassName="text-success" onClick={() => handlers.current.onConfirm(item)} />
          <ActionButton label="Reject" icon="x" iconClassName="text-danger" onClick={() => handlers.current.onReject(item)} />
        </div>
      ) : null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, canApprove, rowMap])

  return (
    <FloatDataTable data={tableData} columns={columns} createdRow={createdRow}>
      <thead className="thead-sm text-uppercase fs-xxs">
        <tr>
          {headers.map((header) => <th key={header}>{header}</th>)}
        </tr>
        <tr className="column-search-input-bar">
          {headers.map((header, index) => (
            <th key={header}>
              {!['Action', 'Status'].includes(header) && <FormControl size="sm" type="text" placeholder={header} className="bg-light-subtle border-light" data-col-index={index} />}
            </th>
          ))}
        </tr>
      </thead>
    </FloatDataTable>
  )
}

export default StoreFloatReplenishmentsTable
