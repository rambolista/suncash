import { useEffect, useState } from 'react'
import { Button, Card, Col, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import ConfirmActionModal from '../../../merchants/components/ConfirmActionModal'
import ArchiveTransactionsTable from './ArchiveTransactionsTable'

const money = (value) => `BSD ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const today = () => new Date().toISOString().slice(0, 10)

const triggerDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

const ReadOnlyField = ({ label, value }) => (
  <Form.Group as={Row} className="mb-2">
    <Form.Label column sm={5} className="text-muted small">{label}</Form.Label>
    <Col sm={7}>
      <Form.Control size="sm" value={value ?? '—'} disabled readOnly />
    </Col>
  </Form.Group>
)

const ArchiveDetailPage = ({ customerId, canArchive, onBack }) => {
  const { showNotification } = useNotificationContext()
  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState(today())
  const [filtering, setFiltering] = useState(false)
  const [exporting, setExporting] = useState('')
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)

  const load = () => {
    setLoading(true)
    ApiService.getCustomerArchive(customerId)
      .then((detail) => {
        setCustomer(detail)
        setTransactions(Array.isArray(detail?.transactions) ? detail.transactions : [])
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load customer.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [customerId])

  const applyFilter = () => {
    if (!from || !to) {
      showNotification({ title: 'Failed', message: 'Please fill in both dates.', variant: 'danger' })
      return
    }
    setFiltering(true)
    ApiService.getCustomerArchiveTransactions(customerId, from, to)
      .then((data) => setTransactions(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to filter transactions.', variant: 'danger' }))
      .finally(() => setFiltering(false))
  }

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const { blob, filename } = await ApiService.exportCustomerArchiveTransactions(customerId, format, from || undefined, to || undefined)
      triggerDownload(blob, filename)
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || `Failed to export ${format.toUpperCase()}.`, variant: 'danger' })
    } finally {
      setExporting('')
    }
  }

  if (loading) {
    return (
      <>
        <PageBreadcrumb title="Archive Customer" subtitle="Customers" />
        <LoadingState />
      </>
    )
  }

  const name = customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : ''

  return (
    <>
      <PageBreadcrumb title="Archive Customer" subtitle="Customers" />
      <Button variant="light" size="sm" className="mb-3" onClick={onBack}>
        <Icon icon="arrow-left" className="me-1" /> Back to search
      </Button>

      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Cardholder Profile</h5>
          {customer?.is_archived && <span className="badge bg-dark-subtle text-dark badge-label">Archived</span>}
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <ReadOnlyField label="Name" value={name} />
              <ReadOnlyField label="Mobile Number" value={customer?.mobile} />
              <ReadOnlyField label="Email" value={customer?.email} />
              <ReadOnlyField label="Status" value={customer?.status} />
            </Col>
            <Col md={6}>
              <ReadOnlyField label="Card Number" value={customer?.card_number} />
              <ReadOnlyField label="Account Balance" value={money(customer?.card_balance)} />
              <ReadOnlyField label="Merchant" value={customer?.merchant} />
              <ReadOnlyField label="Risk Rating" value={customer?.risk_rating} />
            </Col>
          </Row>
          <div className="d-flex gap-2 mt-2">
            <Button
              variant="danger"
              disabled={!canArchive || customer?.is_archived}
              onClick={() => setShowArchiveConfirm(true)}
            >
              <Icon icon="archive" className="me-1" /> {customer?.is_archived ? 'Already Archived' : 'Archive'}
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <h5 className="mb-0">Transaction History</h5>
        </Card.Header>
        <Card.Body>
          <Row className="g-2 align-items-end mb-3">
            <Col md={3}>
              <Form.Label className="small text-muted mb-1">Start Date</Form.Label>
              <Form.Control size="sm" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Col>
            <Col md={3}>
              <Form.Label className="small text-muted mb-1">End Date</Form.Label>
              <Form.Control size="sm" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </Col>
            <Col md="auto">
              <Button size="sm" variant="primary" disabled={filtering} onClick={applyFilter}>
                <Icon icon="filter" className="me-1" /> {filtering ? 'Filtering...' : 'Apply Filters'}
              </Button>
            </Col>
            <Col md="auto" className="ms-auto d-flex gap-2">
              <Button size="sm" variant="outline-secondary" disabled={exporting !== ''} onClick={() => handleExport('pdf')}>
                <Icon icon="file-type-pdf" className="me-1" /> {exporting === 'pdf' ? 'Exporting...' : 'Export to PDF'}
              </Button>
              <Button size="sm" variant="outline-success" disabled={exporting !== ''} onClick={() => handleExport('csv')}>
                <Icon icon="file-type-xls" className="me-1" /> {exporting === 'csv' ? 'Exporting...' : 'Export to Excel'}
              </Button>
            </Col>
          </Row>
          <ArchiveTransactionsTable data={transactions} />
        </Card.Body>
      </Card>

      <ConfirmActionModal
        show={showArchiveConfirm}
        onHide={() => setShowArchiveConfirm(false)}
        title="Archive customer"
        message={`Are you sure you want to archive ${name || 'this customer'}? This frees up their mobile number for reuse and deactivates their account.`}
        confirmLabel="Archive"
        confirmVariant="danger"
        successMessage="Customer status has been updated."
        onConfirm={() => ApiService.archiveCustomer(customerId)}
        onDone={load}
      />
    </>
  )
}

export default ArchiveDetailPage
