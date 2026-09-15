import { useEffect, useMemo, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import CashManagementTable from './components/CashManagementTable'
import ConfirmActionModal from './components/ConfirmActionModal'
import ViewDetailsModal from './components/ViewDetailsModal'
import { money } from './components/format'

const TILES = [
  { key: 'total_withdrawn', label: 'Total Withdrawn' },
  { key: 'recycled', label: 'Total Recycled' },
  { key: 'not_recycled', label: 'Total Not Recycled' },
  { key: 'held', label: 'Total Held (Not in Custody)' },
  { key: 'secured', label: 'Total Secured' },
  { key: 'custody', label: 'Total In Custody' },
]

const KioskCashManagementPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = getModulePermission(currentUser, '/kiosk/cash-management')
  const canExecute = Boolean(modulePermission.can_execute)

  const [rows, setRows] = useState([])
  const [context, setContext] = useState({ stores: [], terminals: [] })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [searchLocation, setSearchLocation] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [viewId, setViewId] = useState(null)

  const load = () => {
    setLoading(true)
    ApiService.getKioskCashManagement()
      .then((data) => {
        setRows(Array.isArray(data?.deposits) ? data.deposits : [])
        setContext({ stores: data?.stores || [], terminals: data?.terminals || [] })
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load cash management data.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleRefresh = () => {
    setLastUpdated(new Date())
    load()
  }

  // Legacy's status filter isn't a fixed enum — it's built from the distinct
  // deposit-status descriptions actually present in the loaded rows.
  const statusOptions = useMemo(() => {
    const unique = new Set()
    rows.forEach((row) => { if (row.deposit_status_label) unique.add(row.deposit_status_label) })
    return Array.from(unique)
  }, [rows])

  const filteredRows = useMemo(() => {
    const search = searchLocation.trim().toLowerCase()
    const status = statusFilter.toLowerCase()
    return rows.filter((row) => {
      if (search && !(row.kiosk_location || '').toLowerCase().includes(search)) return false
      if (status && !(row.deposit_status_label || '').toLowerCase().includes(status)) return false
      return true
    })
  }, [rows, searchLocation, statusFilter])

  const totals = useMemo(() => {
    const sums = { total_withdrawn: 0, recycled: 0, not_recycled: 0, held: 0, secured: 0, custody: 0 }
    filteredRows.forEach((row) => {
      sums.total_withdrawn += Number(row.total_withdrawn) || 0
      sums.recycled += Number(row.recycled) || 0
      sums.not_recycled += Number(row.not_recycled) || 0
      if (row.held_bucket) sums.held += Number(row.total_withdrawn) || 0
      if (row.custody_bucket) sums.custody += Number(row.total_withdrawn) || 0
      if (row.secured_bucket) sums.secured += Number(row.total_withdrawn) || 0
    })
    return sums
  }, [filteredRows])

  const handleAction = (deposit, actionValue) => {
    const action = deposit.available_actions.find((a) => a.value === actionValue) || { value: actionValue, label: actionValue }
    setConfirmTarget({ deposit, action })
  }

  return (
    <>
      <PageBreadcrumb title="Cash Management" subtitle="Kiosk" />

      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <span className="text-muted small">Last Updated: {lastUpdated.toLocaleString()}</span>
        <Button variant="dark" size="sm" onClick={handleRefresh} disabled={loading}>
          <Icon icon="refresh" className="me-1" /> Refresh
        </Button>
      </div>

      <Row className="g-3 mb-3">
        {TILES.map((tile) => (
          <Col md={4} key={tile.key}>
            <Card className="h-100">
              <CardBody className="py-2">
                <span className="small">{tile.label}: <strong>{money(totals[tile.key])}</strong></span>
              </CardBody>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="mb-3">
        <CardBody>
          <Row className="g-3">
            <Col md={6}>
              <Form.Control
                placeholder="Search by kiosk location..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
              />
            </Col>
            <Col md={6}>
              <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All</option>
                {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </Form.Select>
            </Col>
          </Row>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          {loading ? <LoadingState message="Loading cash management data..." /> : (
            <CashManagementTable
              data={filteredRows}
              canExecute={canExecute}
              onAction={handleAction}
              onView={(item) => setViewId(item.id)}
            />
          )}
        </CardBody>
      </Card>

      <ConfirmActionModal
        show={Boolean(confirmTarget)}
        onHide={() => setConfirmTarget(null)}
        deposit={confirmTarget?.deposit}
        action={confirmTarget?.action}
        context={context}
        onSaved={load}
      />

      <ViewDetailsModal
        show={Boolean(viewId)}
        onHide={() => setViewId(null)}
        depositId={viewId}
      />
    </>
  )
}

export default KioskCashManagementPage
