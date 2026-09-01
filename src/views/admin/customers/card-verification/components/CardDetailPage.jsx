import { useEffect, useState } from 'react'
import { Badge, Button, Card, Col, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import ConfirmActionModal from '../../../merchants/components/ConfirmActionModal'
import CardRejectReasonModal from './CardRejectReasonModal'
import CardBlacklistReasonModal from './CardBlacklistReasonModal'

const statusVariant = { pending: 'warning', approved: 'success', rejected: 'danger', blacklisted: 'dark' }

const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(String(value).replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const Field = ({ label, value }) => (
  <div className="mb-2">
    <div className="text-muted small">{label}</div>
    <div className="fw-medium">{value || '—'}</div>
  </div>
)

const DocImage = ({ label, src }) => {
  if (!src) return null
  return (
    <div className="mb-3">
      <div className="text-muted small mb-1">{label}</div>
      <a href={src} target="_blank" rel="noreferrer">
        <img src={src} alt={label} className="border rounded" style={{ maxWidth: '100%', maxHeight: 220, objectFit: 'contain' }} />
      </a>
    </div>
  )
}

const CardDetailPage = ({ cardId, reasons, blacklistReasons, onBack }) => {
  const { showNotification } = useNotificationContext()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showApproveConfirm, setShowApproveConfirm] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showBlacklistModal, setShowBlacklistModal] = useState(false)

  const load = () => {
    setLoading(true)
    ApiService.getCardVerification(cardId)
      .then(setDetail)
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load card.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [cardId])

  const isPending = detail?.status === 'pending'
  const name = detail ? [detail.first_name, detail.last_name].filter(Boolean).join(' ') : ''

  if (loading) {
    return (
      <>
        <PageBreadcrumb title="Card Verification" subtitle="Customers" />
        <LoadingState />
      </>
    )
  }

  return (
    <>
      <PageBreadcrumb title="Card Verification" subtitle="Customers" />
      <Button variant="light" size="sm" className="mb-3" onClick={onBack}>
        <Icon icon="arrow-left" className="me-1" /> Back to list
      </Button>

      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
            <div className="d-flex align-items-center gap-3">
              {detail?.profile_pic_url ? (
                <a href={detail.profile_pic_url} target="_blank" rel="noreferrer">
                  <img
                    src={detail.profile_pic_url}
                    alt="Profile"
                    className="rounded border"
                    style={{ width: 110, height: 110, objectFit: 'cover' }}
                  />
                </a>
              ) : (
                <div className="rounded border bg-light-subtle d-flex align-items-center justify-content-center text-muted" style={{ width: 110, height: 110 }}>
                  <Icon icon="user" style={{ fontSize: '2rem' }} />
                </div>
              )}
              <div>
                <h5 className="mb-0">{name}</h5>
                <span className="text-muted small d-block">Customer #{detail?.customer_id}</span>
                <Badge bg={statusVariant[detail?.status] || 'secondary'} className="mt-1 text-capitalize">{detail?.status}</Badge>
              </div>
            </div>
            <div className="text-end">
              <div className="text-muted small">Linked cards</div>
              <div className="fw-semibold">{detail?.linked_card_count ?? 0} total · {detail?.linked_card_count_last_month ?? 0} this month</div>
            </div>
          </div>

          {(detail?.status === 'rejected' || detail?.status === 'blacklisted') && detail?.rejected_reason && (
            <div className={`alert ${detail.status === 'blacklisted' ? 'alert-dark' : 'alert-danger'} py-2 small mb-3`}>
              <strong>Reason:</strong> {detail.rejected_reason}
            </div>
          )}

          <h6 className="mb-3">Card Details</h6>
          <Row>
            <Col md={6}>
              <Field label="Card Name" value={detail?.card?.cardholder_name} />
              <Field label="Card Type" value={detail?.card?.card_type} />
            </Col>
            <Col md={6}>
              <Field label="Last 4 Digits" value={detail?.card?.card_last_four_digits} />
              <Field label="Submitted" value={formatDateTime(detail?.card?.created_at)} />
            </Col>
          </Row>

          <hr />
          <h6 className="mb-3">Customer Details</h6>
          <Row>
            <Col md={6}>
              <Field label="Mobile" value={detail?.mobile} />
              <Field label="Email" value={detail?.email} />
              <Field label="Gender" value={detail?.gender} />
              <Field label="Birthday" value={detail?.birthday} />
            </Col>
            <Col md={6}>
              <Field label="Address" value={[detail?.address1, detail?.address2].filter(Boolean).join(', ')} />
              <Field label="City" value={detail?.city} />
              <Field label="Island" value={detail?.island} />
              <Field label="Country" value={detail?.country} />
            </Col>
          </Row>

          <hr />
          <Row>
            <Col md={6}>
              <DocImage label="Primary Scanned ID" src={detail?.scanned_id_url} />
            </Col>
            {detail?.secondary_id && (
              <Col md={6}>
                <DocImage label={`Secondary ID${detail.secondary_id.id_card_type ? ` (${detail.secondary_id.id_card_type})` : ''}`} src={detail.secondary_id.scanned_id_url} />
              </Col>
            )}
          </Row>

          {detail?.other_files?.length > 0 && (
            <>
              <hr />
              <h6 className="mb-3">Card Verification Photos</h6>
              <Row>
                {detail.other_files.map((file) => (
                  <Col md={4} key={file.id}>
                    <DocImage label={file.label || 'Photo'} src={file.file_url} />
                  </Col>
                ))}
              </Row>
            </>
          )}

          <div className="d-flex gap-2 mt-3 flex-wrap">
            <Button variant="light" onClick={onBack}>Back</Button>
            {isPending && (
              <>
                <Button variant="dark" onClick={() => setShowBlacklistModal(true)}>
                  <Icon icon="ban" className="me-1" /> Blacklist
                </Button>
                <Button variant="danger" onClick={() => setShowRejectModal(true)}>
                  <Icon icon="x" className="me-1" /> Reject
                </Button>
                <Button variant="success" onClick={() => setShowApproveConfirm(true)}>
                  <Icon icon="check" className="me-1" /> Approve
                </Button>
              </>
            )}
          </div>
        </Card.Body>
      </Card>

      <ConfirmActionModal
        show={showApproveConfirm}
        onHide={() => setShowApproveConfirm(false)}
        title="Approve card verification"
        message={`Are you sure you want to approve "${name}"'s card ending in ${detail?.card?.card_last_four_digits || '—'}?`}
        confirmLabel="Approve"
        confirmVariant="success"
        successMessage="Card has been approved."
        onConfirm={() => ApiService.approveCardVerification(cardId)}
        onDone={onBack}
      />

      <CardRejectReasonModal
        show={showRejectModal}
        onHide={() => setShowRejectModal(false)}
        card={{ id: cardId, cardholder_name: name }}
        reasons={reasons}
        onDone={onBack}
      />

      <CardBlacklistReasonModal
        show={showBlacklistModal}
        onHide={() => setShowBlacklistModal(false)}
        card={{ id: cardId, cardholder_name: name }}
        reasons={blacklistReasons}
        onDone={onBack}
      />
    </>
  )
}

export default CardDetailPage
