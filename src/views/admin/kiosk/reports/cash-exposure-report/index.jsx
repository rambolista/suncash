import { useEffect, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import CashExposureReportTable from './components/CashExposureReportTable'
import CashExposureTotalsSummary from './components/CashExposureTotalsSummary'

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

// Legacy reads live balance columns off kiosk_terminal — a snapshot, not a
// date-ranged report (its own view's date inputs are commented out).
const KioskCashExposureReportTab = ({ canExport = true }) => {
  const { showNotification } = useNotificationContext()

  const [rows, setRows] = useState([])
  const [totals, setTotals] = useState(null)
  const [terminals, setTerminals] = useState([])
  const [islands, setIslands] = useState([])

  const [terminalId, setTerminalId] = useState('')
  const [islandId, setIslandId] = useState('')

  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState('')

  const buildFilters = (term = terminalId, isl = islandId) => ({
    terminal_id: term || null,
    island_id: isl || null,
  })

  const load = (filters = buildFilters()) => {
    setLoading(true)
    ApiService.getKioskCashExposureReport(filters)
      .then((data) => {
        setRows(Array.isArray(data?.data) ? data.data : [])
        setTotals(data?.totals || null)
        setTerminals(Array.isArray(data?.terminals) ? data.terminals : [])
        setIslands(Array.isArray(data?.islands) ? data.islands : [])
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load cash exposure report.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleApply = () => load(buildFilters())

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const { blob, filename } = await ApiService.exportKioskCashExposureReport(buildFilters(), format)
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
            <Col md={3}>
              <Form.Label>Kiosk Terminal</Form.Label>
              <Form.Select value={terminalId} onChange={(e) => setTerminalId(e.target.value)}>
                <option value="">ALL</option>
                {terminals.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label>Island</Form.Label>
              <Form.Select value={islandId} onChange={(e) => setIslandId(e.target.value)}>
                <option value="">ALL</option>
                {islands.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </Form.Select>
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

      {!loading && totals && <CashExposureTotalsSummary totals={totals} />}

      <Card>
        <CardBody>
          {loading ? <LoadingState message="Loading cash exposure report..." /> : <CashExposureReportTable data={rows} />}
        </CardBody>
      </Card>
    </>
  )
}

export default KioskCashExposureReportTab
