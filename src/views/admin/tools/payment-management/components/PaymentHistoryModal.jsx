import { useEffect, useState } from 'react'
import { Button, Modal } from 'react-bootstrap'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import { downloadBlob } from '@/utils/reportHelpers'

const ValueChips = ({ values }) => {
  if (!values || Object.keys(values).length === 0) return null
  return (
    <div className="d-flex flex-wrap gap-1 mt-1">
      {Object.entries(values).map(([key, value]) => (
        <span key={key} className="badge bg-light text-dark border fw-normal">{key}: {String(value)}</span>
      ))}
    </div>
  )
}

const PaymentHistoryModal = ({ show, payment, canExport, onHide }) => {
  const { showNotification } = useNotificationContext()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!show || !payment) return
    setLoading(true)
    ApiService.getPaymentManagementHistory(payment.id)
      .then(setData)
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load history.', variant: 'danger' }))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, payment])

  const handleExport = async () => {
    setExporting(true)
    try {
      const { blob, filename } = await ApiService.exportPaymentManagementHistory(payment.id, 'csv')
      downloadBlob(blob, filename)
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to export history.', variant: 'danger' })
    } finally {
      setExporting(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>History — {payment?.transaction_id}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading || !data ? <LoadingState message="Loading history..." /> : (
          <>
            {canExport && (
              <div className="text-end mb-2">
                <Button variant="outline-secondary" size="sm" disabled={exporting} onClick={handleExport}>
                  <Icon icon="download" className="me-1" /> {exporting ? 'Exporting...' : 'Export CSV'}
                </Button>
              </div>
            )}
            {data.timeline.length === 0 && <p className="text-muted">No history recorded yet.</p>}
            <ul className="list-unstyled mb-0">
              {data.timeline.map((event, index) => (
                <li key={index} className="border-start border-2 ps-3 pb-3 position-relative">
                  <span className="position-absolute rounded-circle bg-primary" style={{ width: 8, height: 8, left: -5, top: 4 }} />
                  <div className="fw-semibold">{event.event}</div>
                  <div className="small text-muted">{event.actor} • {event.date}</div>
                  {event.reason && <div className="small mt-1"><strong>Reason:</strong> {event.reason}</div>}
                  {event.old_values && <div className="small text-muted mt-1">Before: <ValueChips values={event.old_values} /></div>}
                  {event.new_values && <div className="small text-muted mt-1">After: <ValueChips values={event.new_values} /></div>}
                  <div className="small text-muted mt-1">{event.source_ip} — {event.user_agent}</div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Modal.Body>
    </Modal>
  )
}

export default PaymentHistoryModal
