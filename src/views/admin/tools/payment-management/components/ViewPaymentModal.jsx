import { useEffect, useState } from 'react'
import { Col, Modal, Row } from 'react-bootstrap'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import StatusBadge from './StatusBadge'

const Field = ({ label, children }) => (
  <Col md={6} className="mb-3">
    <div className="text-uppercase text-muted small fw-semibold">{label}</div>
    <div>{children ?? <span className="text-muted">—</span>}</div>
  </Col>
)

const ViewPaymentModal = ({ show, payment, onHide }) => {
  const { showNotification } = useNotificationContext()
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    if (!show || !payment) return
    setLoading(true)
    ApiService.getPaymentManagementDetail(payment.id)
      .then(setDetail)
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load payment.', variant: 'danger' }))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, payment])

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Payment Details — {payment?.transaction_id}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading || !detail ? <LoadingState message="Loading payment..." /> : (
          <Row>
            <Field label="Status"><StatusBadge status={detail.status} /></Field>
            <Field label="Date/Time">{detail.transaction_date}</Field>
            <Field label="Payment Type">{detail.payment_type}</Field>
            <Field label="Payment Method">{detail.payment_method}</Field>
            <Field label="Company Name">{detail.company_name}</Field>
            <Field label="Amount">${detail.amount}</Field>
            <Field label="Settlement Period">{detail.settlement_period}</Field>
            <Field label="External Reference">{detail.external_reference}</Field>
            <Field label="Prepared By">{detail.prepared_by}</Field>
            <Field label="Supporting Document">
              {detail.supporting_doc_url
                ? <a href={detail.supporting_doc_url} target="_blank" rel="noreferrer">{detail.supporting_doc_name || 'View document'}</a>
                : null}
            </Field>
            <Col md={12} className="mb-3">
              <div className="text-uppercase text-muted small fw-semibold">Notes</div>
              <div>{detail.notes || <span className="text-muted">—</span>}</div>
            </Col>
          </Row>
        )}
      </Modal.Body>
    </Modal>
  )
}

export default ViewPaymentModal
