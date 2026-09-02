import { useEffect, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import { useLocation, useNavigate, useParams } from 'react-router'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import { money } from '../components/format'
import LedgerTable from './components/LedgerTable'

const today = () => new Date().toISOString().slice(0, 10)

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

const KioskStatementLedgerPage = () => {
  const { terminalId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { showNotification } = useNotificationContext()

  const terminalFromList = location.state?.terminal
  const [data, setData] = useState(null)
  const [dateFrom, setDateFrom] = useState(today())
  const [dateTo, setDateTo] = useState(today())
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState('')

  const load = (from = dateFrom, to = dateTo) => {
    setLoading(true)
    ApiService.getKioskStatementLedger(terminalId, from, to)
      .then(setData)
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load kiosk statement ledger.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [terminalId])

  const handleApply = () => load(dateFrom, dateTo)

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const { blob, filename } = await ApiService.exportKioskStatementLedger(terminalId, dateFrom, dateTo, format)
      downloadBlob(blob, filename)
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || `Failed to export ${format.toUpperCase()}.`, variant: 'danger' })
    } finally {
      setExporting('')
    }
  }

  const terminal = data?.terminal || terminalFromList

  return (
    <>
      <PageBreadcrumb title="Statement" subtitle="Kiosk" />

      <Card className="mb-3">
        <CardBody>
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
            <div>
              <Button variant="light" size="sm" className="mb-2" onClick={() => navigate('/kiosk/statement')}>
                <Icon icon="arrow-left" className="me-1" /> Back
              </Button>
              <h5 className="mb-0">{terminal?.name || terminal?.machine}</h5>
              <span className="text-muted small">{terminal?.location}{terminal?.island_name ? ` · ${terminal.island_name}` : ''}</span>
            </div>
            {data && (
              <div className="text-end">
                <div className="text-muted small">Opening Balance</div>
                <div className="fs-4 fw-semibold">{money(data.opening_balance)}</div>
              </div>
            )}
          </div>

          <Row className="align-items-end g-2">
            <Col md={3}>
              <Form.Label className="small text-muted">Date From</Form.Label>
              <Form.Control type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </Col>
            <Col md={3}>
              <Form.Label className="small text-muted">Date To</Form.Label>
              <Form.Control type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </Col>
            <Col md="auto">
              <Button variant="primary" onClick={handleApply} disabled={loading}>
                <Icon icon="filter" className="me-1" /> Apply
              </Button>
            </Col>
            <Col />
            <Col md="auto">
              <Button variant="outline-secondary" disabled={exporting !== ''} onClick={() => handleExport('pdf')}>
                <Icon icon="file-type-pdf" className="me-1" /> {exporting === 'pdf' ? 'Exporting...' : 'Export to PDF'}
              </Button>
            </Col>
            <Col md="auto">
              <Button variant="outline-success" disabled={exporting !== ''} onClick={() => handleExport('csv')}>
                <Icon icon="file-type-xls" className="me-1" /> {exporting === 'csv' ? 'Exporting...' : 'Export to Excel'}
              </Button>
            </Col>
          </Row>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          {loading ? <LoadingState message="Loading ledger..." /> : <LedgerTable data={data?.rows || []} />}
        </CardBody>
      </Card>
    </>
  )
}

export default KioskStatementLedgerPage
