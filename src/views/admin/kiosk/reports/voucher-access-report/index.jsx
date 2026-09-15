import { useEffect, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import VoucherAccessReportTable from './components/VoucherAccessReportTable'

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

const KioskVoucherAccessReportTab = ({ canExport = true }) => {
  const { showNotification } = useNotificationContext()

  const [rows, setRows] = useState([])
  const [dateFrom, setDateFrom] = useState(today())
  const [dateTo, setDateTo] = useState(today())
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState('')

  const buildFilters = (df = dateFrom, dt = dateTo) => ({ date_from: df || null, date_to: dt || null })

  const load = (filters = buildFilters()) => {
    setLoading(true)
    ApiService.getKioskVoucherAccessReport(filters)
      .then((data) => setRows(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load voucher access report.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleApply = () => {
    if (!dateFrom || !dateTo) {
      showNotification({ title: 'Failed', message: 'Invalid date.', variant: 'danger' })
      return
    }
    load(buildFilters())
  }

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const { blob, filename } = await ApiService.exportKioskVoucherAccessReport(buildFilters(), format)
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
              <Form.Label>From</Form.Label>
              <Form.Control type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </Col>
            <Col md={3}>
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

      <Card>
        <CardBody>
          {loading ? <LoadingState message="Loading voucher access report..." /> : <VoucherAccessReportTable data={rows} />}
        </CardBody>
      </Card>
    </>
  )
}

export default KioskVoucherAccessReportTab
