import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Button, Card, CardBody, Col, FormControl, FormSelect, Row } from 'react-bootstrap'
import Icon from '@/components/wrappers/Icon'
import { bindColumnSearchInputs } from '../../access-management/utils/dataTableColumnSearch'
import { paginationIcons } from '../../access-management/utils/paginationIcons'

DataTable.use(DT)

const statusBadgeClass = (status) => {
  if (status === 'suspended') return 'bg-danger-subtle text-danger'
  if (status === 'inactive') return 'bg-warning-subtle text-warning'
  return 'bg-success-subtle text-success'
}

const statusLabel = (status) => {
  if (status === 'suspended') return 'Suspended'
  if (status === 'inactive') return 'Inactive'
  return 'Active'
}

const formatLastUpdated = (value) => {
  if (!value) return { date: '—', time: '' }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return { date: String(value), time: '' }
  return {
    date: parsed.toLocaleDateString(),
    time: parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }
}

const columns = [
  { data: 'account_number', width: '160px', className: 'text-nowrap fw-medium' },
  { data: 'customer_search', render: (_val, _type, row) => `<div class="customer-cell-slot" data-id="${row.id}"></div>` },
  { data: 'email', render: (email) => email || '—' },
  { data: 'mobile_number', render: (mobile) => mobile || '—' },
  { data: 'updated_at', render: (updatedAt) => {
    const { date, time } = formatLastUpdated(updatedAt)
    return `${date}${time ? ` <small class="text-muted">${time}</small>` : ''}`
  } },
  { data: 'status', render: (_val, _type, row) => `<span class="badge ${statusBadgeClass(String(row.status || 'active').toLowerCase())} badge-label">${statusLabel(String(row.status || 'active').toLowerCase())}</span>` },
  { data: 'id', orderable: false, searchable: false, width: '95px', className: 'text-nowrap action-cell', render: (id) => `<div class="action-slot" data-id="${id}"></div>` },
]

const gridPageSizes = [4, 8, 12, 16, 20]

const CustomersTable = ({ data, viewMode = 'list', permissions = {}, onView, onEdit, onDelete }) => {
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [pageSize, setPageSize] = useState(8)
  const [page, setPage] = useState(1)

  const handlers = useRef({ onView, onEdit, onDelete })
  handlers.current = { onView, onEdit, onDelete }
  const canEdit = Boolean(permissions.can_edit)
  const canDelete = Boolean(permissions.can_delete)

  const gridFilteredData = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    return data.filter((customer) => {
      const status = String(customer.status || 'active').toLowerCase()
      const matchesSearch = !query || [
        customer.account_number,
        customer.name,
        customer.first_name,
        customer.middle_name,
        customer.last_name,
        customer.email,
        customer.mobile_number,
        customer.address,
      ].some((value) => String(value ?? '').toLowerCase().includes(query))

      const matchesStatus = statusFilter === 'all' || status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [data, searchText, statusFilter])

  const totalPages = Math.max(1, Math.ceil(gridFilteredData.length / pageSize))

  useEffect(() => {
    setPage(1)
  }, [searchText, statusFilter, pageSize, viewMode])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const paginatedGridData = useMemo(() => {
    const start = (page - 1) * pageSize
    return gridFilteredData.slice(start, start + pageSize)
  }, [gridFilteredData, page, pageSize])

  const rowMap = useMemo(() => {
    const map = {}
    data.forEach((item) => { map[item.id] = item })
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
      const customerCellSlot = row.querySelector('.customer-cell-slot')
      if (customerCellSlot) {
        const customerRoot = customerCellSlot.__customerRoot || createRoot(customerCellSlot)
        customerCellSlot.__customerRoot = customerRoot
        customerRoot.render(
          <div className="d-flex align-items-center gap-2">
            <div className="avatar avatar-sm flex-shrink-0" style={{ width: 32, height: 32 }}>
              {item.avatar_url ? (
                <img src={item.avatar_url} className="rounded-circle" alt={item.name || 'customer'} width={32} height={32} style={{ width: 32, height: 32, objectFit: 'cover', display: 'block' }} />
              ) : (
                <div className="rounded-circle bg-light d-flex align-items-center justify-content-center text-muted" style={{ width: 32, height: 32 }}>
                  <Icon icon="user" className="fs-sm" />
                </div>
              )}
            </div>
            <div>
              <h5 className="fs-base mb-0">{item.name || '—'}</h5>
              <p className="text-muted fs-xs mb-0">{item.account_number || ''}</p>
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
          <Button variant="primary" size="sm" className="btn-icon rounded-circle" title="View customer" aria-label="View customer" onClick={() => handlers.current.onView?.(item)}>
            <Icon icon="eye" className="fs-lg" />
          </Button>
          {canEdit && (
            <Button variant="light" size="sm" className="btn-icon rounded-circle" title="Edit" aria-label="Edit" onClick={() => handlers.current.onEdit?.(item)}>
              <Icon icon="edit" className="fs-lg" />
            </Button>
          )}
          {canDelete && (
            <Button variant="danger" size="sm" className="btn-icon rounded-circle" title="Delete" aria-label="Delete" onClick={() => handlers.current.onDelete?.(item)}>
              <Icon icon="trash" className="fs-lg" />
            </Button>
          )}
        </div>
      )
    },
  }), [canEdit, canDelete, rowMap])

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
                    <FormControl type="text" placeholder="Search account number..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
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
                        <option value="suspended">Suspended</option>
                      </FormSelect>
                      <Icon icon="user-hexagon" className="app-search-icon text-muted" />
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
        <DataTable data={data} columns={columns} options={options} className="table dt-responsive align-middle mb-0 w-100">
          <thead className="thead-sm text-uppercase fs-xxs">
            <tr>
              <th>Account #</th>
              <th>Customer</th>
              <th>Email</th>
              <th>Mobile Number</th>
              <th>Last Updated</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
            <tr className="column-search-input-bar">
              <th><FormControl size="sm" type="text" placeholder="Account #" className="bg-light-subtle border-light" data-col-index="0" /></th>
              <th><FormControl size="sm" type="text" placeholder="Customer" className="bg-light-subtle border-light" data-col-index="1" /></th>
              <th><FormControl size="sm" type="text" placeholder="Email" className="bg-light-subtle border-light" data-col-index="2" /></th>
              <th><FormControl size="sm" type="text" placeholder="Mobile" className="bg-light-subtle border-light" data-col-index="3" /></th>
              <th><FormControl size="sm" type="text" placeholder="Last Updated" className="bg-light-subtle border-light" data-col-index="4" /></th>
              <th><FormControl size="sm" type="text" placeholder="Status" className="bg-light-subtle border-light" data-col-index="5" /></th>
              <th />
            </tr>
          </thead>
        </DataTable>
      ) : (
        <>
          <Row>
            {paginatedGridData.map((customer) => {
              const status = String(customer.status || 'active').toLowerCase()
              const { date, time } = formatLastUpdated(customer.updated_at)
              return (
                <Col md={6} xxl={3} key={customer.id} className="mb-3">
                  <Card className="card-h-100 border shadow-sm rounded-3 overflow-hidden bg-body-secondary">
                    <CardBody className="p-4">
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <div className="avatar avatar-md flex-shrink-0" style={{ width: 48, height: 48 }}>
                          {customer.avatar_url ? (
                            <img src={customer.avatar_url} alt={customer.name || 'customer'} className="rounded-circle" width={48} height={48} style={{ width: 48, height: 48, objectFit: 'cover', display: 'block' }} />
                          ) : (
                            <div className="rounded-circle bg-light d-flex align-items-center justify-content-center text-muted" style={{ width: 48, height: 48 }}>
                              <Icon icon="user" className="fs-lg" />
                            </div>
                          )}
                        </div>
                        <div className="flex-grow-1">
                          <h5 className="mb-0">{customer.name || '—'}</h5>
                          <span className={`badge ${statusBadgeClass(status)} badge-label mt-1`}>{statusLabel(status)}</span>
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
                            <h6 className="mb-0 fw-medium text-body">{customer.account_number || '—'}</h6>
                          </div>
                        </li>
                        <li className="mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <div className="avatar-xs avatar-img-size fs-24">
                              <span className="avatar-title text-bg-light fs-sm rounded-circle">
                                <Icon icon="mail" />
                              </span>
                            </div>
                            <h6 className="mb-0 fw-medium text-body">{customer.email || '—'}</h6>
                          </div>
                        </li>
                        <li className="mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <div className="avatar-xs avatar-img-size fs-24">
                              <span className="avatar-title text-bg-light fs-sm rounded-circle">
                                <Icon icon="phone" />
                              </span>
                            </div>
                            <h6 className="mb-0 fw-medium text-body">{customer.mobile_number || '—'}</h6>
                          </div>
                        </li>
                        <li className="mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <div className="avatar-xs avatar-img-size fs-24">
                              <span className="avatar-title text-bg-light fs-sm rounded-circle">
                                <Icon icon="map-pin" />
                              </span>
                            </div>
                            <h6 className="mb-0 fw-medium text-body">{customer.address || '—'}</h6>
                          </div>
                        </li>
                        <li>
                          <div className="d-flex align-items-center gap-2">
                            <div className="avatar-xs avatar-img-size fs-24">
                              <span className="avatar-title text-bg-light fs-sm rounded-circle">
                                <Icon icon="refresh" />
                              </span>
                            </div>
                            <h6 className="mb-0 fw-medium text-body">{date} {time}</h6>
                          </div>
                        </li>
                      </ul>

                      <div className="d-flex gap-1">
                        <Button variant="primary" size="sm" className="btn-icon rounded-circle" title="View customer" onClick={() => handlers.current.onView?.(customer)}><Icon icon="eye" className="fs-lg" /></Button>
                        {canEdit && <Button variant="light" size="sm" className="btn-icon rounded-circle" onClick={() => handlers.current.onEdit?.(customer)}><Icon icon="edit" className="fs-lg" /></Button>}
                        {canDelete && <Button variant="danger" size="sm" className="btn-icon rounded-circle" onClick={() => handlers.current.onDelete?.(customer)}><Icon icon="trash" className="fs-lg" /></Button>}
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              )
            })}
            {!paginatedGridData.length && (
              <Col xs={12}>
                <div className="text-center text-muted py-4 border rounded bg-light-subtle">
                  No data available.
                </div>
              </Col>
            )}
          </Row>
          {renderGridPagination()}
        </>
      )}
    </>
  )
}

export default CustomersTable
