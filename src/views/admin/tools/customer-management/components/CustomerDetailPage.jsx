import { useEffect, useState } from 'react'
import { Button, Card, Col, Nav, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import { money } from '@/utils/reportHelpers'
import DetailsTab from './DetailsTab'
import NotesTab from './NotesTab'
import TransactionHistoryTab from './TransactionHistoryTab'
import PreferencesTab from './PreferencesTab'
import PushNotificationTab from './PushNotificationTab'
import ComplyTab from './ComplyTab'
import AuthenticateTab from './AuthenticateTab'

const STATUS_BADGE = {
  A: { label: 'Active', className: 'bg-success-subtle text-success' },
  L: { label: 'Locked', className: 'bg-danger-subtle text-danger' },
  R: { label: 'Restricted', className: 'bg-warning-subtle text-warning' },
  I: { label: 'Archived', className: 'bg-dark-subtle text-dark' },
}

const CustomerDetailPage = ({ customerId, initialTab, modulePermission, onBack }) => {
  const { showNotification } = useNotificationContext()
  const [activeTab, setActiveTab] = useState(initialTab || 'details')
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)

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
  const badge = STATUS_BADGE[detail?.status] || STATUS_BADGE.A

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
            <span className={`badge badge-label ${badge.className}`}>{badge.label}</span>
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
        </Card.Body>
      </Card>

      <Nav variant="tabs" activeKey={activeTab} onSelect={(key) => key && setActiveTab(key)} className="nav-bordered nav-bordered-primary mb-3">
        <Nav.Item><Nav.Link eventKey="details"><Icon icon="user" className="me-1" />View Details</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="notes"><Icon icon="notes" className="me-1" />Notes</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="transactions"><Icon icon="history" className="me-1" />Transaction History</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="preferences"><Icon icon="settings" className="me-1" />Preferences</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="push-notification"><Icon icon="bell" className="me-1" />Push Notification</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="comply"><Icon icon="shield-check" className="me-1" />View ComplianceAdvantage Profile</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="authenticate"><Icon icon="shield-lock" className="me-1" />Authenticate User</Nav.Link></Nav.Item>
      </Nav>

      {activeTab === 'details' && <DetailsTab customerId={customerId} detail={detail} canEdit={canEdit} canDelete={canDelete} onSaved={load} />}
      {activeTab === 'notes' && <NotesTab customerId={customerId} detail={detail} canEdit={canEdit} />}
      {activeTab === 'transactions' && <TransactionHistoryTab customerId={customerId} detail={detail} />}
      {activeTab === 'preferences' && <PreferencesTab customerId={customerId} detail={detail} canEdit={canEdit} onSaved={load} />}
      {activeTab === 'push-notification' && <PushNotificationTab customerId={customerId} canExecute={canExecute} />}
      {activeTab === 'comply' && <ComplyTab customerId={customerId} />}
      {activeTab === 'authenticate' && <AuthenticateTab customerId={customerId} canExecute={canExecute} mobile={detail?.mobile} email={detail?.email} />}
    </>
  )
}

export default CustomerDetailPage
