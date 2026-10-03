import { useEffect, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import { useNavigate } from 'react-router'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import ClientSummaryTable from './components/ClientSummaryTable'

const EMPTY = { client_id: '', status: '', start_date: '', end_date: '' }

const ClientSummaryPage = () => {
  const currentUser = useCurrentUser()
  const navigate = useNavigate()
  const { showNotification } = useNotificationContext()
  // The View action opens the merchant on Merchants > Registration, so it needs that page's access too.
  const canView = Boolean(getModulePermission(currentUser, '/merchants/registration').can_view)

  const [clients, setClients] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const load = (filters) => {
    setLoading(true)
    ApiService.getClientSummary(filters)
      .then((data) => setRows(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load clients.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    ApiService.getClientSummaryClients()
      .then((data) => setClients(Array.isArray(data?.data) ? data.data : []))
      .catch(() => setClients([]))
    load(EMPTY) // legacy opens on the full client list
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }))
  const reset = () => { setForm(EMPTY); load(EMPTY) }

  return (
    <>
      <PageBreadcrumb title="Client Summary" subtitle="Reports" />

      <Card className="mb-3">
        <CardBody>
          <Row className="g-2 align-items-end">
            <Col md={3}>
              <Form.Label className="small text-muted mb-1">Client ID</Form.Label>
              <Form.Select size="sm" value={form.client_id} onChange={(e) => setField('client_id', e.target.value)}>
                <option value="">All</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label className="small text-muted mb-1">Client Status</Form.Label>
              <Form.Select size="sm" value={form.status} onChange={(e) => setField('status', e.target.value)}>
                <option value="">All</option>
                <option value="0">Active</option>
                <option value="1">Inactive</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label className="small text-muted mb-1">Registration Start Date</Form.Label>
              <Form.Control size="sm" type="date" value={form.start_date} onChange={(e) => setField('start_date', e.target.value)} />
            </Col>
            <Col md={2}>
              <Form.Label className="small text-muted mb-1">Registration End Date</Form.Label>
              <Form.Control size="sm" type="date" value={form.end_date} onChange={(e) => setField('end_date', e.target.value)} />
            </Col>
            <Col md="auto" className="d-flex gap-2">
              <Button size="sm" variant="primary" onClick={() => load(form)}><Icon icon="search" className="me-1" /> Search</Button>
              <Button size="sm" variant="outline-secondary" onClick={reset}>Reset</Button>
            </Col>
          </Row>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          {loading ? (
            <LoadingState message="Loading clients..." />
          ) : (
            <ClientSummaryTable data={rows} canView={canView} onView={(row) => navigate(`/merchants/registration?view=${row.id}`)} />
          )}
        </CardBody>
      </Card>
    </>
  )
}

export default ClientSummaryPage
