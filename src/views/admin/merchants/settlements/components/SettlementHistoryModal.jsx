import { useEffect, useState } from 'react'
import { Modal, Spinner, Table } from 'react-bootstrap'
import ApiService from '@/services/ApiService'

const STATUS_BADGE = {
  P: 'bg-warning-subtle text-warning',
  A: 'bg-success-subtle text-success',
  R: 'bg-danger-subtle text-danger',
}

const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(String(value).replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const SettlementHistoryModal = ({ show, onHide, merchantId, merchantName }) => {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!show || !merchantId) return
    setLoading(true)
    ApiService.getMerchantSettlementHistory(merchantId)
      .then((data) => setRows(Array.isArray(data?.data) ? data.data : []))
      .finally(() => setLoading(false))
  }, [show, merchantId])

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Settlement History — {merchantName}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-4"><Spinner size="sm" /></div>
        ) : (
          <div className="table-responsive">
            <Table size="sm" className="align-middle mb-0">
              <thead className="thead-sm text-uppercase fs-xxs">
                <tr>
                  <th>Date/Time</th>
                  <th>Transaction ID</th>
                  <th>Type</th>
                  <th>Withdrawal Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="text-nowrap">{formatDateTime(row.created_date)}</td>
                    <td>{row.transaction_id}</td>
                    <td>{row.type || '—'}</td>
                    <td>{row.w_type || '—'}</td>
                    <td>BSD {Number(row.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td><span className={`badge ${STATUS_BADGE[row.status] || 'bg-secondary-subtle text-secondary'} badge-label`}>{row.status_text}</span></td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr><td colSpan={6} className="text-center text-muted py-4">No settlement requests found for this merchant.</td></tr>
                )}
              </tbody>
            </Table>
          </div>
        )}
      </Modal.Body>
    </Modal>
  )
}

export default SettlementHistoryModal
