import { useEffect, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Row, Spinner } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import { downloadBlob } from '@/utils/reportHelpers'
import ReportTotalSummary from '../components/ReportTotalSummary'
import UtilityBillpayTable from './components/UtilityBillpayTable'

// toISOString() converts to UTC first, which can shift the calendar day — format from local fields instead.
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const UtilityBillpayReportPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const canExport = Boolean(getModulePermission(currentUser, '/reports/utility-billpay').can_export)

  const [billers, setBillers] = useState([])
  const [from, setFrom] = useState(today())
  const [to, setTo] = useState(today())
  const [biller, setBiller] = useState('')
  const [source, setSource] = useState('ALL')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState([])
  const [pageInfo, setPageInfo] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [everLoaded, setEverLoaded] = useState(false)
  const [exporting, setExporting] = useState('')

  useEffect(() => {
    ApiService.getUtilityBillpayBillers()
      .then((data) => setBillers(Array.isArray(data?.data) ? data.data : []))
      .catch(() => setBillers([]))
  }, [])

  const filterParams = { from, to, biller, source }

  const load = () => {
    setLoading(true)
    ApiService.getUtilityBillpayReport({ ...filterParams, page })
      .then((data) => {
        setRows(Array.isArray(data?.data) ? data.data : [])
        setPageInfo({ current_page: data?.current_page || 1, last_page: data?.last_page || 1, total: data?.total || 0 })
        setSummary(data?.summary || null)
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load report.', variant: 'danger' }))
      .finally(() => { setLoading(false); setEverLoaded(true) })
  }

  useEffect(() => { load() }, [from, to, biller, source, page]) // eslint-disable-line react-hooks/exhaustive-deps

  const applyFilters = () => setPage(1)

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const { blob, filename } = await ApiService.exportUtilityBillpayReport(filterParams, format)
      downloadBlob(blob, filename)
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || `Failed to export ${format.toUpperCase()}.`, variant: 'danger' })
    } finally {
      setExporting('')
    }
  }

  return (
    <>
      <PageBreadcrumb title="Utility Billpay" subtitle="Reports" />

      <Card className="mb-3">
        <CardBody>
          <Row className="g-2 align-items-end">
            <Col md={3}>
              <Form.Label className="small text-muted mb-1">Start Date</Form.Label>
              <Form.Control size="sm" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Col>
            <Col md={3}>
              <Form.Label className="small text-muted mb-1">End Date</Form.Label>
              <Form.Control size="sm" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </Col>
            <Col md={2}>
              <Form.Label className="small text-muted mb-1">Biller Code</Form.Label>
              <Form.Select size="sm" value={biller} onChange={(e) => setBiller(e.target.value)}>
                <option value="">ALL</option>
                {billers.map((b) => <option key={b} value={b}>{b}</option>)}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label className="small text-muted mb-1">Source</Form.Label>
              <Form.Select size="sm" value={source} onChange={(e) => setSource(e.target.value)}>
                <option value="ALL">ALL</option>
                <option value="CustomerApp">CustomerApp</option>
                <option value="Kiosk">Kiosk</option>
                <option value="WebPOS">WebPOS</option>
              </Form.Select>
            </Col>
            <Col md="auto">
              <Button size="sm" variant="primary" onClick={applyFilters}>
                <Icon icon="filter" className="me-1" /> Apply Filters
              </Button>
            </Col>
            {canExport && (
              <Col className="d-flex justify-content-end gap-2">
                <Button size="sm" variant="outline-secondary" disabled={exporting !== ''} onClick={() => handleExport('pdf')}>
                  {exporting === 'pdf' ? 'Exporting...' : 'Export to PDF'}
                </Button>
                <Button size="sm" variant="outline-success" disabled={exporting !== ''} onClick={() => handleExport('csv')}>
                  {exporting === 'csv' ? 'Exporting...' : 'Export to Excel'}
                </Button>
              </Col>
            )}
          </Row>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          {!everLoaded ? (
            <LoadingState message="Loading report..." />
          ) : (
            <>
              <div className="position-relative">
                <div style={{ opacity: loading ? 0.4 : 1 }}>
                  <UtilityBillpayTable data={rows} />
                </div>
                {loading && (
                  <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
                    <Spinner animation="border" variant="primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                  </div>
                )}
              </div>
              {pageInfo.last_page > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <span className="text-muted small">
                    Page {pageInfo.current_page} of {pageInfo.last_page} — {pageInfo.total.toLocaleString()} total
                  </span>
                  <div className="d-flex gap-2">
                    <Button size="sm" variant="outline-secondary" disabled={loading || pageInfo.current_page <= 1} onClick={() => setPage((p) => p - 1)}>
                      <Icon icon="chevron-left" className="me-1" /> Previous
                    </Button>
                    <Button size="sm" variant="outline-secondary" disabled={loading || pageInfo.current_page >= pageInfo.last_page} onClick={() => setPage((p) => p + 1)}>
                      Next <Icon icon="chevron-right" className="ms-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {summary && (
        <ReportTotalSummary
          lines={[
            { label: 'Total Transaction Count', value: summary.transaction_count.toLocaleString() },
            { label: 'Total Principle Amount', value: summary.transaction_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
          ]}
        />
      )}
    </>
  )
}

export default UtilityBillpayReportPage
