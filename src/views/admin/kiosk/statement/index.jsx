import { useEffect, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import { useNavigate } from 'react-router'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import StatementTable from './components/StatementTable'

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

const KioskStatementPage = () => {
  const navigate = useNavigate()
  const { showNotification } = useNotificationContext()

  const [rows, setRows] = useState([])
  const [branches, setBranches] = useState([])
  const [terminals, setTerminals] = useState([])
  const [branchId, setBranchId] = useState('')
  const [terminalId, setTerminalId] = useState('')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState('')

  const load = (branch = branchId, terminal = terminalId) => {
    setLoading(true)
    ApiService.getKioskStatement(branch || null, terminal || null)
      .then((data) => {
        setRows(Array.isArray(data?.data) ? data.data : [])
        setBranches(Array.isArray(data?.branches) ? data.branches : [])
        setTerminals(Array.isArray(data?.terminals) ? data.terminals : [])
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load kiosk statement.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleBranchChange = (value) => {
    setBranchId(value)
    setTerminalId('')
    ApiService.getKioskStatementTerminals(value || null).then((data) => setTerminals(Array.isArray(data?.data) ? data.data : []))
  }

  const handleApply = () => load(branchId, terminalId)

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const { blob, filename } = await ApiService.exportKioskStatement(branchId || null, terminalId || null, format)
      downloadBlob(blob, filename)
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || `Failed to export ${format.toUpperCase()}.`, variant: 'danger' })
    } finally {
      setExporting('')
    }
  }

  return (
    <>
      <PageBreadcrumb title="Statement" subtitle="Kiosk" />

      <Card className="mb-3">
        <CardBody>
          <Row className="g-3 align-items-end">
            <Col md={3}>
              <Form.Label>Branch</Form.Label>
              <Form.Select value={branchId} onChange={(e) => handleBranchChange(e.target.value)}>
                <option value="">-- Select Branch --</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label>Terminal</Form.Label>
              <Form.Select value={terminalId} onChange={(e) => setTerminalId(e.target.value)}>
                <option value="">-- Select Terminal --</option>
                {terminals.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Form.Select>
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
          {loading ? <LoadingState message="Loading kiosk statement..." /> : (
            <StatementTable
              data={rows}
              onViewDetails={(row) => navigate(`/kiosk/statement/${row.id}/ledger`, { state: { terminal: row } })}
            />
          )}
        </CardBody>
      </Card>
    </>
  )
}

export default KioskStatementPage
