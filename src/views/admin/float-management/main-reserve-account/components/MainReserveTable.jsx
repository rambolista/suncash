import { useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { Badge, Button, FormControl } from 'react-bootstrap'
import ActionButton from '../../components/ActionButton'
import FloatDataTable from '../../components/FloatDataTable'
import { escapeHtml, money } from '../../components/format'

const moneyCol = (key) => ({ data: key, render: (value, type) => (type === 'display' ? escapeHtml(money(value)) : value) })
const textCol = (key) => ({ data: key, render: (value) => escapeHtml(value || '—') })
const actionCol = { data: 'id', orderable: false, searchable: false, width: '110px', className: 'text-nowrap action-cell', render: (id) => `<div class="main-reserve-action-slot" data-id="${id}"></div>` }

const COLUMNS_BY_TAB = {
  pending: {
    columns: [textCol('create_date'), moneyCol('minimum_account'), moneyCol('maximum_account'), moneyCol('repl_amount'), textCol('create_by'), actionCol],
    headers: ['Created', 'Minimum', 'Maximum', 'Repl. Amount', 'Created By', 'Action'],
  },
  approved: {
    columns: [textCol('create_date'), moneyCol('minimum_account'), moneyCol('maximum_account'), moneyCol('repl_amount'), textCol('create_by'), textCol('approve_date'), textCol('approve_by'), actionCol],
    headers: ['Created', 'Minimum', 'Maximum', 'Repl. Amount', 'Created By', 'Approved', 'Approved By', 'Action'],
  },
  rejected: {
    columns: [textCol('create_date'), moneyCol('minimum_account'), moneyCol('maximum_account'), moneyCol('repl_amount'), textCol('create_by'), textCol('rejected_date'), textCol('rejected_by')],
    headers: ['Created', 'Minimum', 'Maximum', 'Repl. Amount', 'Created By', 'Rejected', 'Rejected By'],
  },
}

const MainReserveTable = ({ tab, data, canApprove, onApprove, onReject, onConfirm }) => {
  const handlers = useRef({ onApprove, onReject, onConfirm })
  handlers.current = { onApprove, onReject, onConfirm }

  const rowMap = useMemo(() => {
    const map = {}
    data.forEach((item) => { map[item.id] = item })
    return map
  }, [data])

  const { columns, headers } = COLUMNS_BY_TAB[tab]

  const createdRow = useMemo(() => (row, rowData) => {
    const item = rowMap[rowData.id] ?? rowData
    const slot = row.querySelector('.main-reserve-action-slot')
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
      root.render(
        Number(item.is_confirm) === 1 ? (
          <Badge bg="success-subtle" text="success">CONFIRMED</Badge>
        ) : canApprove ? (
          <Button variant="outline-success" size="sm" onClick={() => handlers.current.onConfirm(item)}>Confirm</Button>
        ) : null
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, canApprove, rowMap])

  return (
    <FloatDataTable data={data} columns={columns} createdRow={createdRow}>
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

export default MainReserveTable
