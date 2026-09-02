import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { FormControl, FormSelect } from 'react-bootstrap'
import { bindColumnSearchInputs } from '@/views/admin/apps/access-management/utils/dataTableColumnSearch'
import { bindSortLabels } from '@/views/admin/apps/access-management/utils/dataTableSortLabels'
import { paginationIcons } from '@/views/admin/apps/access-management/utils/paginationIcons'
import ActionButton from '@/views/admin/merchants/components/ActionButton'
import { escapeHtml } from './format'

DataTable.use(DT)

const textCol = (key) => ({ data: key, render: (value) => escapeHtml(value || '—') })

const columns = [
  {
    data: 'first_name',
    render: (value, type, row) => (type === 'display' ? `${escapeHtml(row.first_name)} ${escapeHtml(row.last_name)}` : `${value} ${row.last_name}`),
  },
  textCol('username'),
  textCol('email_address'),
  textCol('branch_name'),
  {
    data: 'user_type',
    render: (value, type) => (type === 'display'
      ? `<span class="badge ${value === 'Admin' ? 'bg-primary-subtle text-primary' : 'bg-secondary-subtle text-secondary'} badge-label">${escapeHtml(value)}</span>`
      : value),
  },
  {
    data: 'row_key',
    orderable: false,
    searchable: false,
    width: '140px',
    className: 'text-nowrap action-cell',
    render: (id) => `<div class="kiosk-user-action-slot" data-id="${id}"></div>`,
  },
]

const headers = ['Name', 'Username', 'Email Address', 'Branch', 'User Type', 'Action']

const UsersTable = ({ data, canEdit, canDelete, canExecute, onEdit, onDelete, onReset }) => {
  const handlers = useRef({ onEdit, onDelete, onReset })
  handlers.current = { onEdit, onDelete, onReset }

  const rows = useMemo(() => data.map((item) => ({ ...item, row_key: `${item.user_type}-${item.id}` })), [data])

  const rowMap = useMemo(() => {
    const map = {}
    rows.forEach((item) => { map[item.row_key] = item })
    return map
  }, [rows])

  const createdRow = useMemo(() => (row, rowData) => {
    const item = rowMap[rowData.row_key] ?? rowData
    const slot = row.querySelector('.kiosk-user-action-slot')
    if (!slot) return
    const root = slot.__actionRoot || createRoot(slot)
    slot.__actionRoot = root
    const isKiosk = item.user_type === 'Kiosk'

    root.render(
      <>
        {canEdit && <ActionButton label="Edit" icon="edit" onClick={() => handlers.current.onEdit(item)} />}
        {canExecute && isKiosk && <ActionButton label="Reset Password" icon="key" onClick={() => handlers.current.onReset(item)} />}
        {canDelete && isKiosk && <ActionButton label="Delete" icon="trash" iconClassName="text-danger" onClick={() => handlers.current.onDelete(item)} />}
      </>,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowMap, canEdit, canDelete, canExecute])

  const options = useMemo(() => ({
    responsive: true,
    pageLength: 25,
    orderCellsTop: true,
    order: [[0, 'asc']],
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    initComplete: function () {
      bindColumnSearchInputs(this.api())
      bindSortLabels(this.api())
      const container = this.api().table().container()
      container.style.marginTop = '0'
      const controlsRow = container.querySelector(':scope > .row')
      controlsRow?.classList.add('mb-3')
    },
    language: { paginate: paginationIcons },
    createdRow,
  }), [createdRow])

  return (
    <DataTable data={rows} columns={columns} options={options} className="table dt-responsive align-middle mb-0 w-100">
      <thead className="thead-sm text-uppercase fs-xxs">
        <tr>
          {headers.map((header) => <th key={header}>{header}</th>)}
        </tr>
        <tr className="column-search-input-bar">
          {headers.map((header, index) => (
            <th key={header}>
              {header === 'User Type' && (
                <FormSelect size="sm" className="bg-light-subtle border-light" data-col-index={index}>
                  <option value="">All Types</option>
                  <option value="Kiosk">Kiosk</option>
                  <option value="Admin">Admin</option>
                </FormSelect>
              )}
              {header !== 'Action' && header !== 'User Type' && (
                <FormControl size="sm" type="text" placeholder={header} className="bg-light-subtle border-light" data-col-index={index} />
              )}
            </th>
          ))}
        </tr>
      </thead>
    </DataTable>
  )
}

export default UsersTable
