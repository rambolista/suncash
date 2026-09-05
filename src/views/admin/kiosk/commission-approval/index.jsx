import { useEffect, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import CommissionApprovalTable from './components/CommissionApprovalTable'
import CommissionApprovalTotalsSummary from './components/CommissionApprovalTotalsSummary'
import ApprovalFormModal from './components/ApprovalFormModal'
import HistoryModal from './components/HistoryModal'

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const currentMonthValue = () => new Date().toISOString().slice(0, 7)

const CommissionApprovalPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const modulePermission = getModulePermission(currentUser, '/kiosk/commission-approval')
  const canApprove = Boolean(modulePermission.can_approve)
  const canReject = Boolean(modulePermission.can_cancel)
  const canExport = Boolean(modulePermission.can_export)

  const [rows, setRows] = useState([])
  const [totals, setTotals] = useState(null)
  const [statuses, setStatuses] = useState({})
  const [locations, setLocations] = useState([])

  const [monthValue, setMonthValue] = useState(currentMonthValue())
  const [status, setStatus] = useState('')
  const [location, setLocation] = useState('')
  const [partnerName, setPartnerName] = useState('')

  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState('')
  const [approvalTarget, setApprovalTarget] = useState(null)
  const [historyTarget, setHistoryTarget] = useState(null)

  const buildFilters = () => {
    const [year, month] = monthValue.split('-').map(Number)
    return {
      year,
      month: MONTH_NAMES[(month || 1) - 1],
      status: status || null,
      location: location || null,
      partner_name: partnerName || null,
    }
  }

  const load = (filters = buildFilters()) => {
    setLoading(true)
    ApiService.getKioskCommissionApprovals(filters)
      .then((data) => {
        setRows(Array.isArray(data?.data) ? data.data : [])
        setTotals(data?.totals || null)
        setStatuses(data?.statuses || {})
        setLocations(Array.isArray(data?.locations) ? data.locations : [])
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load commission approvals.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleApply = () => load(buildFilters())

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const { blob, filename } = await ApiService.exportKioskCommissionApprovals(buildFilters(), format)
      downloadBlob(blob, filename)
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || `Failed to export ${format.toUpperCase()}.`, variant: 'danger' })
    } finally {
      setExporting('')
    }
  }

  return (
    <>
      <PageBreadcrumb title="Commission Approval" subtitle="Kiosk" />

      <Card className="mb-3">
        <CardBody>
          <Row className="g-3 align-items-end">
            <Col md={2}>
              <Form.Label>Month</Form.Label>
              <Form.Control type="month" value={monthValue} onChange={(e) => setMonthValue(e.target.value)} />
            </Col>
            <Col md={2}>
              <Form.Label>Status</Form.Label>
              <Form.Select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All</option>
                {Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label>Kiosk Location</Form.Label>
              <Form.Control list="commission-approval-locations" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="All locations" />
              <datalist id="commission-approval-locations">
                {locations.map((loc) => <option key={loc} value={loc} />)}
              </datalist>
            </Col>
            <Col md={3}>
              <Form.Label>Partner Name</Form.Label>
              <Form.Control value={partnerName} onChange={(e) => setPartnerName(e.target.value)} placeholder="Search partner name" />
            </Col>
            <Col md="auto">
              <Button variant="primary" onClick={handleApply} disabled={loading}>
                <Icon icon="filter" className="me-1" /> Apply Filters
              </Button>
            </Col>
          </Row>

          {canExport && (
            <Row className="g-3 mt-1">
              <Col md="auto">
                <Button variant="outline-secondary" disabled={exporting !== '' || rows.length === 0} onClick={() => handleExport('pdf')}>
                  <Icon icon="file-type-pdf" className="me-1" /> {exporting === 'pdf' ? 'Exporting...' : 'Export to PDF'}
                </Button>
              </Col>
              <Col md="auto">
                <Button variant="outline-success" disabled={exporting !== '' || rows.length === 0} onClick={() => handleExport('csv')}>
                  <Icon icon="file-type-xls" className="me-1" /> {exporting === 'csv' ? 'Exporting...' : 'Export to Excel'}
                </Button>
              </Col>
            </Row>
          )}
        </CardBody>
      </Card>

      {!loading && totals && <CommissionApprovalTotalsSummary totals={totals} />}

      <Card>
        <CardBody>
          {loading ? <LoadingState message="Loading commission approvals..." /> : (
            <CommissionApprovalTable
              data={rows}
              canApprove={canApprove}
              canReject={canReject}
              onApprove={(item) => setApprovalTarget({ ...item, mode: 'approve' })}
              onReject={(item) => setApprovalTarget({ ...item, mode: 'reject' })}
              onHistory={(item) => setHistoryTarget(item)}
            />
          )}
        </CardBody>
      </Card>

      <ApprovalFormModal
        show={Boolean(approvalTarget)}
        onHide={() => setApprovalTarget(null)}
        transactionId={approvalTarget?.transaction_id}
        mode={approvalTarget?.mode}
        onSaved={load}
      />

      <HistoryModal
        show={Boolean(historyTarget)}
        onHide={() => setHistoryTarget(null)}
        terminal={historyTarget}
      />
    </>
  )
}

export default CommissionApprovalPage
