import { useState } from 'react'
import { Button, Card, Col, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import CustomerLogsTable from './components/CustomerLogsTable'

const CustomerLogsPage = () => {
  const { showNotification } = useNotificationContext()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const load = (fromDate = from, toDate = to) => {
    if (!fromDate || !toDate) {
      showNotification({ title: 'Failed', message: 'Please select a start and end date.', variant: 'danger' })
      return
    }
    setLoading(true)
    setSearched(true)
    ApiService.getCustomerSuccessLogs(fromDate, toDate)
      .then((data) => setRows(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load customer logs.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  return (
    <>
      <PageBreadcrumb title="Customer Logs" subtitle="Customers" />
      <Card className="mb-3">
        <Card.Body>
          <Row className="g-2 align-items-end">
            <Col md={3}>
              <Form.Label className="small text-muted mb-1">Start Date</Form.Label>
              <Form.Control size="sm" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Col>
            <Col md={3}>
              <Form.Label className="small text-muted mb-1">End Date</Form.Label>
              <Form.Control size="sm" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </Col>
            <Col md={3}>
              <Button size="sm" variant="primary" onClick={() => load(from, to)}>
                <Icon icon="filter" className="me-1" /> Apply Filters
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <h5 className="mb-0">Customer Login Logs</h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <LoadingState />
          ) : searched ? (
            <CustomerLogsTable data={rows} />
          ) : (
            <div className="text-center text-muted py-4">Select a date range and click "Apply Filters" to load logs.</div>
          )}
        </Card.Body>
      </Card>
    </>
  )
}

export default CustomerLogsPage
