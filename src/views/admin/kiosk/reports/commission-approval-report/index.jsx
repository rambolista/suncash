import { useEffect, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import { downloadBlob } from '@/utils/reportHelpers'
import CommissionApprovalReportTable from './components/CommissionApprovalReportTable'
import CommissionApprovalTotalsSummary from '../../commission-approval/components/CommissionApprovalTotalsSummary'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const currentMonthValue = () => new Date().toISOString().slice(0, 7)

const KioskCommissionApprovalReportTab = ({ canExport = true }) => {
  const { showNotification } = useNotificationContext()

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
    ApiService.getKioskCommissionApprovalReport(filters)
      .then((data) => {
        setRows(Array.isArray(data?.data) ? data.data : [])
        setTotals(data?.totals || null)
        setStatuses(data?.statuses || {})
        setLocations(Array.isArray(data?.locations) ? data.locations : [])
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load commission approval report.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleApply = () => load(buildFilters())

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const { blob, filename } = await ApiService.exportKioskCommissionApprovalReport(buildFilters(), format)
      downloadBlob(blob, filename)
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || `Failed to export ${format.toUpperCase()}.`, variant: 'danger' })
    } finally {
      setExporting('')
    }
  }

  return (
    <>
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
              <Form.Control list="commission-approval-report-locations" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="All locations" />
              <datalist id="commission-approval-report-locations">
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
          {loading ? <LoadingState message="Loading commission approval report..." /> : <CommissionApprovalReportTable data={rows} />}
        </CardBody>
      </Card>
    </>
  )
}

export default KioskCommissionApprovalReportTab
