import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useEffect, useMemo, useState } from 'react'
import { Badge, FormControl, Modal, Nav, Spinner } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { bindColumnSearchInputs } from '@/views/admin/apps/access-management/utils/dataTableColumnSearch'
import { bindSortLabels } from '@/views/admin/apps/access-management/utils/dataTableSortLabels'
import { paginationIcons } from '@/views/admin/apps/access-management/utils/paginationIcons'

DataTable.use(DT)

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(String(value).replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return escapeHtml(value)
  return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const money = (value) => `BSD ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const STATUS_BADGE = {
  ACTIVE: 'bg-success-subtle text-success',
  PENDING: 'bg-warning-subtle text-warning',
  DISABLED: 'bg-danger-subtle text-danger',
}

const columns = [
  { data: 'created_at', render: (value, type) => (type === 'display' ? formatDateTime(value) : value || '') },
  { data: 'merchant_name', render: (value) => escapeHtml(value || '—') },
  { data: 'name', render: (value) => escapeHtml(value || '—') },
  { data: 'min_amount', render: (value, type) => (type === 'display' ? money(value) : value) },
  { data: 'max_amount', render: (value, type) => (type === 'display' ? money(value) : value) },
  { data: 'amount', render: (value, type) => (type === 'display' ? money(value) : value) },
  {
    data: 'status',
    render: (value, type) => (type === 'display'
      ? `<span class="badge ${STATUS_BADGE[value] || 'bg-secondary-subtle text-secondary'} badge-label">${escapeHtml(value)}</span>`
      : value),
  },
]

const headers = ['Date Created', 'Business Name', 'Name', 'Min Amount', 'Max Amount', 'Amount', 'Status']

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'active', label: 'Active' },
  { key: 'disabled', label: 'Disabled' },
]

const TypesTable = ({ data }) => {
  const options = useMemo(() => ({
    responsive: true,
    orderCellsTop: true,
    order: [[0, 'desc']],
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    initComplete: function () {
      bindColumnSearchInputs(this.api())
      bindSortLabels(this.api())
    },
    language: { paginate: paginationIcons },
  }), [])

  return (
    <DataTable data={data} columns={columns} options={options} className="table dt-responsive align-middle mb-0 w-100">
      <thead className="thead-sm text-uppercase fs-xxs">
        <tr>
          {headers.map((header) => <th key={header}>{header}</th>)}
        </tr>
        <tr className="column-search-input-bar">
          {headers.map((header, index) => (
            <th key={header}>
              <FormControl size="sm" type="text" placeholder={header} className="bg-light-subtle border-light" data-col-index={index} />
            </th>
          ))}
        </tr>
      </thead>
    </DataTable>
  )
}

const ProductTypesModal = ({ show, onHide, product }) => {
  const [tab, setTab] = useState('pending')
  const [rows, setRows] = useState({ pending: [], active: [], disabled: [] })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!show || !product) return
    setTab('pending')
    setLoading(true)
    ApiService.getGiftcardProductTypes(product.id)
      .then((data) => setRows({ pending: data?.pending || [], active: data?.active || [], disabled: data?.disabled || [] }))
      .finally(() => setLoading(false))
  }, [show, product])

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Product Types — {product?.product_name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Nav variant="tabs" activeKey={tab} onSelect={(key) => key && setTab(key)} className="nav-bordered nav-bordered-primary mb-3">
          {TABS.map((t) => {
            const isActive = t.key === tab
            return (
              <Nav.Item key={t.key}>
                <Nav.Link eventKey={t.key} className="d-flex align-items-center gap-2">
                  <span className="fw-semibold">{t.label}</span>
                  <Badge bg={isActive ? 'primary' : 'light'} text={isActive ? undefined : 'dark'} className="rounded-pill">
                    {rows[t.key].length}
                  </Badge>
                </Nav.Link>
              </Nav.Item>
            )
          })}
        </Nav>
        {loading ? (
          <div className="text-center py-4"><Spinner size="sm" /></div>
        ) : (
          <TypesTable key={tab} data={rows[tab] || []} />
        )}
      </Modal.Body>
    </Modal>
  )
}

export default ProductTypesModal
