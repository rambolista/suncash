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
import SmsLogsTable from './components/SmsLogsTable'

const today = () => new Date().toISOString().slice(0, 10)
const weekAgo = () => {
  const date = new Date()
  date.setDate(date.getDate() - 7)
  return date.toISOString().slice(0, 10)
}

const SmsLogsPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const canExport = Boolean(getModulePermission(currentUser, '/tools/sms-logs').can_export)

  const [dateFrom, setDateFrom] = useState(weekAgo())
  const [dateTo, setDateTo] = useState(today())
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState([])
  const [pageInfo, setPageInfo] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [everLoaded, setEverLoaded] = useState(false)
  const [exporting, setExporting] = useState('')

  // Debounce the search box — the request only fires once typing pauses.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 400)
    return () => clearTimeout(timeout)
  }, [searchInput])

  const load = () => {
    setLoading(true)
    ApiService.getSmsLogs(dateFrom, dateTo, search, page)
      .then((data) => {
        setRows(Array.isArray(data?.data) ? data.data : [])
        setPageInfo({ current_page: data?.current_page || 1, last_page: data?.last_page || 1, total: data?.total || 0 })
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load SMS logs.', variant: 'danger' }))
      .finally(() => { setLoading(false); setEverLoaded(true) })
  }

  useEffect(() => { load() }, [dateFrom, dateTo, search, page]) // eslint-disable-line react-hooks/exhaustive-deps

  const applyDateFilter = () => setPage(1)

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const { blob, filename } = await ApiService.exportSmsLogs(dateFrom, dateTo, search, format)
      downloadBlob(blob, filename)
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || `Failed to export ${format.toUpperCase()}.`, variant: 'danger' })
    } finally {
      setExporting('')
    }
  }

  return (
    <>
      <PageBreadcrumb title="SMS Logs" subtitle="Tools" />

      <Card className="mb-3">
        <CardBody>
          <Row className="g-2 align-items-end">
            <Col md={3}>
              <Form.Label className="small text-muted mb-1">Start Date</Form.Label>
              <Form.Control size="sm" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </Col>
            <Col md={3}>
              <Form.Label className="small text-muted mb-1">End Date</Form.Label>
              <Form.Control size="sm" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </Col>
            <Col md="auto">
              <Button size="sm" variant="primary" onClick={applyDateFilter}>
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
            <LoadingState message="Loading SMS logs..." />
          ) : (
            <>
              <div className="position-relative">
                <div style={{ opacity: loading ? 0.4 : 1 }}>
                  <SmsLogsTable data={rows} searchValue={searchInput} onSearchChange={setSearchInput} />
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
    </>
  )
}

export default SmsLogsPage
