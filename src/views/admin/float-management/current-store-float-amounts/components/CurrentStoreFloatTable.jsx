import { useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { FormControl } from 'react-bootstrap'
import ActionButton from '../../components/ActionButton'
import FloatDataTable from '../../components/FloatDataTable'
import { escapeHtml, money } from '../../components/format'

const statusLabel = (status) => {
  if (!status || status === 'REJECTED') return { text: 'NEED TO SETUP FIRST', className: 'bg-secondary-subtle text-secondary' }
  if (status === 'PENDING') return { text: 'WAITING FOR APPROVAL', className: 'bg-warning-subtle text-warning' }
  return { text: status, className: 'bg-success-subtle text-success' }
}

const columns = [
  { data: 'merchant_id' },
  { data: 'merchant_name', render: (value) => escapeHtml(value || '—') },
  { data: 'minimum_account', render: (value, type) => (type === 'display' ? escapeHtml(money(value)) : value) },
  { data: 'maximum_account', render: (value, type) => (type === 'display' ? escapeHtml(money(value)) : value) },
  { data: 'amount', render: (value, type) => (type === 'display' ? escapeHtml(money(value)) : value) },
  {
    data: 'status',
    render: (value, type) => {
      if (type !== 'display') return value || ''
      const label = statusLabel(value)
      return `<span class="badge ${label.className} badge-label">${label.text}</span>`
    },
  },
  { data: 'id', orderable: false, searchable: false, width: '110px', className: 'text-nowrap action-cell', render: (id) => `<div class="current-store-float-action-slot" data-id="${id}"></div>` },
]

const headers = ['Merchant ID', 'Merchant', 'Minimum', 'Maximum', 'Current Balance', 'Status', 'Action']

const CurrentStoreFloatTable = ({ data, canEdit, canAdd, onTopup, onRequestReplenishment }) => {
  const handlers = useRef({ onTopup, onRequestReplenishment })
  handlers.current = { onTopup, onRequestReplenishment }

  const tableData = useMemo(
    () => data.map((row) => ({ ...row, merchant_name: row.merchant?.dba_name || row.merchant?.legal_name || '' })),
    [data]
  )

  const rowMap = useMemo(() => {
    const map = {}
    tableData.forEach((item) => { map[item.id] = item })
    return map
  }, [tableData])

  const createdRow = useMemo(() => (row, rowData) => {
    const item = rowMap[rowData.id] ?? rowData
    const slot = row.querySelector('.current-store-float-action-slot')
    if (!slot) return
    const root = slot.__actionRoot || createRoot(slot)
    slot.__actionRoot = root

    const isActive = item.status === 'APPROVED' || item.status === 'CONFIRMED'

    root.render(
      <div className="d-flex gap-1">
        {canEdit && <ActionButton label="Account Topup" icon="cash-banknote" disabled={!isActive} onClick={() => handlers.current.onTopup(item)} />}
        {canAdd && <ActionButton label="Request Replenishment" icon="refresh" disabled={!isActive} onClick={() => handlers.current.onRequestReplenishment(item)} />}
      </div>
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canEdit, canAdd, rowMap])

  return (
    <FloatDataTable data={tableData} columns={columns} createdRow={createdRow}>
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
    </FloatDataTable>
  )
}

export default CurrentStoreFloatTable
