import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Button, Card, CardBody, Col, FormControl, FormSelect, OverlayTrigger, Row, Tooltip } from 'react-bootstrap'
import Icon from '@/components/wrappers/Icon'
import { bindColumnSearchInputs } from '@/views/admin/apps/access-management/utils/dataTableColumnSearch'
import { bindSortLabels } from '@/views/admin/apps/access-management/utils/dataTableSortLabels'
import { paginationIcons } from '@/views/admin/apps/access-management/utils/paginationIcons'
import { ENTITY_TYPES, entityTypeLabel } from '../data/merchantReferenceData'

DataTable.use(DT)

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const accountStatusBadgeClass = (status) => (String(status || 'active').toLowerCase() === 'inactive' ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success')
const accountStatusLabel = (status) => (String(status || 'active').toLowerCase() === 'inactive' ? 'Inactive' : 'Active')

const registrationBadgeClass = (status) => (status === 'A' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning')
const registrationLabel = (status) => (status === 'A' ? 'Approved' : 'Pending')

const formatDate = (value) => {
  if (!value) return '—'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString()
}

// Tooltip visibility is explicitly controlled (rather than left to hover/focus) so a
// click closes it immediately instead of it getting orphaned mid-display if the row
// it's anchored to is removed right after (e.g. a swap to a detail view) — see
// src/views/admin/merchants/components/ActionButton.jsx for the full explanation.
const ActionButton = ({ label, icon, iconClassName, onClick }) => {
  const [show, setShow] = useState(false)

  const handleClick = (event) => {
    setShow(false)
    event.currentTarget.blur()
    onClick?.(event)
  }

  return (
    <OverlayTrigger
      placement="top"
      trigger={['hover']}
      delay={{ show: 250, hide: 0 }}
      overlay={<Tooltip>{label}</Tooltip>}
      show={show}
      onToggle={setShow}
      transition={false}
    >
      <Button variant="light" size="sm" className="btn-icon rounded-circle" aria-label={label} onClick={handleClick}>
        <Icon icon={icon} className={`fs-lg${iconClassName ? ` ${iconClassName}` : ''}`} />
      </Button>
    </OverlayTrigger>
  )
}

const MerchantAvatar = ({ size = 32 }) => (
  <div className="rounded-circle bg-light d-flex align-items-center justify-content-center text-muted flex-shrink-0" style={{ width: size, height: size }}>
    <Icon icon="building-store" className={size >= 48 ? 'fs-lg' : 'fs-sm'} />
  </div>
)

const gridPageSizes = [4, 8, 12, 16, 20]

const columns = [
  { data: 'client_id', width: '150px', className: 'text-nowrap fw-medium' },
  { data: 'merchant_search', render: (val, type, row) => (type === 'display' ? `<div class="merchant-cell-slot" data-id="${row.id}"></div>` : val) },
  { data: 'entity_type_label', render: (value) => escapeHtml(value || '—') },
  { data: 'phone_no', render: (value) => escapeHtml(value || '—') },
  {
    data: 'account_status',
    render: (_val, type, row) => {
      const label = accountStatusLabel(row.account_status)
      return type === 'display' ? `<span class="badge ${accountStatusBadgeClass(row.account_status)} badge-label">${label}</span>` : label
    },
  },
  {
    data: 'registration_status',
    render: (_val, type, row) => {
      const label = registrationLabel(row.registration_status)
      return type === 'display' ? `<span class="badge ${registrationBadgeClass(row.registration_status)} badge-label">${label}</span>` : label
    },
  },
  { data: 'creation_date', render: (value, type) => (type === 'display' ? escapeHtml(formatDate(value)) : value) },
  { data: 'id', orderable: false, searchable: false, width: '90px', className: 'text-nowrap action-cell', render: (id) => `<div class="action-slot" data-id="${id}"></div>` },
]

const MerchantsTable = ({ data, viewMode = 'list', permissions = {}, onEdit, onView, onAction, onToggleStatus, onResetPassword, initialStatusFilter = 'all', initialRegistrationFilter = 'all', initialEntityTypeFilter = 'all' }) => {
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter)
  const [registrationFilter, setRegistrationFilter] = useState(initialRegistrationFilter)
  const [entityTypeFilter, setEntityTypeFilter] = useState(initialEntityTypeFilter)
  const [pageSize, setPageSize] = useState(8)
  const [page, setPage] = useState(1)

  const handlers = useRef({ onEdit, onView, onAction, onToggleStatus, onResetPassword })
  handlers.current = { onEdit, onView, onAction, onToggleStatus, onResetPassword }
  const canEdit = Boolean(permissions.can_edit)

  // Column-header <select> filters live inside DataTables' managed <thead>, where
  // React's synthetic event delegation doesn't reliably reach — a real 'change'
  // dispatched there doesn't call a React onChange prop at all (same reason the
  // free-text search inputs are wired via bindColumnSearchInputs' manual
  // addEventListener rather than a controlled onChange). Bound natively instead.
  const filterSetters = useRef({ entityType: setEntityTypeFilter, status: setStatusFilter, registration: setRegistrationFilter })
  filterSetters.current = { entityType: setEntityTypeFilter, status: setStatusFilter, registration: setRegistrationFilter }

  const tableData = useMemo(
    () => data.map((merchant) => ({
      ...merchant,
      merchant_search: `${merchant.client_id ?? ''} ${merchant.legal_name ?? ''} ${merchant.dba_name ?? ''} ${merchant.merchant_name ?? ''}`.trim(),
    })),
    [data]
  )

  // Legacy's client_management.php only ever RENDERS client_status_id 0
  // (active) or 2 (admin-deactivated) rows when no explicit status search
  // was submitted (its $status_array default) — 1 (unused) and -1
  // (self-registered, never touched by an admin) are fetched but hidden.
  // Mirrored here as the default scope; an incoming explicit status/
  // registration/entity-type filter (e.g. a Dashboard drill-down, or the
  // column-header dropdowns below) opens it back up to every merchant so
  // that filter can do its own, broader matching.
  const hasActiveFilter = statusFilter !== 'all' || registrationFilter !== 'all' || entityTypeFilter !== 'all'

  const scopedData = useMemo(() => {
    if (hasActiveFilter) return tableData
    return tableData.filter((merchant) => [0, 2].includes(Number(merchant.client_status_id)))
  }, [tableData, hasActiveFilter])

  // Used as the `data` source for BOTH the list (DataTable) and grid views,
  // so the column-header dropdowns below filter identically regardless of
  // which layout is active.
  const filteredData = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    return scopedData.filter((merchant) => {
      const accountStatus = String(merchant.account_status || 'active').toLowerCase()
      const registrationStatus = merchant.registration_status === 'A' ? 'approved' : 'pending'
      const matchesSearch = !query || [merchant.client_id, merchant.legal_name, merchant.dba_name, merchant.merchant_name, merchant.phone_no]
        .some((value) => String(value ?? '').toLowerCase().includes(query))
      const matchesStatus = statusFilter === 'all' || accountStatus === statusFilter
      const matchesRegistration = registrationFilter === 'all' || registrationStatus === registrationFilter
      const matchesEntityType = entityTypeFilter === 'all' || String(merchant.entity_type ?? '') === String(entityTypeFilter)
      return matchesSearch && matchesStatus && matchesRegistration && matchesEntityType
    })
  }, [scopedData, searchText, statusFilter, registrationFilter, entityTypeFilter])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize))

  useEffect(() => {
    setPage(1)
  }, [searchText, statusFilter, registrationFilter, entityTypeFilter, pageSize, viewMode])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const paginatedGridData = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, page, pageSize])

  const rowMap = useMemo(() => {
    const map = {}
    filteredData.forEach((item) => { map[item.id] = item })
    return map
  }, [filteredData])

  const options = useMemo(() => ({
    responsive: true,
    orderCellsTop: true,
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    initComplete: function () {
      bindColumnSearchInputs(this.api())
      bindSortLabels(this.api())
      this.api().table().container().querySelectorAll('thead tr.column-search-input-bar th select[data-filter]').forEach((select) => {
        select.addEventListener('click', (event) => event.stopPropagation())
        select.addEventListener('change', function () {
          filterSetters.current[this.getAttribute('data-filter')]?.(this.value)
        })
      })
    },
    language: { paginate: paginationIcons },
    createdRow: (row, rowData) => {
      const item = rowMap[rowData.id] ?? rowData
      const merchantCellSlot = row.querySelector('.merchant-cell-slot')
      if (merchantCellSlot) {
        const merchantRoot = merchantCellSlot.__merchantRoot || createRoot(merchantCellSlot)
        merchantCellSlot.__merchantRoot = merchantRoot
        merchantRoot.render(
          <div className="d-flex align-items-center gap-2">
            <MerchantAvatar size={32} />
            <div>
              <h5 className="fs-base mb-0">{item.dba_name || item.legal_name || '—'}</h5>
              <p className="text-muted fs-xs mb-0">{item.legal_name && item.dba_name && item.legal_name !== item.dba_name ? item.legal_name : ''}</p>
            </div>
          </div>
        )
      }

      const slot = row.querySelector('.action-slot')
      if (!slot) return
      const root = slot.__actionRoot || createRoot(slot)
      slot.__actionRoot = root
      root.render(
        <div className="d-flex gap-1">
          <ActionButton label="View" icon="eye" onClick={() => handlers.current.onView?.(item)} />
          {canEdit && (
            <>
              <ActionButton label="Merchant details" icon="edit" onClick={() => handlers.current.onEdit?.(item)} />
              <ActionButton
                label={String(item.account_status || 'active').toLowerCase() === 'inactive' ? 'Activate' : 'Deactivate'}
                icon={String(item.account_status || 'active').toLowerCase() === 'inactive' ? 'circle-check' : 'ban'}
                iconClassName={String(item.account_status || 'active').toLowerCase() === 'inactive' ? 'text-success' : 'text-danger'}
                onClick={() => handlers.current.onToggleStatus?.(item)}
              />
              <ActionButton label="Reset password" icon="key" onClick={() => handlers.current.onResetPassword?.(item)} />
              <ActionButton label="More actions" icon="dots-vertical" onClick={() => handlers.current.onAction?.(item)} />
            </>
          )}
        </div>
      )
    },
  }), [canEdit, rowMap])

  const renderGridPagination = () => {
    if (!filteredData.length) return null

    const maxVisiblePages = 5
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
    startPage = Math.max(1, endPage - maxVisiblePages + 1)

    const pageItems = []
    for (let p = startPage; p <= endPage; p += 1) {
      pageItems.push(
        <li key={p} className={`page-item${p === page ? ' active' : ''}`}>
          <button type="button" className="page-link" onClick={() => setPage(p)}>{p}</button>
        </li>
      )
    }

    return (
      <ul className="pagination pagination-rounded pagination-boxed justify-content-center mt-3 mb-0">
        <li className={`page-item${page <= 1 ? ' disabled' : ''}`}>
          <button type="button" className="page-link" aria-label="Previous" onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
            <span aria-hidden="true">«</span>
          </button>
        </li>
        {pageItems}
        <li className={`page-item${page >= totalPages ? ' disabled' : ''}`}>
          <button type="button" className="page-link" aria-label="Next" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}>
            <span aria-hidden="true">»</span>
          </button>
        </li>
      </ul>
    )
  }

  return (
    <>
      {viewMode === 'grid' && (
        <Row className="mb-3">
          <Col lg={12}>
            <form className="bg-light-subtle rounded border p-3" onSubmit={(e) => e.preventDefault()}>
              <Row className="gap-3">
                <Col lg={4}>
                  <div className="app-search">
                    <FormControl type="text" placeholder="Search merchant ID, name, phone..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
                    <Icon icon="search" className="app-search-icon text-muted" />
                  </div>
                </Col>
                <Col>
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <span className="me-2 fw-semibold">Filter By:</span>
                    <div className="app-search">
                      <FormSelect className="form-control my-1 my-md-0" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="all">Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </FormSelect>
                      <Icon icon="toggle-right" className="app-search-icon text-muted" />
                    </div>
                    <div className="app-search">
                      <FormSelect className="form-control my-1 my-md-0" value={registrationFilter} onChange={(e) => setRegistrationFilter(e.target.value)}>
                        <option value="all">Registration</option>
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                      </FormSelect>
                      <Icon icon="clipboard-check" className="app-search-icon text-muted" />
                    </div>
                    <div className="app-search">
                      <FormSelect className="form-control my-1 my-md-0" value={entityTypeFilter} onChange={(e) => setEntityTypeFilter(e.target.value)}>
                        <option value="all">Entity Type</option>
                        {ENTITY_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                      </FormSelect>
                      <Icon icon="building-store" className="app-search-icon text-muted" />
                    </div>
                    <div className="app-search">
                      <FormSelect className="form-control my-1 my-md-0" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                        {gridPageSizes.map((size) => <option key={size} value={size}>{size} / page</option>)}
                      </FormSelect>
                      <Icon icon="list-check" className="app-search-icon text-muted" />
                    </div>
                  </div>
                </Col>
              </Row>
            </form>
          </Col>
        </Row>
      )}

      {viewMode === 'list' ? (
        // Keyed on the 3 dropdown filters so changing any of them fully
        // remounts the table: datatables.net-react snapshots the <thead> at
        // its own init time, and a React-controlled <select>'s chosen option
        // only exists as a JS `.value` property (no `selected` attribute in
        // the actual markup), which that snapshot doesn't carry over — so a
        // value update after mount silently fails to show visually even
        // though the (already correct) filtered `data` still drives the
        // real row set. Remounting sidesteps that by having each dropdown
        // render its correct value from a clean initial render every time.
        <DataTable key={`${statusFilter}|${registrationFilter}|${entityTypeFilter}`} data={filteredData} columns={columns} options={options} className="table dt-responsive align-middle mb-0 w-100">
          <thead className="thead-sm text-uppercase fs-xxs">
            <tr>
              <th>Merchant ID</th>
              <th>Merchant</th>
              <th>Entity Type</th>
              <th>Phone</th>
              <th>Account Status</th>
              <th>Registration</th>
              <th>Registered</th>
              <th>Actions</th>
            </tr>
            <tr className="column-search-input-bar">
              <th><FormControl size="sm" type="text" placeholder="Merchant ID" className="bg-light-subtle border-light" data-col-index="0" /></th>
              <th><FormControl size="sm" type="text" placeholder="Merchant" className="bg-light-subtle border-light" data-col-index="1" /></th>
              <th>
                {/* Uncontrolled (defaultValue, not value) and bound via the manual
                    addEventListener in initComplete above, not onChange: this table
                    remounts fresh on every filter change (see the DataTable `key`
                    above), so the correct option is baked into each initial render,
                    and DataTables' own header handling of this thead doesn't reliably
                    deliver a real 'change' event to a React onChange prop. */}
                <FormSelect size="sm" className="bg-light-subtle border-light" defaultValue={entityTypeFilter} data-filter="entityType">
                  <option value="all">All Entity Types</option>
                  {ENTITY_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </FormSelect>
              </th>
              <th><FormControl size="sm" type="text" placeholder="Phone" className="bg-light-subtle border-light" data-col-index="3" /></th>
              <th>
                <FormSelect size="sm" className="bg-light-subtle border-light" defaultValue={statusFilter} data-filter="status">
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </FormSelect>
              </th>
              <th>
                <FormSelect size="sm" className="bg-light-subtle border-light" defaultValue={registrationFilter} data-filter="registration">
                  <option value="all">All Registrations</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                </FormSelect>
              </th>
              <th><FormControl size="sm" type="text" placeholder="Registered" className="bg-light-subtle border-light" data-col-index="6" /></th>
              <th />
            </tr>
          </thead>
        </DataTable>
      ) : (
        <>
          <Row>
            {paginatedGridData.map((merchant) => (
              <Col md={6} xxl={3} key={merchant.id} className="mb-3">
                <Card className="card-h-100 border shadow-sm rounded-3 overflow-hidden bg-body-secondary">
                  <CardBody className="p-4">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <MerchantAvatar size={48} />
                      <div className="flex-grow-1">
                        <h5 className="mb-0">{merchant.dba_name || merchant.legal_name || '—'}</h5>
                        <span className={`badge ${accountStatusBadgeClass(merchant.account_status)} badge-label mt-1`}>{accountStatusLabel(merchant.account_status)}</span>
                        {' '}
                        <span className={`badge ${registrationBadgeClass(merchant.registration_status)} badge-label mt-1`}>{registrationLabel(merchant.registration_status)}</span>
                      </div>
                    </div>

                    <ul className="list-unstyled text-muted mb-3">
                      <li className="mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <div className="avatar-xs avatar-img-size fs-24">
                            <span className="avatar-title text-bg-light fs-sm rounded-circle">
                              <Icon icon="hash" />
                            </span>
                          </div>
                          <h6 className="mb-0 fw-medium text-body">{merchant.client_id || '—'}</h6>
                        </div>
                      </li>
                      <li className="mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <div className="avatar-xs avatar-img-size fs-24">
                            <span className="avatar-title text-bg-light fs-sm rounded-circle">
                              <Icon icon="category" />
                            </span>
                          </div>
                          <h6 className="mb-0 fw-medium text-body">{merchant.entity_type_label || entityTypeLabel(merchant.entity_type)}</h6>
                        </div>
                      </li>
                      <li className="mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <div className="avatar-xs avatar-img-size fs-24">
                            <span className="avatar-title text-bg-light fs-sm rounded-circle">
                              <Icon icon="phone" />
                            </span>
                          </div>
                          <h6 className="mb-0 fw-medium text-body">{merchant.phone_no || '—'}</h6>
                        </div>
                      </li>
                      <li>
                        <div className="d-flex align-items-center gap-2">
                          <div className="avatar-xs avatar-img-size fs-24">
                            <span className="avatar-title text-bg-light fs-sm rounded-circle">
                              <Icon icon="calendar" />
                            </span>
                          </div>
                          <h6 className="mb-0 fw-medium text-body">{formatDate(merchant.creation_date)}</h6>
                        </div>
                      </li>
                    </ul>

                    <div className="d-flex justify-content-end gap-1">
                      <ActionButton label="View" icon="eye" onClick={() => onView?.(merchant)} />
                      {canEdit && (
                        <>
                          <ActionButton label="Merchant details" icon="edit" onClick={() => onEdit(merchant)} />
                          <ActionButton
                            label={String(merchant.account_status || 'active').toLowerCase() === 'inactive' ? 'Activate' : 'Deactivate'}
                            icon={String(merchant.account_status || 'active').toLowerCase() === 'inactive' ? 'circle-check' : 'ban'}
                            iconClassName={String(merchant.account_status || 'active').toLowerCase() === 'inactive' ? 'text-success' : 'text-danger'}
                            onClick={() => onToggleStatus?.(merchant)}
                          />
                          <ActionButton label="Reset password" icon="key" onClick={() => onResetPassword?.(merchant)} />
                          <ActionButton label="More actions" icon="dots-vertical" onClick={() => onAction?.(merchant)} />
                        </>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </Col>
            ))}
            {!paginatedGridData.length && (
              <Col xs={12}>
                <div className="text-center text-muted py-4 border rounded bg-light-subtle">No merchants found.</div>
              </Col>
            )}
          </Row>
          {renderGridPagination()}
        </>
      )}
    </>
  )
}

export default MerchantsTable
