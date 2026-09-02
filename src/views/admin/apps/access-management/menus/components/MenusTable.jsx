import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useMemo, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { Button, FormControl } from 'react-bootstrap'
import { paginationIcons } from '../../utils/paginationIcons'
import { bindColumnSearchInputs } from '../../utils/dataTableColumnSearch'
import Icon from '@/components/wrappers/Icon'
import { MENU_ACTIONS } from '@/utils/menuPermissions'

DataTable.use(DT)

// Columns are stable — defined once outside the component.
// The 'actions' column uses data-id attributes; event listeners
// are wired in createdRow via a ref so they always see fresh callbacks.
const columns = [
  {
    data: 'id',
    width: '40px',
    className: 'text-muted small',
  },
  {
    data: 'label',
    render: (label) => `<span class="fw-medium">${label ?? ''}</span>`,
  },
  {
    data: 'slug',
    render: (slug) => `<code class="small">${slug ?? ''}</code>`,
  },
  {
    data: 'url',
    className: 'small text-muted',
    render: (url) => url || '-',
  },
  {
    data: 'icon',
    width: '120px',
    className: 'small text-nowrap',
    render: (icon, _type, row) => `<div class="icon-slot" data-id="${row.id}" data-icon="${icon ?? ''}"></div>`,
  },
  {
    data: 'parent_label',
    className: 'small text-muted',
    render: (v) => v || '-',
  },
  {
    data: 'sort_order',
    className: 'text-center small',
    width: '60px',
  },
  {
    data: 'is_title',
    width: '80px',
    render: (isTitle) =>
      isTitle
        ? '<span class="badge bg-secondary">Title</span>'
        : '<span class="badge bg-light text-dark">Link</span>',
  },
  {
    data: 'badge_text',
    render: (text, _type, row) =>
      text
        ? `<span class="badge ${row.badge_class || ''}">${text}</span>`
        : '<span class="text-muted">-</span>',
  },
  {
    data: 'id',
    width: '220px',
    render: (_id, _type, row) => MENU_ACTIONS
      .filter(({ capability }) => row[capability])
      .map(({ label }) => `<span class="badge bg-primary-subtle text-primary me-1 mb-1">${label}</span>`)
      .join(' ') || '<span class="text-muted">None</span>',
  },
  {
    data: 'is_active',
    width: '80px',
    render: (active, _type, row) => [
      active
        ? '<span class="badge bg-success">Active</span>'
        : '<span class="badge bg-danger">Inactive</span>',
      row.is_disabled ? '<span class="badge bg-secondary">Disabled</span>' : '',
      row.is_special ? '<span class="badge bg-primary">Special</span>' : '',
    ].filter(Boolean).join(' '),
  },
  {
    data: 'id',
    orderable: false,
    searchable: false,
    width: '95px',
    className: 'text-nowrap action-cell',
    render: (id) => `<div class="action-slot" data-id="${id}"></div>`,
  },
]

/**
 * MenusTable
 *
 * Props:
 *   data   – flat menus array (each item should include `parent_label`)
 *   onEdit – (menu) => void
 */
const MenusTable = ({ data, onEdit, permissions = {} }) => {
  const handlers = useRef({ onEdit })
  handlers.current = { onEdit }
  const canEdit = Boolean(permissions.can_edit)

  // Build a quick id→row lookup so createdRow can pass the full object
  const rowMap = useMemo(() => {
    const map = {}
    data.forEach((m) => { map[m.id] = m })
    return map
  }, [data])

  const options = useMemo(() => ({
    responsive: true,
    orderCellsTop: true,
    initComplete: function () {
      bindColumnSearchInputs(this.api())
    },
    language: { paginate: paginationIcons },
    createdRow: (row, rowData) => {
      const item = rowMap[rowData.id] ?? rowData
      const iconSlot = row.querySelector('.icon-slot')
      const slot = row.querySelector('.action-slot')
      if (iconSlot) {
        const iconRoot = iconSlot.__iconRoot || createRoot(iconSlot)
        iconSlot.__iconRoot = iconRoot
        iconRoot.render(
          item.icon ? (
            <div className="d-flex align-items-center gap-1">
              <span className="border rounded d-inline-flex align-items-center justify-content-center bg-light flex-shrink-0" style={{ width: 28, height: 28 }}>
                <Icon icon={item.icon} className="fs-5" />
              </span>
              <span className="small text-truncate" style={{ maxWidth: 78 }} title={item.icon}>{item.icon}</span>
            </div>
          ) : (
            <span className="text-muted">-</span>
          )
        )
      }
      if (!slot) return
      const actionRoot = slot.__actionRoot || createRoot(slot)
      slot.__actionRoot = actionRoot
      actionRoot.render(
        <div className="d-flex gap-1">
          {canEdit && (
            <Button variant="light" size="sm" className="btn-icon rounded-circle" title="Edit" aria-label="Edit" onClick={() => handlers.current.onEdit?.(item)}>
              <Icon icon="edit" className="fs-lg" />
            </Button>
          )}
        </div>
      )
    },
  }), [canEdit, rowMap])

  return (
    <DataTable
      data={data}
      columns={columns}
      options={options}
      className="table dt-responsive align-middle mb-0 w-100"
    >
      <thead className="thead-sm text-uppercase fs-xxs">
        <tr>
          <th>#</th>
          <th>Label</th>
          <th>Slug</th>
          <th>URL</th>
          <th>Icon</th>
          <th>Parent</th>
          <th>Order</th>
          <th>Type</th>
          <th>Badge</th>
          <th>Access rights</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
        <tr className="column-search-input-bar">
          <th />
          <th>
            <FormControl size="sm" type="text" placeholder="Label" className="bg-light-subtle border-light" data-col-index="1" />
          </th>
          <th>
            <FormControl size="sm" type="text" placeholder="Slug" className="bg-light-subtle border-light" data-col-index="2" />
          </th>
          <th>
            <FormControl size="sm" type="text" placeholder="URL" className="bg-light-subtle border-light" data-col-index="3" />
          </th>
          <th>
            <FormControl size="sm" type="text" placeholder="Icon" className="bg-light-subtle border-light" data-col-index="4" />
          </th>
          <th>
            <FormControl size="sm" type="text" placeholder="Parent" className="bg-light-subtle border-light" data-col-index="5" />
          </th>
          <th>
            <FormControl size="sm" type="text" placeholder="Order" className="bg-light-subtle border-light" data-col-index="6" />
          </th>
          <th>
            <FormControl size="sm" type="text" placeholder="Type" className="bg-light-subtle border-light" data-col-index="7" />
          </th>
          <th>
            <FormControl size="sm" type="text" placeholder="Badge" className="bg-light-subtle border-light" data-col-index="8" />
          </th>
          <th>
            <FormControl size="sm" type="text" placeholder="Access rights" className="bg-light-subtle border-light" data-col-index="9" />
          </th>
          <th>
            <FormControl size="sm" type="text" placeholder="Status" className="bg-light-subtle border-light" data-col-index="10" />
          </th>
          <th />
        </tr>
      </thead>
    </DataTable>
  )
}

export default MenusTable
