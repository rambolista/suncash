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
  { data: 'timestamp', render: (value, type) => (type === 'display' ? formatDateTime(value) : value || '') },
  { data: 'transaction_id', render: (value) => escapeHtml(value || '—') },
  { data: 'description', render: (value) => escapeHtml(value || '—') },
  { data: 'debit', render: (value, type) => (type === 'display' ? (value ? money(value) : '—') : value) },
  { data: 'credit', render: (value, type) => (type === 'display' ? (value ? money(value) : '—') : value) },
  { data: 'balance', render: (value, type) => (type === 'display' ? money(value) : value) },
]

const headers = ['Date/Time', 'Transaction ID', 'Description', 'Debit', 'Credit', 'Balance']

/** Legacy's "View Transactions" button — the customer's card-balance ledger, latest 10 entries. */
const CustomerTransactionsModal = ({ show, onHide, settlementId, customerName }) => {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!show || !settlementId) return
    setLoading(true)
    ApiService.getCustomerSettlementTransactions(settlementId)
      .then((data) => setRows(Array.isArray(data?.data) ? data.data : []))
      .finally(() => setLoading(false))
  }, [show, settlementId])

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
        <Modal.Title>Transaction History — {customerName}</Modal.Title>
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

export default CustomerTransactionsModal
