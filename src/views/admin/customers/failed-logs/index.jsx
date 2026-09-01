import { useEffect, useState } from 'react'
import { Button, Card, Col, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import CustomerFailedLogsTable from './components/CustomerFailedLogsTable'

const today = () => new Date().toISOString().slice(0, 10)

const CustomerFailedLogsPage = () => {
  const { showNotification } = useNotificationContext()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState(today())
  const [to, setTo] = useState(today())

  const load = (fromDate = from, toDate = to) => {
    setLoading(true)
    ApiService.getCustomerFailedLogs(fromDate, toDate)
      .then((data) => setRows(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load failed linking logs.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <>
      <PageBreadcrumb title="Customer Failed Linking Logs" subtitle="Customers" />
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
          <h5 className="mb-0">Failed Logs</h5>
        </Card.Header>
        <Card.Body>
          {loading ? <LoadingState /> : <CustomerFailedLogsTable data={rows} />}
        </Card.Body>
      </Card>
    </>
  )
}

export default CustomerFailedLogsPage
