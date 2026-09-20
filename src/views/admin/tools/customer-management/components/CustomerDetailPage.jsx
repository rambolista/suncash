import { useEffect, useState } from 'react'
import { Button, Card, Col, Nav, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import { money } from '@/utils/reportHelpers'
import ConfirmActionModal from '../../../merchants/components/ConfirmActionModal'
import DetailsTab from './DetailsTab'
import ComplyTab from './ComplyTab'
import AuthenticateTab from './AuthenticateTab'

const CustomerDetailPage = ({ customerId, initialTab, modulePermission, onBack }) => {
  const { showNotification } = useNotificationContext()
  const [activeTab, setActiveTab] = useState(initialTab || 'details')
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)

  const canEdit = Boolean(modulePermission.can_edit)
  const canDelete = Boolean(modulePermission.can_delete)
  const canExecute = Boolean(modulePermission.can_execute)

  const load = () => {
    setLoading(true)
    ApiService.getCustomerManagementDetail(customerId)
      .then((data) => setDetail(data))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load customer.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [customerId])

  if (loading) {
    return (
      <>
        <PageBreadcrumb title="Customer Management" subtitle="Tools" />
        <LoadingState />
      </>
    )
  }

  const name = detail ? `${detail.first_name || ''} ${detail.last_name || ''}`.trim() : ''
  const isArchived = detail?.status === 'I'

  return (
    <>
      <PageBreadcrumb title="Customer Management" subtitle="Tools" />
      <Button variant="light" size="sm" className="mb-3" onClick={onBack}>
        <Icon icon="arrow-left" className="me-1" /> Back to search
      </Button>

      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">{name || `Customer #${customerId}`}</h5>
          <div className="d-flex align-items-center gap-2">
            {isArchived && <span className="badge bg-dark-subtle text-dark badge-label">Archived</span>}
            <span className="badge bg-info-subtle text-info badge-label">{detail?.kyc_status}</span>
          </div>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}><div className="text-muted small">Mobile Number</div><div className="fw-semibold">{detail?.mobile || '—'}</div></Col>
            <Col md={3}><div className="text-muted small">Card Number</div><div className="fw-semibold">{detail?.card_number || '—'}</div></Col>
            <Col md={3}><div className="text-muted small">Merchant</div><div className="fw-semibold">{detail?.merchant || '—'}</div></Col>
            <Col md={3}><div className="text-muted small">Account Balance</div><div className="fw-semibold">{money(detail?.card_balance)}</div></Col>
          </Row>
          {canDelete && (
            <div className="mt-3">
              <Button variant="danger" size="sm" disabled={isArchived} onClick={() => setShowArchiveConfirm(true)}>
                <Icon icon="archive" className="me-1" /> {isArchived ? 'Already Archived' : 'Archive'}
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      <Nav variant="tabs" activeKey={activeTab} onSelect={(key) => key && setActiveTab(key)} className="nav-bordered nav-bordered-primary mb-3">
        <Nav.Item><Nav.Link eventKey="details">View Details</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="comply">View ComplianceAdvantage Profile</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="authenticate">Authenticate User</Nav.Link></Nav.Item>
      </Nav>

      {activeTab === 'details' && <DetailsTab customerId={customerId} detail={detail} canEdit={canEdit} onSaved={load} />}
      {activeTab === 'comply' && <ComplyTab customerId={customerId} />}
      {activeTab === 'authenticate' && <AuthenticateTab customerId={customerId} canExecute={canExecute} mobile={detail?.mobile} email={detail?.email} />}

      <ConfirmActionModal
        show={showArchiveConfirm}
        onHide={() => setShowArchiveConfirm(false)}
        title="Archive customer"
        message={`Are you sure you want to archive ${name || 'this customer'}? This frees up their mobile number for reuse and deactivates their account.`}
        confirmLabel="Archive"
        confirmVariant="danger"
        successMessage="Customer status has been updated."
        onConfirm={() => ApiService.archiveCustomerManagement(customerId)}
        onDone={load}
      />
    </>
  )
}

export default CustomerDetailPage
