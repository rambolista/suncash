import { useEffect, useMemo, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Nav, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import { downloadBlob } from '@/utils/reportHelpers'
import ConfirmActionModal from '@/views/admin/merchants/components/ConfirmActionModal'
import PaymentSummaryCards from './components/PaymentSummaryCards'
import PaymentStatisticsWidget from './components/PaymentStatisticsWidget'
import StatusLegend from './components/StatusLegend'
import PaymentProcessFlow from './components/PaymentProcessFlow'
import PaymentManagementTable from './components/PaymentManagementTable'
import AddManualPaymentModal from './components/AddManualPaymentModal'
import EditManualPaymentModal from './components/EditManualPaymentModal'
import ViewPaymentModal from './components/ViewPaymentModal'
import PaymentHistoryModal from './components/PaymentHistoryModal'
import PaymentReasonModal from './components/PaymentReasonModal'
import { ACTION_CONFIG, STATUS_LABELS } from './paymentActions'

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const PaymentManagementPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const permissions = useMemo(() => getModulePermission(currentUser, '/tools/payment-management'), [currentUser])

  const [tab, setTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState([])
  const [types, setTypes] = useState([])
  const [methods, setMethods] = useState([])
  const [clients, setClients] = useState([])
  const [dashboardData, setDashboardData] = useState(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [settlementFilter, setSettlementFilter] = useState('')
  const [exporting, setExporting] = useState('')

  const [addOpen, setAddOpen] = useState(false)
  const [viewTarget, setViewTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [historyTarget, setHistoryTarget] = useState(null)
  const [actionTarget, setActionTarget] = useState(null)
  const [reasonTarget, setReasonTarget] = useState(null)

  const buildFilters = () => ({
    search: search.trim() || null,
    status: statusFilter || null,
    payment_type_id: typeFilter || null,
    settlement_period: settlementFilter.trim() || null,
  })

  const load = (filters = buildFilters()) => {
    setLoading(true)
    ApiService.getPaymentManagement(filters)
      .then((data) => {
        setRows(Array.isArray(data?.data) ? data.data : [])
        setSummary(Array.isArray(data?.summary) ? data.summary : [])
        setTypes(Array.isArray(data?.types) ? data.types : [])
        setMethods(Array.isArray(data?.methods) ? data.methods : [])
        setClients(Array.isArray(data?.clients) ? data.clients : [])
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load payments.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  const loadDashboard = () => {
    const dateTo = today()
    const dateFrom = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10)
    ApiService.getPaymentManagementDashboard(dateFrom, dateTo)
      .then(setDashboardData)
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load payment statistics.', variant: 'danger' }))
  }

  useEffect(() => { load(); loadDashboard() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleApply = () => load(buildFilters())

  const openFromSummary = (status) => {
    setStatusFilter(status)
    setTab('list')
    load({ ...buildFilters(), status })
  }

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const { blob, filename } = await ApiService.exportPaymentManagement(buildFilters(), format)
      downloadBlob(blob, filename)
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || `Failed to export ${format.toUpperCase()}.`, variant: 'danger' })
    } finally {
      setExporting('')
    }
  }

  return (
    <>
      <PageBreadcrumb title="Payment Management" subtitle="Tools" />

      <Nav variant="tabs" activeKey={tab} onSelect={(key) => key && setTab(key)} className="nav-bordered nav-bordered-primary mb-3">
        <Nav.Item>
          <Nav.Link eventKey="dashboard" className="d-flex align-items-center gap-2">
            <Icon icon="layout-dashboard" style={{ fontSize: '1rem' }} />
            <span className="fw-semibold">Dashboard</span>
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="list" className="d-flex align-items-center gap-2">
            <Icon icon="list" style={{ fontSize: '1rem' }} />
            <span className="fw-semibold">List</span>
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {tab === 'dashboard' && (
        loading ? <LoadingState message="Loading payment statistics..." /> : (
          <div className="d-flex flex-column gap-3">
            <PaymentSummaryCards summary={summary} onOpen={openFromSummary} />
            {dashboardData && (
              <PaymentStatisticsWidget
                trend={dashboardData.trend}
                byType={dashboardData.by_type}
                totalPaidAmount={dashboardData.totals?.PAID?.amount || 0}
              />
            )}
          </div>
        )
      )}

      {tab === 'list' && (
        <div className="d-flex flex-column gap-3">
          <Row className="g-3">
            <Col md={6}><StatusLegend /></Col>
            <Col md={6}><PaymentProcessFlow /></Col>
          </Row>

          <Card>
            <CardBody>
              <Row className="g-3 align-items-end mb-3">
                <Col lg={3} md={6}>
                  <Form.Label>Search</Form.Label>
                  <Form.Control value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Company name or transaction ID" />
                </Col>
                <Col lg={2} md={6}>
                  <Form.Label>Payment Type</Form.Label>
                  <Form.Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                    <option value="">All Types</option>
                    {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </Form.Select>
                </Col>
                <Col lg={2} md={6}>
                  <Form.Label>Status</Form.Label>
                  <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All Statuses</option>
                    {Object.entries(STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </Form.Select>
                </Col>
                <Col lg={2} md={6}>
                  <Form.Label>Settlement Period</Form.Label>
                  <Form.Control value={settlementFilter} onChange={(e) => setSettlementFilter(e.target.value)} placeholder="YYYY-MM-DD" />
                </Col>
                <Col lg={3} md={12} className="d-flex gap-2">
                  <Button variant="primary" onClick={handleApply} disabled={loading}>
                    <Icon icon="filter" className="me-1" /> Apply Filters
                  </Button>
                  {permissions.can_add && (
                    <Button variant="success" onClick={() => setAddOpen(true)}>
                      <Icon icon="plus" className="me-1" /> Add Manual Payment
                    </Button>
                  )}
                </Col>
              </Row>

              {permissions.can_export && (
                <Row className="g-2 mb-3">
                  <Col md="auto">
                    <Button variant="outline-secondary" disabled={exporting !== '' || rows.length === 0} onClick={() => handleExport('pdf')}>
                      <Icon icon="file-type-pdf" className="me-1" /> {exporting === 'pdf' ? 'Exporting...' : 'Export to PDF'}
                    </Button>
                  </Col>
                  <Col md="auto">
                    <Button variant="outline-success" disabled={exporting !== '' || rows.length === 0} onClick={() => handleExport('csv')}>
                      <Icon icon="file-type-xls" className="me-1" /> {exporting === 'csv' ? 'Exporting...' : 'Export to Excel/CSV'}
                    </Button>
                  </Col>
                </Row>
              )}

              {loading ? <LoadingState message="Loading payments..." /> : (
                <PaymentManagementTable
                  data={rows}
                  permissions={permissions}
                  onView={setViewTarget}
                  onEdit={setEditTarget}
                  onHistory={setHistoryTarget}
                  onAction={(row, action) => setActionTarget({ row, action })}
                  onReasonAction={(row, action) => setReasonTarget({ row, action })}
                  onCloneDraft={(row) => setActionTarget({ row, action: 'clone_draft' })}
                />
              )}
            </CardBody>
          </Card>
        </div>
      )}

      <AddManualPaymentModal show={addOpen} onHide={() => setAddOpen(false)} types={types} methods={methods} clients={clients} onDone={() => { load(); loadDashboard() }} />

      <EditManualPaymentModal show={Boolean(editTarget)} payment={editTarget} types={types} methods={methods} clients={clients} onHide={() => setEditTarget(null)} onDone={load} />

      <ViewPaymentModal show={Boolean(viewTarget)} payment={viewTarget} onHide={() => setViewTarget(null)} />

      <PaymentHistoryModal show={Boolean(historyTarget)} payment={historyTarget} canExport={permissions.can_export} onHide={() => setHistoryTarget(null)} />

      <ConfirmActionModal
        show={Boolean(actionTarget)}
        onHide={() => setActionTarget(null)}
        title={actionTarget ? ACTION_CONFIG[actionTarget.action].label + ' Payment' : ''}
        message={actionTarget ? ACTION_CONFIG[actionTarget.action].confirmMessage : ''}
        confirmLabel={actionTarget ? ACTION_CONFIG[actionTarget.action].label : ''}
        confirmVariant={actionTarget ? ACTION_CONFIG[actionTarget.action].variant : 'primary'}
        onConfirm={() => (actionTarget.action === 'clone_draft'
          ? ApiService.clonePaymentManagementDraft(actionTarget.row.id)
          : ApiService.updatePaymentManagementStatus(actionTarget.row.id, actionTarget.action))}
        onDone={() => { load(); loadDashboard() }}
      />

      <PaymentReasonModal
        show={Boolean(reasonTarget)}
        onHide={() => setReasonTarget(null)}
        title={reasonTarget ? ACTION_CONFIG[reasonTarget.action].reasonTitle : ''}
        prompt={reasonTarget ? ACTION_CONFIG[reasonTarget.action].reasonPrompt : ''}
        confirmLabel={reasonTarget ? ACTION_CONFIG[reasonTarget.action].label : ''}
        confirmVariant={reasonTarget ? ACTION_CONFIG[reasonTarget.action].variant : 'danger'}
        onConfirm={(reason) => ApiService.updatePaymentManagementStatus(reasonTarget.row.id, reasonTarget.action, reason)}
        onDone={() => { load(); loadDashboard() }}
      />
    </>
  )
}

export default PaymentManagementPage
