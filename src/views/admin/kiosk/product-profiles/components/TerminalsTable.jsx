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

DataTable.use(DT)

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const columns = [
  { data: 'name', render: (value) => escapeHtml(value || '—') },
  {
    data: 'status',
    render: (value, type) => (type === 'display'
      ? `<span class="badge ${value === 'D' ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'} badge-label">${value === 'D' ? 'Disabled' : 'Active'}</span>`
      : (value === 'D' ? 'Disabled' : 'Active')),
  },
  {
    data: 'id',
    orderable: false,
    searchable: false,
    width: '140px',
    className: 'text-nowrap action-cell',
    render: (id) => `<div class="kiosk-product-profile-action-slot" data-id="${id}"></div>`,
  },
]

const headers = ['Kiosk Terminal', 'Status', 'Action']

const TerminalsTable = ({ terminals, canAdd, canEdit, canExecute, onServices, onProductProfile, onToggleStatus }) => {
  const handlers = useRef({ onServices, onProductProfile, onToggleStatus })
  handlers.current = { onServices, onProductProfile, onToggleStatus }

  const rowMap = useMemo(() => {
    const map = {}
    terminals.forEach((item) => { map[item.id] = item })
    return map
  }, [terminals])

  const createdRow = useMemo(() => (row, rowData) => {
    const item = rowMap[rowData.id] ?? rowData
    const slot = row.querySelector('.kiosk-product-profile-action-slot')
    if (!slot) return
    const root = slot.__actionRoot || createRoot(slot)
    slot.__actionRoot = root
    const isActive = item.status !== 'D'

    root.render(
      <>
        {canAdd && <ActionButton label="Services" icon="apps" disabled={!isActive} onClick={() => handlers.current.onServices(item)} />}
        {canEdit && <ActionButton label="Product Profile" icon="adjustments" disabled={!isActive} onClick={() => handlers.current.onProductProfile(item)} />}
        {canExecute && (
          <ActionButton
            label={isActive ? 'Disable' : 'Enable'}
            icon={isActive ? 'ban' : 'player-play'}
            iconClassName={isActive ? 'text-danger' : 'text-success'}
            onClick={() => handlers.current.onToggleStatus(item)}
          />
        )}
      </>,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowMap, canAdd, canEdit, canExecute])

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
    <DataTable data={terminals} columns={columns} options={options} className="table dt-responsive align-middle mb-0 w-100">
      <thead className="thead-sm text-uppercase fs-xxs">
        <tr>
          {headers.map((header) => <th key={header}>{header}</th>)}
        </tr>
        <tr className="column-search-input-bar">
          {headers.map((header, index) => (
            <th key={header}>
              {header === 'Status' && (
                <FormSelect size="sm" className="bg-light-subtle border-light" data-col-index={index}>
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Disabled">Disabled</option>
                </FormSelect>
              )}
              {header !== 'Action' && header !== 'Status' && (
                <FormControl size="sm" type="text" placeholder={header} className="bg-light-subtle border-light" data-col-index={index} />
              )}
            </th>
          ))}
        </tr>
      </thead>
    </DataTable>
  )
}

export default TerminalsTable
