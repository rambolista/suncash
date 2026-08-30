import { useEffect, useState } from 'react'
import { Button, Card, Col, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(String(value).replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const DocImage = ({ label, src }) => (
  <Col md={4} className="mb-3">
    <div className="text-muted small mb-1">{label}</div>
    {src ? (
      <a href={src} target="_blank" rel="noreferrer">
        <img src={src} alt={label} className="border rounded w-100" style={{ height: 140, objectFit: 'contain', background: 'rgba(0,0,0,0.03)' }} />
      </a>
    ) : (
      <div className="border rounded d-flex align-items-center justify-content-center text-muted" style={{ height: 140 }}>
        <Icon icon="file-off" className="me-1" /> Not submitted
      </div>
    )}
  </Col>
)

const DocumentDetailPage = ({ requestId, onBack }) => {
  const { showNotification } = useNotificationContext()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    ApiService.getCustomerDocument(requestId)
      .then(setDetail)
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load document submission.', variant: 'danger' }))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId])

  if (loading) {
    return (
      <>
        <PageBreadcrumb title="Documents" subtitle="Customers" />
        <LoadingState />
      </>
    )
  }

  return (
    <>
      <PageBreadcrumb title="Documents" subtitle="Customers" />
      <Button variant="light" size="sm" className="mb-3" onClick={onBack}>
        <Icon icon="arrow-left" className="me-1" /> Back to list
      </Button>

      <Card>
        <Card.Body>
          <div className="d-flex align-items-center gap-3 mb-3">
            {detail?.profile_pic_url ? (
              <img src={detail.profile_pic_url} alt="Profile" className="rounded-circle border" style={{ width: 64, height: 64, objectFit: 'cover' }} />
            ) : (
              <div className="rounded-circle border bg-light-subtle d-flex align-items-center justify-content-center text-muted" style={{ width: 64, height: 64 }}>
                <Icon icon="user" style={{ fontSize: '1.5rem' }} />
              </div>
            )}
            <div>
              <h5 className="mb-0">{detail?.name || '—'}</h5>
              <span className="text-muted small">Customer #{detail?.customer_id}</span>
            </div>
          </div>

          <Row className="mb-3">
            <Col md={4}>
              <div className="text-muted small">Mobile</div>
              <div className="fw-medium">{detail?.mobile || '—'}</div>
            </Col>
            <Col md={4}>
              <div className="text-muted small">Email</div>
              <div className="fw-medium">{detail?.email || '—'}</div>
            </Col>
            <Col md={4}>
              <div className="text-muted small">WU Transaction ID</div>
              <div className="fw-medium">{detail?.transaction_id || '—'}</div>
            </Col>
          </Row>
          <div className="text-muted small mb-3">Submitted {formatDateTime(detail?.created_at)}</div>

          <hr />
          <h6 className="mb-3">Uploaded Documents</h6>
          <Row>
            {detail?.documents?.map((doc) => (
              <DocImage key={doc.key} label={doc.label} src={doc.url} />
            ))}
          </Row>

          <div className="d-flex gap-2 mt-3">
            <Button variant="light" onClick={onBack}>Back</Button>
          </div>
        </Card.Body>
      </Card>
    </>
  )
}

export default DocumentDetailPage
