import { useEffect, useMemo, useRef, useState } from 'react'
import { Badge, Button, Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import ConfirmActionModal from '@/views/admin/merchants/components/ConfirmActionModal'
import MonitoringTable from './components/MonitoringTable'

const POLL_INTERVAL_MS = 15000

const StatTile = ({ label, value, variant, active, onClick }) => (
  <Card
    role="button"
    onClick={onClick}
    className={`border-0 shadow-sm h-100 cursor-pointer ${variant ? `border-start border-4 border-${variant}` : ''} ${active ? 'bg-body-secondary' : ''}`}
  >
    <CardBody className="py-2 px-3 d-flex align-items-center justify-content-between">
      <div>
        <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.68rem', letterSpacing: '.04em' }}>{label}</div>
        <div className="h4 mb-0">{value}</div>
      </div>
      {active && <Icon icon="filter" className="text-muted" />}
    </CardBody>
  </Card>
)

const MonitoringDashboardPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = useMemo(() => getModulePermission(currentUser, '/kiosk/monitoring-dashboard'), [currentUser])
  const canExecute = Boolean(modulePermission.can_execute)

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [branchFilter, setBranchFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [islandFilter, setIslandFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [updatedByFilter, setUpdatedByFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [clearTarget, setClearTarget] = useState(null)
  const isFirstLoad = useRef(true)

  const load = () => {
    if (isFirstLoad.current) setLoading(true)
    ApiService.getKioskMonitoring()
      .then((data) => {
        setRows(Array.isArray(data?.data) ? data.data : [])
        setLastUpdated(new Date())
      })
      .catch((err) => {
        if (isFirstLoad.current) showNotification({ title: 'Failed', message: err?.message || 'Failed to load kiosk statuses.', variant: 'danger' })
      })
      .finally(() => {
        setLoading(false)
        isFirstLoad.current = false
      })
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const branches = useMemo(() => [...new Set(rows.map((r) => r.branch_name).filter(Boolean))].sort(), [rows])
  const types = useMemo(() => [...new Set(rows.map((r) => r.terminal_type).filter(Boolean))].sort(), [rows])
  const islands = useMemo(() => [...new Set(rows.map((r) => r.island_name).filter(Boolean))].sort(), [rows])
  const locations = useMemo(() => [...new Set(rows.map((r) => r.location).filter(Boolean))].sort(), [rows])
  const updatedByOptions = useMemo(() => [...new Set(rows.map((r) => r.updated_by).filter(Boolean))].sort(), [rows])

  const filteredRows = useMemo(() => rows.filter((r) => {
    if (branchFilter && r.branch_name !== branchFilter) return false
    if (typeFilter && r.terminal_type !== typeFilter) return false
    if (islandFilter && r.island_name !== islandFilter) return false
    if (locationFilter && r.location !== locationFilter) return false
    if (updatedByFilter && r.updated_by !== updatedByFilter) return false
    if (statusFilter && r.status !== statusFilter) return false
    return true
  }), [rows, branchFilter, typeFilter, islandFilter, locationFilter, updatedByFilter, statusFilter])

  const onlineCount = useMemo(() => rows.filter((r) => r.status === 'online').length, [rows])
  const offlineCount = rows.length - onlineCount

  const toggleStatusFilter = (value) => setStatusFilter((current) => (current === value ? '' : value))

  const acknowledge = (row) => {
    ApiService.acknowledgeKioskMachine(row.id)
      .then((result) => {
        showNotification({ title: 'Success', message: result?.message || 'Machine status has been updated.', variant: 'success' })
        load()
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to acknowledge.', variant: 'danger' }))
  }

  return (
    <>
      <PageBreadcrumb title="Monitoring Dashboard" subtitle="Kiosk" />

      <Row className="g-3 mb-3">
        <Col md={3} sm={6}>
          <StatTile label="Total Kiosks" value={rows.length} active={!statusFilter} onClick={() => setStatusFilter('')} />
        </Col>
        <Col md={3} sm={6}>
          <StatTile label="Online" value={onlineCount} variant="success" active={statusFilter === 'online'} onClick={() => toggleStatusFilter('online')} />
        </Col>
        <Col md={3} sm={6}>
          <StatTile label="Offline" value={offlineCount} variant="danger" active={statusFilter === 'offline'} onClick={() => toggleStatusFilter('offline')} />
        </Col>
        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm h-100">
            <CardBody className="py-2 px-3 d-flex flex-column justify-content-center">
              <div className="text-muted small">
                Auto-refreshing every {POLL_INTERVAL_MS / 1000}s
              </div>
              <div className="small fw-semibold">
                {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : '—'}
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Card>
        <CardBody>
          <Row className="g-3 align-items-end mb-2">
            <Col lg={2} md={4} sm={6}>
              <Form.Label>Branch</Form.Label>
              <Form.Select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
                <option value="">All Branches</option>
                {branches.map((b) => <option key={b} value={b}>{b}</option>)}
              </Form.Select>
            </Col>
            <Col lg={2} md={4} sm={6}>
              <Form.Label>Type</Form.Label>
              <Form.Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="">All Types</option>
                {types.map((t) => <option key={t} value={t}>{t}</option>)}
              </Form.Select>
            </Col>
            <Col lg={2} md={4} sm={6}>
              <Form.Label>Island</Form.Label>
              <Form.Select value={islandFilter} onChange={(e) => setIslandFilter(e.target.value)}>
                <option value="">All Islands</option>
                {islands.map((i) => <option key={i} value={i}>{i}</option>)}
              </Form.Select>
            </Col>
            <Col lg={2} md={4} sm={6}>
              <Form.Label>Location</Form.Label>
              <Form.Select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
                <option value="">All Locations</option>
                {locations.map((l) => <option key={l} value={l}>{l}</option>)}
              </Form.Select>
            </Col>
            <Col lg={2} md={4} sm={6}>
              <Form.Label>Updated By</Form.Label>
              <Form.Select value={updatedByFilter} onChange={(e) => setUpdatedByFilter(e.target.value)}>
                <option value="">All Users</option>
                {updatedByOptions.map((u) => <option key={u} value={u}>{u}</option>)}
              </Form.Select>
            </Col>
            <Col lg={2} md={4} sm={6} className="text-lg-end">
              <Button variant="outline-secondary" className="w-100" onClick={load}>
                <Icon icon="refresh" className="me-1" /> Refresh
              </Button>
            </Col>
          </Row>

          {statusFilter && (
            <div className="d-flex align-items-center gap-2 mb-3">
              <span className="text-muted small">Filtered by status:</span>
              <Badge bg={statusFilter === 'online' ? 'success' : 'danger'} className="text-capitalize">{statusFilter}</Badge>
              <Button variant="link" size="sm" className="p-0" onClick={() => setStatusFilter('')}>Clear</Button>
            </div>
          )}

          {loading ? <LoadingState message="Loading kiosk statuses..." /> : (
            <MonitoringTable
              key={`${branchFilter}|${typeFilter}|${islandFilter}|${locationFilter}|${updatedByFilter}|${statusFilter}`}
              data={filteredRows}
              canExecute={canExecute}
              onClear={(row) => setClearTarget(row)}
              onAcknowledge={acknowledge}
            />
          )}
        </CardBody>
      </Card>

      <ConfirmActionModal
        show={Boolean(clearTarget)}
        onHide={() => setClearTarget(null)}
        title="Clear Kiosk Status"
        message={clearTarget ? `Mark ${clearTarget.machine_name} (${clearTarget.terminal_code}) as OK? This clears its status, paper, acceptor, and dispenser alerts.` : ''}
        confirmLabel="Clear Status"
        confirmVariant="danger"
        successMessage="Machine status has been updated."
        onConfirm={() => ApiService.clearKioskMachine(clearTarget.id)}
        onDone={() => load()}
      />
    </>
  )
}

export default MonitoringDashboardPage
