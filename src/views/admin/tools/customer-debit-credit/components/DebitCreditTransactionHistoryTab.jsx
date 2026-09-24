import { useEffect, useState } from 'react'
import { Button, Card, Col, Form, Row } from 'react-bootstrap'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import ArchiveTransactionsTable from '../../../customers/archive/components/ArchiveTransactionsTable'

const today = () => new Date().toISOString().slice(0, 10)
const oneMonthAgo = () => {
  const date = new Date()
  date.setMonth(date.getMonth() - 1)
  return date.toISOString().slice(0, 10)
}

const DebitCreditTransactionHistoryTab = ({ customerId, detail }) => {
  const { showNotification } = useNotificationContext()

  const [transactions, setTransactions] = useState([])
  const [from, setFrom] = useState(oneMonthAgo())
  const [to, setTo] = useState(today())
  const [filtering, setFiltering] = useState(false)
  const [exporting, setExporting] = useState('')

  useEffect(() => {
    setTransactions(Array.isArray(detail?.transactions) ? detail.transactions : [])
  }, [detail])

  const applyFilter = () => {
    if (!from || !to) {
      showNotification({ title: 'Failed', message: 'Please fill in both dates.', variant: 'danger' })
      return
    }
    setFiltering(true)
    ApiService.getCustomerDebitCreditTransactions(customerId, from, to)
      .then((data) => setTransactions(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to filter transactions.', variant: 'danger' }))
      .finally(() => setFiltering(false))
  }

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const { blob, filename } = await ApiService.exportCustomerDebitCreditTransactions(customerId, format, from || undefined, to || undefined)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || `Failed to export ${format.toUpperCase()}.`, variant: 'danger' })
    } finally {
      setExporting('')
    }
  }

  return (
    <Card>
      <Card.Header><h5 className="mb-0">Transaction History</h5></Card.Header>
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
  )
}

export default DebitCreditTransactionHistoryTab
