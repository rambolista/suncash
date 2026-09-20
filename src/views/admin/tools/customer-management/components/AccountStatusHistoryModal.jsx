import { useEffect, useState } from 'react'
import { Button, Col, Form, Modal, Row, Table } from 'react-bootstrap'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import { formatDateTime } from '@/utils/reportHelpers'

const STATUS_LABEL = { A: 'Active', L: 'Locked', R: 'Restricted' }
const today = () => new Date().toISOString().slice(0, 10)

/** Legacy's export here is a pure client-side HTML/table export (no server endpoint) — same shape reproduced as a small client-built CSV. */
const exportCsv = (rows) => {
  const headers = ['Date', 'From Status', 'To Status', 'Reason', 'Note', 'Reference', 'Changed By']
  const csvRow = (cells) => cells.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')
  const lines = [csvRow(headers), ...rows.map((r) => csvRow([
    formatDateTime(r.created_date), STATUS_LABEL[r.from_status] || r.from_status, STATUS_LABEL[r.to_status] || r.to_status,
    r.reason_label, r.note, r.reference, r.created_by,
  ]))]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `account-status-history-${Date.now()}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

const AccountStatusHistoryModal = ({ show, onHide, customerId }) => {
  const { showNotification } = useNotificationContext()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState(today())
  const [status, setStatus] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  const load = () => {
    if (!from || !to) {
      showNotification({ title: 'Failed', message: 'Please fill in both dates.', variant: 'danger' })
      return
    }
    setLoading(true)
    ApiService.getCustomerManagementAccountStatusHistory(customerId, { start_date: from, end_date: to, status: status || null })
      .then((data) => setRows(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load status history.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (show) {
      setFrom(today())
      setTo(today())
      setStatus('')
      setRows([])
    }
  }, [show, customerId])

  return (
    <Modal show={show} onHide={onHide} centered size="xl">
      <Modal.Header closeButton>
        <Modal.Title>Account Status History</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="g-2 align-items-end mb-3">
          <Col md={3}>
            <Form.Label className="small text-muted mb-1">Status</Form.Label>
            <Form.Select size="sm" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>
              <option value="A">Active</option>
              <option value="L">Locked</option>
              <option value="R">Restricted</option>
            </Form.Select>
          </Col>
          <Col md={3}>
            <Form.Label className="small text-muted mb-1">Date From</Form.Label>
            <Form.Control size="sm" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Col>
          <Col md={3}>
            <Form.Label className="small text-muted mb-1">Date To</Form.Label>
            <Form.Control size="sm" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Col>
          <Col md="auto">
            <Button size="sm" variant="primary" onClick={load} disabled={loading}>{loading ? 'Loading...' : 'Filter'}</Button>
          </Col>
          <Col md="auto" className="ms-auto">
            <Button size="sm" variant="outline-success" disabled={!rows.length} onClick={() => exportCsv(rows)}>Export</Button>
          </Col>
        </Row>

        {loading ? <LoadingState message="Loading history..." /> : (
          <div className="table-responsive">
            <Table bordered hover size="sm" className="align-middle mb-0">
              <thead>
                <tr>
                  <th>Date</th><th>From</th><th>To</th><th>Reason</th><th>Note</th><th>Reference</th><th>Changed By</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="text-nowrap">{formatDateTime(r.created_date)}</td>
                    <td>{STATUS_LABEL[r.from_status] || r.from_status || '—'}</td>
                    <td>{STATUS_LABEL[r.to_status] || r.to_status || '—'}</td>
                    <td>{r.reason_label}</td>
                    <td>{r.note}</td>
                    <td>{r.reference}</td>
                    <td>{r.created_by}</td>
                  </tr>
                ))}
                {!rows.length && <tr><td colSpan={7} className="text-center text-muted py-4">No history found for this range.</td></tr>}
              </tbody>
            </Table>
          </div>
        )}

        <p className="text-muted fs-xxs mt-2 mb-0">Status history is permanent and cannot be edited or deleted.</p>
      </Modal.Body>
    </Modal>
  )
}

export default AccountStatusHistoryModal
