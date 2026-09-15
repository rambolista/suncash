import { useEffect, useState } from 'react'
import { Button, Modal } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import LoadingState from '@/components/LoadingState'

const ViewDetailsModal = ({ show, onHide, depositId }) => {
  const { showNotification } = useNotificationContext()
  const [loading, setLoading] = useState(true)
  const [details, setDetails] = useState(null)

  useEffect(() => {
    if (!show || !depositId) return
    setLoading(true)
    ApiService.getKioskCashManagementDetails(depositId)
      .then((data) => setDetails(data?.data || null))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load deposit details.', variant: 'danger' }))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, depositId])

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Deposit Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? <LoadingState message="Loading details..." /> : details ? (
          <div className="d-flex flex-column gap-2">
            <div><strong>Reference ID:</strong> {details.transaction_id}</div>
            <div><strong>Location:</strong> {details.location || '—'}</div>
            {details.store_name && <div><strong>Store:</strong> {details.store_name}</div>}
            {details.bank_name && (
              <>
                <div><strong>Bank:</strong> {details.bank_name}</div>
                <div><strong>Branch:</strong> {details.bank_branch}</div>
                <div><strong>Account Name:</strong> {details.account_name}</div>
                <div><strong>Account No:</strong> {details.account_no_masked}</div>
              </>
            )}
            <div><strong>Note:</strong> {details.deposit_note || '—'}</div>
            {details.receipt_url && (
              <img src={details.receipt_url} alt="Receipt" className="img-fluid rounded border mt-2" />
            )}
          </div>
        ) : (
          <p className="text-muted mb-0">No details found.</p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ViewDetailsModal
