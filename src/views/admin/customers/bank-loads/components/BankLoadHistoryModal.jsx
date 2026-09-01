import DT from 'datatables.net-bs5'
import DataTable from 'datatables.net-react'
import 'datatables.net-responsive'
import { useEffect, useMemo, useState } from 'react'
import { FormControl, Modal, Spinner } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { bindColumnSearchInputs } from '@/views/admin/apps/access-management/utils/dataTableColumnSearch'
import { bindSortLabels } from '@/views/admin/apps/access-management/utils/dataTableSortLabels'
import { paginationIcons } from '@/views/admin/apps/access-management/utils/paginationIcons'

DataTable.use(DT)

const STATUS_BADGE = {
  PENDING: 'bg-warning-subtle text-warning',
  PROCESSED: 'bg-success-subtle text-success',
  REJECTED: 'bg-danger-subtle text-danger',
}

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

const columns = [
  { data: 'created_date', render: (value, type) => (type === 'display' ? formatDateTime(value) : value || '') },
  { data: 'transaction_id', render: (value) => escapeHtml(value || '—') },
  { data: 'amount', render: (value, type) => (type === 'display' ? money(value) : value) },
  {
    data: 'status',
    render: (value, type) => (type === 'display'
      ? `<span class="badge ${STATUS_BADGE[value] || 'bg-secondary-subtle text-secondary'} badge-label">${escapeHtml(value)}</span>`
      : value),
  },
]

const headers = ['Date/Time', 'Transaction ID', 'Amount', 'Status']

/** Legacy's "View Settlements" button — this same customer's other Bank Load requests. */
const BankLoadHistoryModal = ({ show, onHide, bankLoadId, customerName }) => {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!show || !bankLoadId) return
    setLoading(true)
    ApiService.getCustomerBankLoadHistory(bankLoadId)
      .then((data) => setRows(Array.isArray(data?.data) ? data.data : []))
      .finally(() => setLoading(false))
  }, [show, bankLoadId])

  const options = useMemo(() => ({
    responsive: true,
    orderCellsTop: true,
    columnDefs: [{ targets: '_all', orderSequence: ['asc', 'desc', ''] }],
    initComplete: function () {
      bindColumnSearchInputs(this.api())
      bindSortLabels(this.api())
    },
    language: { paginate: paginationIcons },
  }), [])

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Bank Load History — {customerName}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-4"><Spinner size="sm" /></div>
        ) : (
          <DataTable data={rows} columns={columns} options={options} className="table dt-responsive align-middle mb-0 w-100">
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
        )}
      </Modal.Body>
    </Modal>
  )
}

export default BankLoadHistoryModal
