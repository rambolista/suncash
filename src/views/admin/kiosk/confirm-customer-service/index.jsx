import { useEffect, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import ConfirmCustomerServiceTable from './components/ConfirmCustomerServiceTable'
import SessionLogsModal from './components/SessionLogsModal'

const today = () => new Date().toISOString().slice(0, 10)

const KioskConfirmCustomerServicePage = () => {
  const { showNotification } = useNotificationContext()
  const [filters, setFilters] = useState({ date_from: today(), date_to: today(), terminal_id: '', limit: 10 })
  const [rows, setRows] = useState([])
  const [terminals, setTerminals] = useState([])
  const [loading, setLoading] = useState(true)
  const [sessionId, setSessionId] = useState(null)

  const load = () => {
    setLoading(true)
    ApiService.getKioskConfirmCustomerService(filters)
      .then((data) => {
        setRows(Array.isArray(data?.rows) ? data.rows : [])
        setTerminals(Array.isArray(data?.terminals) ? data.terminals : [])
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load meter events.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }))

  return (
    <>
      <PageBreadcrumb title="Confirm Customer Service" subtitle="Kiosk" />

      <Card className="mb-3">
        <CardBody>
          <Row className="g-3 align-items-end">
            <Col md={2}>
              <Form.Label>From</Form.Label>
              <Form.Control type="date" value={filters.date_from} onChange={(e) => updateFilter('date_from', e.target.value)} />
            </Col>
            <Col md={2}>
              <Form.Label>To</Form.Label>
              <Form.Control type="date" value={filters.date_to} onChange={(e) => updateFilter('date_to', e.target.value)} />
            </Col>
            <Col md={4}>
              <Form.Label>Kiosk Terminal</Form.Label>
              <Form.Select value={filters.terminal_id} onChange={(e) => updateFilter('terminal_id', e.target.value)}>
                <option value="">ALL</option>
                {terminals.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}{t.location ? ` - ${t.location}` : ''}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label>Limit</Form.Label>
              <Form.Select value={filters.limit} onChange={(e) => updateFilter('limit', e.target.value)}>
                {[10, 20, 50, 100, 200].map((n) => <option key={n} value={n}>{n}</option>)}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button variant="success" className="w-100" onClick={load} disabled={loading}>Apply Filters</Button>
            </Col>
          </Row>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <p className="text-muted small mb-3">
            Lists customer cash deposit/withdrawal meter events. Use <strong>Check Transaction</strong> to confirm
            what the kiosk actually logged for that session.
          </p>
          {loading ? <LoadingState message="Loading meter events..." /> : (
            <ConfirmCustomerServiceTable data={rows} onCheckTransaction={(item) => setSessionId(item.session_id)} />
          )}
        </CardBody>
      </Card>

      <SessionLogsModal show={Boolean(sessionId)} onHide={() => setSessionId(null)} sessionId={sessionId} />
    </>
  )
}

export default KioskConfirmCustomerServicePage
