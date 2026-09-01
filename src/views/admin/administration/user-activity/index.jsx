import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Col, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import ActivityTable from './components/ActivityTable'
import ActivityChangesModal from './components/ActivityChangesModal'

const emptyFilters = { user_id: '', action: '', module: '', date_from: '', date_to: '', search: '' }

const UserActivityPage = () => {
  const { showNotification } = useNotificationContext()
  const [rows, setRows] = useState([])
  const [modules, setModules] = useState([])
  const [actions, setActions] = useState({})
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(emptyFilters)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    ApiService.getUsers().then((data) => setUsers(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  const load = (activeFilters = filters) => {
    setLoading(true)
    ApiService.getUserActivity(activeFilters)
      .then((data) => {
        setRows(Array.isArray(data?.data) ? data.data : [])
        setModules(Array.isArray(data?.modules) ? data.modules : [])
        setActions(data?.actions || {})
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load activity log.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(emptyFilters) }, [])

  const handleFilterChange = (field, value) => setFilters((prev) => ({ ...prev, [field]: value }))
  const applyFilters = () => load(filters)
  const clearFilters = () => { setFilters(emptyFilters); load(emptyFilters) }

  const actionOptions = useMemo(() => Object.entries(actions), [actions])

  return (
    <>
      <PageBreadcrumb title="User Activity" subtitle="Administration" />
      <Card className="mb-3">
        <Card.Body>
          <Row className="g-2 align-items-end">
            <Col md={2}>
              <Form.Label className="small text-muted mb-1">User</Form.Label>
              <Form.Select size="sm" value={filters.user_id} onChange={(e) => handleFilterChange('user_id', e.target.value)}>
                <option value="">All Users</option>
                {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label className="small text-muted mb-1">Action</Form.Label>
              <Form.Select size="sm" value={filters.action} onChange={(e) => handleFilterChange('action', e.target.value)}>
                <option value="">All Actions</option>
                {actionOptions.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label className="small text-muted mb-1">Module</Form.Label>
              <Form.Select size="sm" value={filters.module} onChange={(e) => handleFilterChange('module', e.target.value)}>
                <option value="">All Modules</option>
                {modules.map((module) => <option key={module} value={module}>{module}</option>)}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label className="small text-muted mb-1">Date From</Form.Label>
              <Form.Control size="sm" type="date" value={filters.date_from} onChange={(e) => handleFilterChange('date_from', e.target.value)} />
            </Col>
            <Col md={2}>
              <Form.Label className="small text-muted mb-1">Date To</Form.Label>
              <Form.Control size="sm" type="date" value={filters.date_to} onChange={(e) => handleFilterChange('date_to', e.target.value)} />
            </Col>
            <Col md={2}>
              <Form.Label className="small text-muted mb-1">Search</Form.Label>
              <Form.Control size="sm" type="text" placeholder="User, description..." value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} />
            </Col>
          </Row>
          <div className="d-flex gap-2 mt-3">
            <Button size="sm" variant="primary" onClick={applyFilters}><Icon icon="filter" className="me-1" /> Apply Filters</Button>
            <Button size="sm" variant="light" onClick={clearFilters}>Clear</Button>
            <Button size="sm" variant="outline-secondary" className="ms-auto" onClick={() => load(filters)}>
              <Icon icon="refresh" className="me-1" /> Refresh
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          {loading ? (
            <LoadingState />
          ) : (
            <ActivityTable data={rows} onView={setSelected} />
          )}
        </Card.Body>
      </Card>

      <ActivityChangesModal show={!!selected} onHide={() => setSelected(null)} entry={selected} />
    </>
  )
}

export default UserActivityPage
