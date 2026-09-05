import { useEffect, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import PartnerSettlementReportTable from './components/PartnerSettlementReportTable'
import PartnerSettlementTotalsSummary from './components/PartnerSettlementTotalsSummary'

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

const today = () => new Date().toISOString().slice(0, 10)

const KioskPartnerSettlementReportTab = ({ canExport = true }) => {
  const { showNotification } = useNotificationContext()

  const [rows, setRows] = useState([])
  const [totals, setTotals] = useState(null)
  const [partners, setPartners] = useState([])

  const [dateFrom, setDateFrom] = useState(today())
  const [dateTo, setDateTo] = useState(today())
  const [branchId, setBranchId] = useState('')

  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState('')

  const buildFilters = (df = dateFrom, dt = dateTo, branch = branchId) => ({
    date_from: df || null,
    date_to: dt || null,
    branch_id: branch || null,
  })

  const load = (filters = buildFilters()) => {
    setLoading(true)
    ApiService.getKioskPartnerSettlementReport(filters)
      .then((data) => {
        setRows(Array.isArray(data?.data) ? data.data : [])
        setTotals(data?.totals || null)
        setPartners(Array.isArray(data?.partners) ? data.partners : [])
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load partner settlement report.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleApply = () => load(buildFilters())

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const { blob, filename } = await ApiService.exportKioskPartnerSettlementReport(buildFilters(), format)
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
              <Form.Label>Partner</Form.Label>
              <Form.Select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                <option value="">ALL</option>
                {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label>From</Form.Label>
              <Form.Control type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </Col>
            <Col md={2}>
              <Form.Label>To</Form.Label>
              <Form.Control type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
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

      {!loading && totals && <PartnerSettlementTotalsSummary totals={totals} />}

      <Card>
        <CardBody>
          {loading ? <LoadingState message="Loading partner settlement report..." /> : <PartnerSettlementReportTable data={rows} />}
        </CardBody>
      </Card>
    </>
  )
}

export default KioskPartnerSettlementReportTab
