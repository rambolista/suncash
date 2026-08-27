import { useEffect, useState } from 'react'
import { Modal, Spinner, Table } from 'react-bootstrap'
import ApiService from '@/services/ApiService'

const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(String(value).replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

/** Legacy's "View Transactions" button — a merchant's general ledger history (not settlement-specific). */
const MerchantTransactionsModal = ({ show, onHide, merchantId, merchantName }) => {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!show || !merchantId) return
    setLoading(true)
    ApiService.getMerchantTransactionHistory(merchantId)
      .then((data) => setRows(Array.isArray(data?.data) ? data.data : []))
      .finally(() => setLoading(false))
  }, [show, merchantId])

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Transaction History — {merchantName}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-4"><Spinner size="sm" /></div>
        ) : (
          <div className="table-responsive" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <Table size="sm" className="align-middle mb-0">
              <thead className="thead-sm text-uppercase fs-xxs">
                <tr>
                  <th>Transaction Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index}>
                    <td className="text-nowrap">{formatDateTime(row.timestamp)}</td>
                    <td>{row.transaction_type || '—'}</td>
                    <td>{row.description || '—'}</td>
                    <td>BSD {Number(row.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr><td colSpan={4} className="text-center text-muted py-4">No transactions found for this merchant.</td></tr>
                )}
              </tbody>
            </Table>
          </div>
        )}
      </Modal.Body>
    </Modal>
  )
}

export default MerchantTransactionsModal
