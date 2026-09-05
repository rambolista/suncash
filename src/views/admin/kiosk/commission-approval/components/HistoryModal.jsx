import { Badge, Button, Modal, Table } from 'react-bootstrap'
import { useEffect, useState } from 'react'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import LoadingState from '@/components/LoadingState'
import { money } from './format'

const STATUS_VARIANT = { pending: 'warning', processed: 'success', rejected: 'danger' }
const STATUS_LABEL = { pending: 'Pending', processed: 'Approved', rejected: 'Rejected' }

const HistoryModal = ({ show, onHide, terminal }) => {
  const { showNotification } = useNotificationContext()
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState([])

  useEffect(() => {
    if (!show || !terminal) return
    setLoading(true)
    ApiService.getKioskCommissionApprovalHistory(terminal.terminal_id)
      .then((data) => setRows(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load history.', variant: 'danger' }))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, terminal])

  return (
    <Modal show={show} onHide={onHide} centered size="xl">
      <Modal.Header closeButton>
        <Modal.Title>Commission History{terminal ? ` — ${terminal.kiosk}` : ''}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? <LoadingState message="Loading history..." /> : (
          <Table responsive hover size="sm" className="align-middle mb-0">
            <thead className="thead-sm text-uppercase fs-xxs table-light">
              <tr>
                <th>Date</th>
                <th>Transaction Volume</th>
                <th>Revenue</th>
                <th>Commission Type</th>
                <th>Commission Rate</th>
                <th>Commission Payment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={7} className="text-center text-muted py-4">No commission history found for this terminal.</td></tr>
              )}
              {rows.map((row) => (
                <tr key={row.transaction_id}>
                  <td>{row.create_date}</td>
                  <td>{money(row.total_amount)}</td>
                  <td>{money(row.total_revenue)}</td>
                  <td>{row.commission_type}</td>
                  <td>{row.commission_rate}</td>
                  <td>{money(row.commission_payment)}</td>
                  <td><Badge bg={`${STATUS_VARIANT[row.status] || 'secondary'}-subtle`} className={`text-${STATUS_VARIANT[row.status] || 'secondary'}`}>{STATUS_LABEL[row.status] || row.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Back</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default HistoryModal
