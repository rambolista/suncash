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
import { entityTypeLabel } from '../data/merchantReferenceData'

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

const ActionButton = ({ label, icon, iconClassName, onClick }) => (
  <OverlayTrigger placement="top" delay={{ show: 250, hide: 0 }} overlay={<Tooltip>{label}</Tooltip>}>
    <Button variant="light" size="sm" className="btn-icon rounded-circle" aria-label={label} onClick={onClick}>
      <Icon icon={icon} className={`fs-lg${iconClassName ? ` ${iconClassName}` : ''}`} />
    </Button>
  </OverlayTrigger>
)

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

const MerchantsTable = ({ data, viewMode = 'list', permissions = {}, onEdit, onView, onAction, onToggleStatus, onResetPassword, initialStatusFilter = 'all', initialRegistrationFilter = 'all' }) => {
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter)
  const [registrationFilter, setRegistrationFilter] = useState(initialRegistrationFilter)
  const [pageSize, setPageSize] = useState(8)
  const [page, setPage] = useState(1)

  const handlers = useRef({ onEdit, onView, onAction, onToggleStatus, onResetPassword })
  handlers.current = { onEdit, onView, onAction, onToggleStatus, onResetPassword }
  const canEdit = Boolean(permissions.can_edit)

  const tableData = useMemo(
    () => data.map((merchant) => ({
      ...merchant,
      merchant_search: `${merchant.client_id ?? ''} ${merchant.legal_name ?? ''} ${merchant.dba_name ?? ''} ${merchant.merchant_name ?? ''}`.trim(),
    })),
    [data]
  )

  const gridFilteredData = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    return tableData.filter((merchant) => {
      const accountStatus = String(merchant.account_status || 'active').toLowerCase()
      const registrationStatus = merchant.registration_status === 'A' ? 'approved' : 'pending'
      const matchesSearch = !query || [merchant.client_id, merchant.legal_name, merchant.dba_name, merchant.merchant_name, merchant.phone_no]
        .some((value) => String(value ?? '').toLowerCase().includes(query))
      const matchesStatus = statusFilter === 'all' || accountStatus === statusFilter
      const matchesRegistration = registrationFilter === 'all' || registrationStatus === registrationFilter
      return matchesSearch && matchesStatus && matchesRegistration
    })
  }, [tableData, searchText, statusFilter, registrationFilter])

  const totalPages = Math.max(1, Math.ceil(gridFilteredData.length / pageSize))

  useEffect(() => {
    setPage(1)
  }, [searchText, statusFilter, registrationFilter, pageSize, viewMode])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const paginatedGridData = useMemo(() => {
    const start = (page - 1) * pageSize
    return gridFilteredData.slice(start, start + pageSize)
  }, [gridFilteredData, page, pageSize])

  const rowMap = useMemo(() => {
    const map = {}
    tableData.forEach((item) => { map[item.id] = item })
    return map
  }, [tableData])

  const options = useMemo(() => ({
    responsive: true,
    orderCellsTop: true,
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    initComplete: function () {
      bindColumnSearchInputs(this.api())
      bindSortLabels(this.api())
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
    if (!gridFilteredData.length) return null

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
        <DataTable data={tableData} columns={columns} options={options} className="table dt-responsive align-middle mb-0 w-100">
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
              <th><FormControl size="sm" type="text" placeholder="Entity Type" className="bg-light-subtle border-light" data-col-index="2" /></th>
              <th><FormControl size="sm" type="text" placeholder="Phone" className="bg-light-subtle border-light" data-col-index="3" /></th>
              <th><FormControl size="sm" type="text" placeholder="Status" className="bg-light-subtle border-light" data-col-index="4" /></th>
              <th><FormControl size="sm" type="text" placeholder="Registration" className="bg-light-subtle border-light" data-col-index="5" /></th>
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
