import { useEffect, useState } from 'react'
import { Button, Card, Col, Nav, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import AdjustBalanceTab from './AdjustBalanceTab'
import DebitCreditTransactionHistoryTab from './DebitCreditTransactionHistoryTab'

const money = (value) => `BSD ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const CustomerDebitCreditDetailPage = ({ customerId, modulePermission, onBack }) => {
  const { showNotification } = useNotificationContext()
  const [activeTab, setActiveTab] = useState('balance')
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)

  const canExecute = Boolean(modulePermission.can_execute)

  const load = () => {
    setLoading(true)
    ApiService.getCustomerDebitCreditDetail(customerId)
      .then((data) => setDetail(data))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load customer.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [customerId])

  if (loading) {
    return (
      <>
        <PageBreadcrumb title="Customer Debit/Credit" subtitle="Tools" />
        <LoadingState />
      </>
    )
  }

  const name = detail ? `${detail.first_name || ''} ${detail.last_name || ''}`.trim() : ''

  return (
    <>
      <PageBreadcrumb title="Customer Debit/Credit" subtitle="Tools" />
      <Button variant="light" size="sm" className="mb-3" onClick={onBack}>
        <Icon icon="arrow-left" className="me-1" /> Back to search
      </Button>

      <Card className="mb-3">
        <Card.Header>
          <h5 className="mb-0">{name || `Customer #${customerId}`}</h5>
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
        <Nav.Item><Nav.Link eventKey="balance"><Icon icon="cash" className="me-1" />Adjust Customer Balance</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="transactions"><Icon icon="history" className="me-1" />Transaction History</Nav.Link></Nav.Item>
      </Nav>

      {activeTab === 'balance' && <AdjustBalanceTab customerId={customerId} detail={detail} canExecute={canExecute} onProcessed={load} />}
      {activeTab === 'transactions' && <DebitCreditTransactionHistoryTab customerId={customerId} detail={detail} />}
    </>
  )
}

export default CustomerDebitCreditDetailPage
