import { useEffect, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import ZoutReportsTable from './components/ZoutReportsTable'
import ZoutDetailsModal from './components/ZoutDetailsModal'

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

const KioskZoutReportsPage = () => {
  const { showNotification } = useNotificationContext()

  const [rows, setRows] = useState([])
  const [branches, setBranches] = useState([])
  const [branchId, setBranchId] = useState('')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState('')
  const [detailsTarget, setDetailsTarget] = useState(null)
  const [details, setDetails] = useState(null)

  const load = (branch = branchId, loc = location, dt = date) => {
    setLoading(true)
    ApiService.getKioskZoutReports(branch || null, loc || null, dt || null)
      .then((data) => {
        setRows(Array.isArray(data?.data) ? data.data : [])
        setBranches(Array.isArray(data?.branches) ? data.branches : [])
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load zout reports.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleApply = () => load(branchId, location, date)

  const handleViewAll = () => {
    setBranchId('')
    setLocation('')
    setDate('')
    load('', '', '')
  }

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const { blob, filename } = await ApiService.exportKioskZoutReports(branchId || null, location || null, date || null, format)
      downloadBlob(blob, filename)
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || `Failed to export ${format.toUpperCase()}.`, variant: 'danger' })
    } finally {
      setExporting('')
    }
  }

  const handleView = (row) => {
    setDetailsTarget(row)
    setDetails(null)
    ApiService.getKioskZoutReportDetails(row.settlement_no)
      .then((data) => setDetails(data?.data || null))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load settlement details.', variant: 'danger' }))
  }

  return (
    <>
      <Card className="mb-3">
        <CardBody>
          <Row className="g-3 align-items-end">
            <Col md={3}>
              <Form.Label>Branch</Form.Label>
              <Form.Select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                <option value="">-- Select Branch --</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label>Location</Form.Label>
              <Form.Select value={location} onChange={(e) => setLocation(e.target.value)}>
                <option value="">-- Select Location --</option>
                <option value="bahamas">Bahamas</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label>Date</Form.Label>
              <Form.Control type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Col>
            <Col md="auto">
              <Button variant="primary" onClick={handleApply} disabled={loading}>
                <Icon icon="filter" className="me-1" /> Apply Filter
              </Button>
            </Col>
            <Col md="auto">
              <Button variant="outline-secondary" onClick={handleViewAll} disabled={loading}>
                View All Records
              </Button>
            </Col>
            <Col />
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
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          {loading ? <LoadingState message="Loading zout reports..." /> : <ZoutReportsTable data={rows} onView={handleView} />}
        </CardBody>
      </Card>

      <ZoutDetailsModal show={Boolean(detailsTarget)} onHide={() => setDetailsTarget(null)} details={details} />
    </>
  )
}

export default KioskZoutReportsPage
