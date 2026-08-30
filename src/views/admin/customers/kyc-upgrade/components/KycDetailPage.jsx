import { useEffect, useState } from 'react'
import { Badge, Button, Card, Col, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import ConfirmActionModal from '../../../merchants/components/ConfirmActionModal'
import RejectReasonModal from './RejectReasonModal'

const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(String(value).replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })
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

const KycDetailPage = ({ customerId, reasons, onBack }) => {
  const { showNotification } = useNotificationContext()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showApproveConfirm, setShowApproveConfirm] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)

  const load = () => {
    setLoading(true)
    ApiService.getKycUpgrade(customerId)
      .then(setDetail)
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load customer.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [customerId])

  const isPending = detail?.status === 'pending'
  const name = detail ? [detail.first_name, detail.middle_name, detail.last_name].filter(Boolean).join(' ') : ''

  if (loading) {
    return (
      <>
        <PageBreadcrumb title="KYC Upgrade" subtitle="Customers" />
        <LoadingState />
      </>
    )
  }

  return (
    <>
      <PageBreadcrumb title="KYC Upgrade" subtitle="Customers" />
      <Button variant="light" size="sm" className="mb-3" onClick={onBack}>
        <Icon icon="arrow-left" className="me-1" /> Back to list
      </Button>

      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
            <div className="d-flex align-items-center gap-3">
              {(detail?.selfie_url || detail?.profile_pic_url) ? (
                <a href={detail.selfie_url || detail.profile_pic_url} target="_blank" rel="noreferrer">
                  <img
                    src={detail.selfie_url || detail.profile_pic_url}
                    alt="Selfie"
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
                <span className="text-muted small d-block">Customer #{detail?.id}</span>
                <span className="text-muted small">Selfie</span>
              </div>
            </div>
            <div className="text-end">
              <Badge bg="primary-subtle" text="primary" className="mb-1 d-block">{detail?.kyc_tier}</Badge>
              <span className="text-muted small">Daily limit: {detail?.kyc_level || '—'}</span>
            </div>
          </div>

          {detail?.status === 'rejected' && detail?.reason_reject && (
            <div className="alert alert-danger py-2 small mb-3">
              <strong>Rejection reason:</strong> {detail.reason_reject}
            </div>
          )}

          <Row>
            <Col md={6}>
              <Field label="Mobile" value={detail?.mobile} />
              <Field label="Email" value={detail?.email} />
              <Field label="Gender" value={detail?.gender} />
              <Field label="Birthday" value={formatDate(detail?.birthday)} />
              <Field label="Address" value={[detail?.address1, detail?.address2].filter(Boolean).join(', ')} />
            </Col>
            <Col md={6}>
              <Field label="City" value={detail?.city} />
              <Field label="Island" value={detail?.island} />
              <Field label="Country" value={detail?.country} />
              <Field label="Occupation" value={detail?.occupation} />
              <Field label="Employment Position" value={detail?.employment_position_level} />
            </Col>
          </Row>

          <hr />
          <h6 className="mb-3">Primary Identification</h6>
          <Row>
            <Col md={6}>
              <Field label="ID Type" value={detail?.id_card_type_label} />
              <Field label="ID Number" value={detail?.id_card_num} />
              <Field label="Expiry" value={formatDate(detail?.id_card_expiry)} />
            </Col>
            <Col md={6}>
              <DocImage label="Scanned ID" src={detail?.scanned_id_url} />
            </Col>
          </Row>

          {detail?.has_secondary_id && detail?.secondary_id && (
            <>
              <hr />
              <h6 className="mb-3">Secondary Identification</h6>
              <Row>
                <Col md={6}>
                  <Field label="ID Type" value={detail.secondary_id.id_card_type_label} />
                  <Field label="ID Number" value={detail.secondary_id.id_card_num} />
                  <Field label="Expiry" value={formatDate(detail.secondary_id.id_card_expiry)} />
                </Col>
                <Col md={6}>
                  <DocImage label="Scanned Secondary ID" src={detail.secondary_id.scanned_id_url} />
                </Col>
              </Row>
            </>
          )}

          <hr />
          <Row>
            <Col md={6}>
              <DocImage label="Signature" src={detail?.signature_url} />
            </Col>
          </Row>

          <div className="d-flex gap-2 mt-3 flex-wrap">
            <Button variant="light" onClick={onBack}>Back</Button>
            {isPending && (
              <>
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
        title="Approve KYC upgrade"
        message={`Are you sure you want to approve "${name}"'s KYC upgrade? This will remove restrictions and raise their daily transaction limit to Tier 2.`}
        confirmLabel="Approve"
        confirmVariant="success"
        successMessage="Customer has been approved."
        onConfirm={() => ApiService.approveKycUpgrade(customerId)}
        onDone={onBack}
      />

      <RejectReasonModal
        show={showRejectModal}
        onHide={() => setShowRejectModal(false)}
        customer={{ id: customerId, name }}
        reasons={reasons}
        onDone={onBack}
      />
    </>
  )
}

export default KycDetailPage
