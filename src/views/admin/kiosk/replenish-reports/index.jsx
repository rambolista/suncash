import { useEffect, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import LoadingState from '@/components/LoadingState'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import ReplenishTable from './components/ReplenishTable'
import ReplenishDetailModal from './components/ReplenishDetailModal'

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

const VIEWS = {
  meter: {
    title: 'View Meter',
    columns: [{ key: 'denom', label: 'Denom' }, { key: 'count', label: 'Count' }, { key: 'value', label: 'Total Value' }],
    load: ApiService.getKioskReplenishMeter,
    export: ApiService.exportKioskReplenishMeter,
  },
  addCash: {
    title: 'View Add Cash',
    columns: [{ key: 'bin', label: 'Bin' }, { key: 'denom', label: 'Denom' }, { key: 'count', label: 'Count' }, { key: 'value', label: 'Value' }],
    load: ApiService.getKioskReplenishAddCash,
    export: ApiService.exportKioskReplenishAddCash,
  },
  clearAcceptor: {
    title: 'View Clear Acceptor',
    columns: [{ key: 'denom', label: 'Denom' }, { key: 'count', label: 'Count' }, { key: 'value', label: 'Value' }],
    load: ApiService.getKioskReplenishClearAcceptor,
    export: ApiService.exportKioskReplenishClearAcceptor,
  },
}

const KioskReplenishReportsPage = () => {
  const { showNotification } = useNotificationContext()

  const [rows, setRows] = useState([])
  const [branches, setBranches] = useState([])
  const [terminals, setTerminals] = useState([])
  const [branchId, setBranchId] = useState('')
  const [terminalId, setTerminalId] = useState('')
  const [loading, setLoading] = useState(true)
  const [exportingList, setExportingList] = useState('')

  const [activeViewKey, setActiveViewKey] = useState(null)
  const [activeTerminal, setActiveTerminal] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailExporting, setDetailExporting] = useState('')

  const load = (terminal = terminalId, branch = branchId) => {
    setLoading(true)
    ApiService.getKioskReplenishReports(terminal || null, branch || null)
      .then((data) => {
        setRows(Array.isArray(data?.data) ? data.data : [])
        setBranches(Array.isArray(data?.branches) ? data.branches : [])
        setTerminals(Array.isArray(data?.terminals) ? data.terminals : [])
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load replenish reports.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleApply = () => load(terminalId, branchId)

  const handleBranchChange = (value) => {
    setBranchId(value)
    setTerminalId('')
    if (!value) return
    ApiService.getKioskReplenishReportTerminals(value)
      .then((data) => setTerminals(Array.isArray(data?.data) ? data.data.map((t) => ({ terminal_id: t.id, kiosk_terminal: t.name })) : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load terminals.', variant: 'danger' }))
  }

  const handleExportList = async (format) => {
    setExportingList(format)
    try {
      const { blob, filename } = await ApiService.exportKioskReplenishReports(terminalId || null, branchId || null, format)
      downloadBlob(blob, filename)
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || `Failed to export ${format.toUpperCase()}.`, variant: 'danger' })
    } finally {
      setExportingList('')
    }
  }

  const openView = (viewKey, row) => {
    if (!row?.terminal_id) {
      showNotification({ title: 'Invalid terminal', message: 'Invalid Kiosk Terminal.', variant: 'warning' })
      return
    }
    setActiveViewKey(viewKey)
    setActiveTerminal(row)
    setDetail(null)
    setDetailLoading(true)
    VIEWS[viewKey].load(row.terminal_id)
      .then((data) => setDetail(data))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'No Record Found.', variant: 'danger' }))
      .finally(() => setDetailLoading(false))
  }

  const closeView = () => {
    setActiveViewKey(null)
    setActiveTerminal(null)
    setDetail(null)
  }

  const handleDetailExport = async (format) => {
    setDetailExporting(format)
    try {
      const { blob, filename } = await VIEWS[activeViewKey].export(activeTerminal.terminal_id, format)
      downloadBlob(blob, filename)
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || `Failed to export ${format.toUpperCase()}.`, variant: 'danger' })
    } finally {
      setDetailExporting('')
    }
  }

  const activeView = activeViewKey ? VIEWS[activeViewKey] : null

  return (
    <>
      <Card className="mb-3">
        <CardBody>
          <Row className="g-3 align-items-end">
            <Col md={3}>
              <Form.Label>Kiosk Branch</Form.Label>
              <Form.Select value={branchId} onChange={(e) => handleBranchChange(e.target.value)}>
                <option value="">ALL</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label>Kiosk Terminal</Form.Label>
              <Form.Select value={terminalId} onChange={(e) => setTerminalId(e.target.value)}>
                <option value="">ALL</option>
                {terminals.map((t) => <option key={t.terminal_id} value={t.terminal_id}>{t.kiosk_terminal}</option>)}
              </Form.Select>
            </Col>
            <Col md="auto">
              <Button variant="primary" onClick={handleApply} disabled={loading}>
                <Icon icon="filter" className="me-1" /> Apply Filters
              </Button>
            </Col>
            <Col />
            <Col md="auto">
              <Button variant="outline-secondary" disabled={exportingList !== '' || rows.length === 0} onClick={() => handleExportList('pdf')}>
                <Icon icon="file-type-pdf" className="me-1" /> {exportingList === 'pdf' ? 'Exporting...' : 'Export to PDF'}
              </Button>
            </Col>
            <Col md="auto">
              <Button variant="outline-success" disabled={exportingList !== '' || rows.length === 0} onClick={() => handleExportList('csv')}>
                <Icon icon="file-type-xls" className="me-1" /> {exportingList === 'csv' ? 'Exporting...' : 'Export to Excel'}
              </Button>
            </Col>
          </Row>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          {loading ? <LoadingState message="Loading replenish reports..." /> : (
            <ReplenishTable
              data={rows}
              onViewMeter={(row) => openView('meter', row)}
              onViewAddCash={(row) => openView('addCash', row)}
              onViewClearAcceptor={(row) => openView('clearAcceptor', row)}
            />
          )}
        </CardBody>
      </Card>

      {activeView && (
        <ReplenishDetailModal
          show={Boolean(activeViewKey)}
          onHide={closeView}
          title={`${activeView.title}${activeTerminal ? ` — ${activeTerminal.kiosk_terminal}` : ''}`}
          loading={detailLoading}
          date={detail?.date}
          columns={activeView.columns}
          rows={detail?.rows || []}
          totals={detail?.totals}
          exporting={detailExporting}
          onExport={handleDetailExport}
        />
      )}
    </>
  )
}

export default KioskReplenishReportsPage
