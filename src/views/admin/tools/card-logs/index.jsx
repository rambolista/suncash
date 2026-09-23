import { useEffect, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import { downloadBlob } from '@/utils/reportHelpers'
import CardLogsTable from './components/CardLogsTable'

const today = () => new Date().toISOString().slice(0, 10)

const CardLogsPage = () => {
  const { showNotification } = useNotificationContext()
  const [dateFrom, setDateFrom] = useState(today())
  const [dateTo, setDateTo] = useState(today())
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState('')

  const load = (from = dateFrom, to = dateTo) => {
    setLoading(true)
    ApiService.getCardLogs(from, to)
      .then((data) => setRows(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load card logs.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const { blob, filename } = await ApiService.exportCardLogs(dateFrom, dateTo, format)
      downloadBlob(blob, filename)
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || `Failed to export ${format.toUpperCase()}.`, variant: 'danger' })
    } finally {
      setExporting('')
    }
  }

  return (
    <>
      <PageBreadcrumb title="Card Logs" subtitle="Tools" />

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
              <Button size="sm" variant="primary" onClick={() => load(dateFrom, dateTo)}>
                <Icon icon="filter" className="me-1" /> Apply Filters
              </Button>
            </Col>
            <Col className="d-flex justify-content-end gap-2">
              <Button size="sm" variant="outline-secondary" disabled={exporting !== ''} onClick={() => handleExport('pdf')}>
                {exporting === 'pdf' ? 'Exporting...' : 'Export to PDF'}
              </Button>
              <Button size="sm" variant="outline-success" disabled={exporting !== ''} onClick={() => handleExport('csv')}>
                {exporting === 'csv' ? 'Exporting...' : 'Export to Excel'}
              </Button>
            </Col>
          </Row>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          {loading ? <LoadingState /> : <CardLogsTable data={rows} />}
        </CardBody>
      </Card>
    </>
  )
}

export default CardLogsPage
