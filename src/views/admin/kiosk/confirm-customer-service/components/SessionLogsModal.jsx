import { useEffect, useState } from 'react'
import { Modal, Button, Table } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import LoadingState from '@/components/LoadingState'
import { formatDateTime } from '@/utils/reportHelpers'

const SessionLogsModal = ({ show, onHide, sessionId }) => {
  const { showNotification } = useNotificationContext()
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState([])

  useEffect(() => {
    if (!show || !sessionId) return
    setLoading(true)
    ApiService.getKioskConfirmCustomerServiceSessionLogs(sessionId)
      .then((data) => setRows(Array.isArray(data?.rows) ? data.rows : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load session logs.', variant: 'danger' }))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, sessionId])

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>Kiosk Session Log</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? <LoadingState message="Loading session log..." /> : rows.length === 0 ? (
          <p className="text-muted mb-0">No API call log found for this session.</p>
        ) : (
          <div className="table-responsive">
            <Table striped bordered size="sm" className="mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date/Time</th>
                  <th>Method</th>
                  <th>Params</th>
                  <th>Response</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.trx_id}>
                    <td>{row.trx_id}</td>
                    <td className="text-nowrap">{formatDateTime(row.trx_date)}</td>
                    <td>{row.method}</td>
                    <td className="text-break">{row.params || '—'}</td>
                    <td className="text-break" style={{ maxWidth: 360 }}>{row.response || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default SessionLogsModal
