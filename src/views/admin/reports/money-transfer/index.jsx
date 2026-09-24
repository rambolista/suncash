import { useEffect, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Nav, Row, Spinner } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import useCurrentUser from '@/hooks/useCurrentUser'
import { getModulePermission } from '@/utils/modulePermissions'
import { useNotificationContext } from '@/context/useNotificationContext'
import { downloadBlob } from '@/utils/reportHelpers'
import MoneyTransferTable from './components/MoneyTransferTable'

const MoneyTransferReportPage = () => {
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const canExport = Boolean(getModulePermission(currentUser, '/reports/money-transfer').can_export)

  const [reportType, setReportType] = useState('completed')
  const [cashiers, setCashiers] = useState([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [cashier, setCashier] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState([])
  const [pageInfo, setPageInfo] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [everLoaded, setEverLoaded] = useState(false)
  const [exporting, setExporting] = useState('')

  useEffect(() => {
    ApiService.getMoneyTransferCashiers()
      .then((data) => setCashiers(Array.isArray(data?.data) ? data.data : []))
      .catch(() => setCashiers([]))
  }, [])

  // Debounce the search box — the request only fires once typing pauses.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 400)
    return () => clearTimeout(timeout)
  }, [searchInput])

  const filterParams = { type: reportType, from, to, cashier, search }

  const load = () => {
    setLoading(true)
    ApiService.getMoneyTransferReport({ ...filterParams, page })
      .then((data) => {
        setRows(Array.isArray(data?.data) ? data.data : [])
        setPageInfo({ current_page: data?.current_page || 1, last_page: data?.last_page || 1, total: data?.total || 0 })
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load report.', variant: 'danger' }))
      .finally(() => { setLoading(false); setEverLoaded(true) })
  }

  useEffect(() => { load() }, [reportType, from, to, cashier, search, page]) // eslint-disable-line react-hooks/exhaustive-deps

  const switchReportType = (type) => {
    if (!type || type === reportType) return
    setReportType(type)
    setPage(1)
    setRows([]) // avoid rendering stale rows (wrong shape) against the new tab's columns
  }

  const applyFilters = () => setPage(1)

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const { blob, filename } = await ApiService.exportMoneyTransferReport(filterParams, format)
      downloadBlob(blob, filename)
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || `Failed to export ${format.toUpperCase()}.`, variant: 'danger' })
    } finally {
      setExporting('')
    }
  }

  return (
    <>
      <PageBreadcrumb title="Money Transfer" subtitle="Reports" />

      <Nav variant="tabs" activeKey={reportType} onSelect={switchReportType} className="nav-bordered nav-bordered-primary mb-3">
        <Nav.Item><Nav.Link eventKey="completed"><Icon icon="circle-check" className="me-1" />Completed</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="pending"><Icon icon="clock" className="me-1" />Pending</Nav.Link></Nav.Item>
      </Nav>

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
            <Col md={3}>
              <Form.Label className="small text-muted mb-1">Cashier</Form.Label>
              <Form.Select size="sm" value={cashier} onChange={(e) => setCashier(e.target.value)}>
                <option value="">--Select Cashier--</option>
                {cashiers.map((c) => <option key={c.id} value={c.id}>{c.legal_name}</option>)}
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
                  <MoneyTransferTable completed={reportType === 'completed'} data={rows} searchValue={searchInput} onSearchChange={setSearchInput} />
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

export default MoneyTransferReportPage
