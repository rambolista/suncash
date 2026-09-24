import { useEffect, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import { downloadBlob } from '@/utils/reportHelpers'
import TransactionTotalsSummary from '../transaction-report/components/TransactionTotalsSummary'
import CreditVoucherReportTable from './components/CreditVoucherReportTable'

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const KioskCreditVoucherReportTab = ({ canExport = true }) => {
  const { showNotification } = useNotificationContext()

  const [rows, setRows] = useState([])
  const [totals, setTotals] = useState(null)
  const [branches, setBranches] = useState([])
  const [islands, setIslands] = useState([])
  const [terminals, setTerminals] = useState([])

  const [dateFrom, setDateFrom] = useState(today())
  const [dateTo, setDateTo] = useState(today())
  const [branchId, setBranchId] = useState('')
  const [terminalId, setTerminalId] = useState('')
  const [islandId, setIslandId] = useState('')
  const [voucherCode, setVoucherCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState('')

  const buildFilters = () => ({
    date_from: dateFrom,
    date_to: dateTo,
    branch_id: branchId || null,
    terminal_id: terminalId || null,
    island_id: islandId || null,
    voucher_code: voucherCode.trim() || null,
  })

  const load = (filters = buildFilters()) => {
    setLoading(true)
    ApiService.getKioskCreditVoucherReport(filters)
      .then((data) => {
        setRows(Array.isArray(data?.data) ? data.data : [])
        setTotals(data?.totals || null)
        setBranches(Array.isArray(data?.branches) ? data.branches : [])
        setIslands(Array.isArray(data?.islands) ? data.islands : [])
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load credit voucher report.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleApply = () => load(buildFilters())

  const handleBranchChange = (value) => {
    setBranchId(value)
    setTerminalId('')
    if (!value) {
      setTerminals([])
      return
    }
    ApiService.getKioskCreditVoucherReportTerminals(value)
      .then((data) => setTerminals(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load terminals.', variant: 'danger' }))
  }

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const { blob, filename } = await ApiService.exportKioskCreditVoucherReport(buildFilters(), format)
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
              <Form.Label>Start Date</Form.Label>
              <Form.Control type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </Col>
            <Col md={2}>
              <Form.Label>End Date</Form.Label>
              <Form.Control type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </Col>
            <Col md={2}>
              <Form.Label>Kiosk Branch</Form.Label>
              <Form.Select value={branchId} onChange={(e) => handleBranchChange(e.target.value)}>
                <option value="">ALL</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label>Kiosk Terminal</Form.Label>
              <Form.Select value={terminalId} onChange={(e) => setTerminalId(e.target.value)} disabled={!branchId}>
                <option value="">ALL</option>
                {terminals.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label>Island</Form.Label>
              <Form.Select value={islandId} onChange={(e) => setIslandId(e.target.value)}>
                <option value="">ALL</option>
                {islands.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label>Voucher Code</Form.Label>
              <Form.Control value={voucherCode} onChange={(e) => setVoucherCode(e.target.value)} placeholder="Enter voucher code" />
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

      {!loading && totals && <TransactionTotalsSummary totals={totals} />}

      <Card>
        <CardBody>
          {loading ? <LoadingState message="Loading credit voucher report..." /> : <CreditVoucherReportTable data={rows} />}
        </CardBody>
      </Card>
    </>
  )
}

export default KioskCreditVoucherReportTab
