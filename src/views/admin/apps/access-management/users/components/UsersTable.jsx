import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Button, Card, CardBody, Col, FormControl, FormSelect, Row } from 'react-bootstrap'
import { paginationIcons } from '../../utils/paginationIcons'
import { bindColumnSearchInputs } from '../../utils/dataTableColumnSearch'
import Icon from '@/components/wrappers/Icon'

DataTable.use(DT)

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

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
  {
    data: 'id',
    width: '40px',
    className: 'text-muted small',
  },
  {
    data: 'user_search',
    render: (_val, _type, row) => `<div class="user-cell-slot" data-id="${row.id}"></div>`,
  },
  {
    data: 'roles_search',
    render: (_val, _type, row) => escapeHtml(row.roles_search || 'No roles'),
  },
  {
    data: 'updated_at',
    render: (updatedAt) => {
      const { date, time } = formatLastUpdated(updatedAt)
      return `${escapeHtml(date)}${time ? ` <small class="text-muted">${escapeHtml(time)}</small>` : ''}`
    },
  },
  {
    data: 'status',
    render: (_val, _type, row) => {
      const status = String(row.status || 'active').toLowerCase()
      return `<span class="badge ${statusBadgeClass(status)} badge-label">${statusLabel(status)}</span>`
    },
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

const gridPageSizes = [4, 8, 12, 16, 20]

/**
 * UsersTable
 *
 * Props:
 *   data     – users array (each item should include `roles` array and `roles_search` string)
 *   onEdit   – (user) => void
 *   onDelete – (user) => void
 */
const UsersTable = ({ data, viewMode = 'list', permissions = {}, onEdit, onDelete }) => {
  const [searchText, setSearchText] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [pageSize, setPageSize] = useState(8)
  const [page, setPage] = useState(1)

  const handlers = useRef({ onEdit, onDelete })
  handlers.current = { onEdit, onDelete }
  const canEdit = Boolean(permissions.can_edit)
  const canDelete = Boolean(permissions.can_delete)

  const roleOptions = useMemo(() => {
    const roles = new Set()
    data.forEach((user) => {
      ;(user.roles || []).forEach((role) => {
        if (role?.name) {
          roles.add(role.name)
        }
      })
    })
    return Array.from(roles).sort((a, b) => a.localeCompare(b))
  }, [data])

  const gridFilteredData = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    return data.filter((user) => {
      const rolesText = (user.roles || []).map((role) => role?.name).filter(Boolean).join(' ')
      const userStatus = String(user.status || 'active').toLowerCase()
      const matchesSearch = !query || [
        user.name,
        user.email,
        user.mobile_number,
        user.address,
        rolesText,
        String(user.id ?? ''),
      ].some((value) => String(value ?? '').toLowerCase().includes(query))

      const matchesRole = roleFilter === 'all' || (user.roles || []).some((role) => role?.name === roleFilter)
      const matchesStatus = statusFilter === 'all' || userStatus === statusFilter
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [data, searchText, roleFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(gridFilteredData.length / pageSize))

  useEffect(() => {
    setPage(1)
  }, [searchText, roleFilter, statusFilter, pageSize, viewMode])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const paginatedGridData = useMemo(() => {
    const start = (page - 1) * pageSize
    return gridFilteredData.slice(start, start + pageSize)
  }, [gridFilteredData, page, pageSize])

  const rowMap = useMemo(() => {
    const map = {}
    data.forEach((u) => { map[u.id] = u })
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
      const userCellSlot = row.querySelector('.user-cell-slot')
      if (userCellSlot) {
        const userRoot = userCellSlot.__userRoot || createRoot(userCellSlot)
        userCellSlot.__userRoot = userRoot
        userRoot.render(
          <div className="d-flex align-items-center gap-2">
            <div className="avatar avatar-sm flex-shrink-0" style={{ width: 32, height: 32 }}>
              {item.avatar_url ? (
                <img
                  src={item.avatar_url}
                  className="rounded-circle"
                  alt={item.name || 'user'}
                  width={32}
                  height={32}
                  style={{ width: 32, height: 32, objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div className="rounded-circle bg-light d-flex align-items-center justify-content-center text-muted" style={{ width: 32, height: 32 }}>
                  <Icon icon="user" className="fs-sm" />
                </div>
              )}
            </div>
            <div>
              <h5 className="fs-base mb-0">{item.name || '—'}</h5>
              <p className="text-muted fs-xs mb-0">{item.email || ''}</p>
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
    if (!gridFilteredData.length) {
      return null
    }

    const maxVisiblePages = 5
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
    startPage = Math.max(1, endPage - maxVisiblePages + 1)

    const pageItems = []
    for (let p = startPage; p <= endPage; p += 1) {
      pageItems.push(
        <li key={p} className={`page-item${p === page ? ' active' : ''}`}>
          <button type="button" className="page-link" onClick={() => setPage(p)}>
            {p}
          </button>
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
                    <FormControl
                      type="text"
                      placeholder="Search users..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                    />
                    <Icon icon="search" className="app-search-icon text-muted" />
                  </div>
                </Col>
                <Col>
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <span className="me-2 fw-semibold">Filter By:</span>
                    <div className="app-search">
                      <FormSelect
                        className="form-control my-1 my-md-0"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                      >
                        <option value="all">Role</option>
                        {roleOptions.map((roleName) => (
                          <option key={roleName} value={roleName}>{roleName}</option>
                        ))}
                      </FormSelect>
                      <Icon icon="user-check" className="app-search-icon text-muted" />
                    </div>
                    <div className="app-search">
                      <FormSelect
                        className="form-control my-1 my-md-0"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="all">Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </FormSelect>
                      <Icon icon="user-hexagon" className="app-search-icon text-muted" />
                    </div>
                    <div className="app-search">
                      <FormSelect
                        className="form-control my-1 my-md-0"
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                      >
                        {gridPageSizes.map((size) => (
                          <option key={size} value={size}>{size} / page</option>
                        ))}
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
        <DataTable
          data={data}
          columns={columns}
          options={options}
          className="table dt-responsive align-middle mb-0 w-100"
        >
          <thead className="thead-sm text-uppercase fs-xxs">
            <tr>
              <th>#</th>
              <th>User</th>
              <th>Assigned Role(s)</th>
              <th>Last Updated</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
            <tr className="column-search-input-bar">
              <th />
              <th>
                <FormControl size="sm" type="text" placeholder="User" className="bg-light-subtle border-light" data-col-index="1" />
              </th>
              <th>
                <FormControl size="sm" type="text" placeholder="Assigned Role(s)" className="bg-light-subtle border-light" data-col-index="2" />
              </th>
              <th>
                <FormControl size="sm" type="text" placeholder="Last Updated" className="bg-light-subtle border-light" data-col-index="3" />
              </th>
              <th>
                <FormControl size="sm" type="text" placeholder="Status" className="bg-light-subtle border-light" data-col-index="4" />
              </th>
              <th />
            </tr>
          </thead>
        </DataTable>
      ) : (
        <>
          <Row>
            {paginatedGridData.map((user) => {
              const status = String(user.status || 'active').toLowerCase()
              const { date, time } = formatLastUpdated(user.updated_at)
              return (
                <Col md={6} xxl={3} key={user.id} className="mb-3">
                  <Card className="card-h-100 border shadow-sm rounded-3 overflow-hidden bg-body-secondary">
                    <CardBody className="p-4">
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <div className="avatar avatar-md flex-shrink-0" style={{ width: 48, height: 48 }}>
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.name || 'user'}
                              className="rounded-circle"
                              width={48}
                              height={48}
                              style={{ width: 48, height: 48, objectFit: 'cover', display: 'block' }}
                            />
                          ) : (
                            <div className="rounded-circle bg-light d-flex align-items-center justify-content-center text-muted" style={{ width: 48, height: 48 }}>
                              <Icon icon="user" className="fs-lg" />
                            </div>
                          )}
                        </div>
                        <div className="flex-grow-1">
                          <h5 className="mb-0">{user.name || '—'}</h5>
                          <span className={`badge ${statusBadgeClass(status)} badge-label mt-1`}>
                            {statusLabel(status)}
                          </span>
                        </div>
                      </div>

                      <ul className="list-unstyled text-muted mb-3">
                        <li className="mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <div className="avatar-xs avatar-img-size fs-24">
                              <span className="avatar-title text-bg-light fs-sm rounded-circle">
                                <Icon icon="mail" />
                              </span>
                            </div>
                            <h6 className="mb-0 fw-medium text-body">{user.email || '—'}</h6>
                          </div>
                        </li>
                        <li className="mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <div className="avatar-xs avatar-img-size fs-24">
                              <span className="avatar-title text-bg-light fs-sm rounded-circle">
                                <Icon icon="phone" />
                              </span>
                            </div>
                            <h6 className="mb-0 fw-medium text-body">{user.mobile_number || '—'}</h6>
                          </div>
                        </li>
                        <li>
                          <div className="d-flex align-items-center gap-2">
                            <div className="avatar-xs avatar-img-size fs-24">
                              <span className="avatar-title text-bg-light fs-sm rounded-circle">
                                <Icon icon="map-pin" />
                              </span>
                            </div>
                            <h6 className="mb-0 fw-medium text-body">{user.address || '—'}</h6>
                          </div>
                        </li>
                      </ul>

                      <div className="mb-3">
                        <div className="text-muted fs-xs mb-1">Assigned Role(s)</div>
                        <div className="fw-medium">{user.roles_search || 'No roles'}</div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted fs-xs">
                          <Icon icon="refresh" className="me-1" />
                          {date} {time}
                        </span>
                        <div className="d-flex gap-1">
                          {canEdit && (
                            <Button variant="light" size="sm" className="btn-icon rounded-circle" title="Edit" aria-label="Edit" onClick={() => onEdit(user)}>
                              <Icon icon="edit" className="fs-lg" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button variant="danger" size="sm" className="btn-icon rounded-circle" title="Delete" aria-label="Delete" onClick={() => onDelete(user)}>
                              <Icon icon="trash" className="fs-lg" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              )
            })}
            {!paginatedGridData.length && (
              <Col xs={12}>
                <div className="text-center text-muted py-4 border rounded bg-light-subtle">
                  No users found.
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

export default UsersTable
