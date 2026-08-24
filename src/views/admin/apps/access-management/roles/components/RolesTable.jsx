import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Button, Card, CardBody, Col, FormControl, FormSelect, OverlayTrigger, Row, Tooltip } from 'react-bootstrap'
import { paginationIcons } from '../../utils/paginationIcons'
import { bindColumnSearchInputs } from '../../utils/dataTableColumnSearch'
import Icon from '@/components/wrappers/Icon'
import { generateInitials } from '@/utils/helpers'

DataTable.use(DT)

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const parseResponsibilities = (value) => {
  if (!value) return []
  return String(value)
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

const formatUpdated = (value) => {
  if (!value) return 'N/A'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return String(value)
  return parsed.toLocaleString()
}

const columns = [
  {
    data: 'id',
    width: '40px',
    className: 'text-muted small',
  },
  {
    data: 'name',
    render: (_name, _type, row) => `<div class="role-name-slot" data-id="${row.id}"></div>`,
  },
  {
    data: 'description',
    className: 'text-muted small',
    render: (v) => escapeHtml(v || '-'),
  },
  {
    data: 'users_count',
    width: '220px',
    className: 'text-start',
    defaultContent: 0,
    render: (count, _type, row) => {
      const members = Array.isArray(row.role_users) ? row.role_users : []
      const shownMembers = members.slice(0, 4)
      const hiddenCount = Math.max(0, members.length - shownMembers.length)
      const membersSearchText = members.map((member) => `${member?.name ?? ''} ${member?.email ?? ''}`).join(' ')

      const avatars = shownMembers.map((member) => {
        const hoverName = escapeHtml(member?.name || member?.email || 'User')
        if (member?.avatar_url) {
          return `<div class="avatar avatar-sm" title="${hoverName}"><img src="${escapeHtml(member.avatar_url)}" class="rounded-circle avatar-sm" alt="${escapeHtml(member.name || 'user')}" width="32" height="32" style="object-fit:cover;display:block;" /></div>`
        }
        return `<div class="avatar avatar-sm" title="${hoverName}"><span class="avatar-title text-bg-primary rounded-circle fw-semibold avatar-sm d-inline-flex align-items-center justify-content-center">${escapeHtml(generateInitials(member?.name || 'U'))}</span></div>`
      }).join('')

      const moreAvatar = hiddenCount > 0
        ? `<div class="avatar avatar-sm"><span class="avatar-title text-bg-primary rounded-circle fw-bold">+${hiddenCount}</span></div>`
        : ''

      return `
        <span class="d-none">${escapeHtml(membersSearchText)}</span>
        <div class="avatar-group avatar-group-sm mb-1">${avatars}${moreAvatar}</div>
        <small class="text-muted">Total ${count ?? members.length ?? 0} users</small>
      `
    },
  },
  {
    data: 'updated_at',
    className: 'text-muted small',
    render: (value) => escapeHtml(formatUpdated(value)),
  },
  {
    data: 'id',
    orderable: false,
    searchable: false,
    width: '130px',
    className: 'text-nowrap action-cell',
    render: (id) => `<div class="action-slot" data-id="${id}"></div>`,
  },
]

const gridPageSizes = [4, 8, 12, 16, 20]

const RolesTable = ({ data, users = [], viewMode = 'list', permissions = {}, onAccess, onEdit, onDelete }) => {
  const [searchText, setSearchText] = useState('')
  const [memberFilter, setMemberFilter] = useState('all')
  const [pageSize, setPageSize] = useState(8)
  const [page, setPage] = useState(1)

  const handlers = useRef({ onAccess, onEdit, onDelete })
  handlers.current = { onAccess, onEdit, onDelete }
  const canEdit = Boolean(permissions.can_edit)
  const canDelete = Boolean(permissions.can_delete)

  const usersByRoleId = useMemo(() => {
    const map = new Map()
    data.forEach((role) => {
      const roleUsers = users.filter((user) => Array.isArray(user.role_ids) && user.role_ids.includes(role.id))
      map.set(role.id, roleUsers)
    })
    return map
  }, [data, users])

  const gridFilteredData = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    return data.filter((role) => {
      const responsibilities = parseResponsibilities(role.key_responsibilities).join(' ')
      const assignedUsers = usersByRoleId.get(role.id) ?? []
      const membersText = assignedUsers.map((u) => `${u.name ?? ''} ${u.email ?? ''}`).join(' ')
      const count = Number(role.users_count ?? assignedUsers.length ?? 0)

      const matchesSearch = !query || [
        role.name,
        role.description,
        responsibilities,
        membersText,
        String(role.id ?? ''),
      ].some((value) => String(value ?? '').toLowerCase().includes(query))

      const matchesFilter = memberFilter === 'all'
        || (memberFilter === 'with-users' && count > 0)
        || (memberFilter === 'no-users' && count === 0)

      return matchesSearch && matchesFilter
    })
  }, [data, searchText, memberFilter, usersByRoleId])

  const totalPages = Math.max(1, Math.ceil(gridFilteredData.length / pageSize))

  useEffect(() => {
    setPage(1)
  }, [searchText, memberFilter, pageSize, viewMode])

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
    data.forEach((role) => { map[role.id] = role })
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
      const nameSlot = row.querySelector('.role-name-slot')
      if (nameSlot) {
        const nameRoot = nameSlot.__nameRoot || createRoot(nameSlot)
        nameSlot.__nameRoot = nameRoot
        nameRoot.render(
          <div className="d-flex align-items-center gap-2">
            <span className="avatar-xs avatar-img-size fs-20">
              <span className="avatar-title text-bg-light rounded-circle">
                <Icon icon={item.icon || 'shield'} />
              </span>
            </span>
            <span className="fw-medium">{item.name ?? ''}</span>
          </div>
        )
      }

      const slot = row.querySelector('.action-slot')
      if (!slot) return
      const root = slot.__actionRoot || createRoot(slot)
      slot.__actionRoot = root
      root.render(
        <div className="d-flex gap-1">
          <Button variant="light" size="sm" className="btn-icon rounded-circle" title="Access" aria-label="Access" onClick={() => handlers.current.onAccess?.(item)}>
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
                      placeholder="Search roles..."
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
                        value={memberFilter}
                        onChange={(e) => setMemberFilter(e.target.value)}
                      >
                        <option value="all">Members</option>
                        <option value="with-users">With Users</option>
                        <option value="no-users">No Users</option>
                      </FormSelect>
                      <Icon icon="users" className="app-search-icon text-muted" />
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
              <th>Role name</th>
              <th>Description</th>
              <th>User image</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
            <tr className="column-search-input-bar">
              <th />
              <th>
                <FormControl size="sm" type="text" placeholder="Role name" className="bg-light-subtle border-light" data-col-index="1" />
              </th>
              <th>
                <FormControl size="sm" type="text" placeholder="Description" className="bg-light-subtle border-light" data-col-index="2" />
              </th>
              <th>
                <FormControl size="sm" type="text" placeholder="Users" className="bg-light-subtle border-light" data-col-index="3" />
              </th>
              <th>
                <FormControl size="sm" type="text" placeholder="Last Updated" className="bg-light-subtle border-light" data-col-index="4" />
              </th>
              <th />
            </tr>
          </thead>
        </DataTable>
      ) : (
        <>
          <Row>
            {paginatedGridData.map((role) => {
              const responsibilities = parseResponsibilities(role.key_responsibilities)
              const featureItems = responsibilities.length ? responsibilities : ['No key responsibilities']
              const members = usersByRoleId.get(role.id) ?? []
              const shownMembers = members.slice(0, 4)
              return (
                <Col md={6} xxl={3} key={role.id} className="mb-3">
                  <Card className="card-h-100 border shadow-sm rounded-3 overflow-hidden bg-body-secondary">
                    <CardBody className="p-4 d-flex flex-column justify-content-between">
                      <div className="d-flex align-items-center mb-4">
                        <div className="flex-shrink-0">
                          <div className="avatar-xl rounded-circle bg-primary-subtle d-flex align-items-center justify-content-center">
                            <Icon icon={role.icon || 'shield'} className="fs-24 text-primary" />
                          </div>
                        </div>
                        <div className="ms-3">
                          <h5 className="mb-2">{role.name}</h5>
                          <p className="text-muted mb-0 fs-base">{role.description || 'No description.'}</p>
                        </div>
                      </div>

                      <ul className="list-unstyled mb-3">
                        {featureItems.map((feature, idx) => (
                          <li className={`d-flex align-items-center ${idx !== featureItems.length - 1 ? 'mb-2' : ''}`} key={`${role.id}-feature-${idx}`}>
                            <Icon icon="check" className="fs-lg text-success me-2" /> {feature}
                          </li>
                        ))}
                      </ul>

                      <p className="mb-2 text-muted">Total {Number(role.users_count ?? members.length)} users</p>
                      <div className="avatar-group avatar-group-sm mb-3">
                        {shownMembers.map((member) => (
                          <div className="avatar avatar-sm" key={`role-${role.id}-user-${member.id}`} title={member.name || member.email || 'User'}>
                            {member.avatar_url ? (
                              <img src={member.avatar_url} className="rounded-circle avatar-sm" alt={member.name || 'user'} width={32} height={32} style={{ objectFit: 'cover', display: 'block' }} />
                            ) : (
                              <span className="avatar-title text-bg-primary rounded-circle fw-semibold avatar-sm d-inline-flex align-items-center justify-content-center">
                                {generateInitials(member.name || 'U')}
                              </span>
                            )}
                          </div>
                        ))}

                        {members.length > 4 && (
                          <OverlayTrigger overlay={<Tooltip>{members.length - 4} more</Tooltip>}>
                            <div className="avatar avatar-sm">
                              <span className="avatar-title text-bg-primary rounded-circle fw-bold">+{members.length - 4}</span>
                            </div>
                          </OverlayTrigger>
                        )}
                      </div>

                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted fs-xs">
                          <Icon icon="clock" className="me-1" />
                          Updated {formatUpdated(role.updated_at)}
                        </span>
                        <div className="d-flex gap-1">
                          <Button variant="light" size="sm" className="btn-icon rounded-circle" title="Access" aria-label="Access" onClick={() => onAccess(role)}>
                            <Icon icon="eye" className="fs-lg" />
                          </Button>
                          {canEdit && (
                            <Button variant="light" size="sm" className="btn-icon rounded-circle" title="Edit" aria-label="Edit" onClick={() => onEdit(role)}>
                              <Icon icon="edit" className="fs-lg" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button variant="danger" size="sm" className="btn-icon rounded-circle" title="Delete" aria-label="Delete" onClick={() => onDelete(role)}>
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
                  No roles found.
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

export default RolesTable
