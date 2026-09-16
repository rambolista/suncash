import { useEffect, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Row, Table } from 'react-bootstrap'
import Icon from '@/components/wrappers/Icon'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import AdjustmentModal from './AdjustmentModal'
import { money, downloadBlob } from '@/utils/reportHelpers'

const todayValue = () => new Date().toISOString().slice(0, 10)

const DetailView = ({ terminal, canExport, canExecute, onBack }) => {
  const { showNotification } = useNotificationContext()
  const [context, setContext] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState(todayValue())
  const [dateTo, setDateTo] = useState(todayValue())
  const [transType, setTransType] = useState('')
  const [exporting, setExporting] = useState('')
  const [showAdjustment, setShowAdjustment] = useState(false)

  const load = () => {
    setLoading(true)
    ApiService.getKioskDepositAdjustmentTerminal(terminal.id, { date_from: dateFrom, date_to: dateTo, trans_type: transType || null })
      .then((data) => {
        setContext(data)
        setTransactions(Array.isArray(data?.transactions) ? data.transactions : [])
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load kiosk adjustments.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [terminal?.id])

  const handleApply = () => {
    setLoading(true)
    ApiService.getKioskDepositAdjustmentTransactions(terminal.id, { date_from: dateFrom, date_to: dateTo, trans_type: transType || null })
      .then((data) => setTransactions(Array.isArray(data?.transactions) ? data.transactions : []))
      .catch(() => showNotification({ title: 'Failed', message: 'No records found.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const { blob, filename } = await ApiService.exportKioskDepositAdjustmentTerminal(terminal.id, { date_from: dateFrom, date_to: dateTo, trans_type: transType || null }, format)
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
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <Button variant="light" size="sm" className="mb-2" onClick={onBack}>
                <Icon icon="arrow-left" className="me-1" /> Back
              </Button>
              <h5 className="mb-0">Kiosk Adjustment Tool</h5>
              <p className="text-muted mb-0 small">{terminal?.name} {terminal?.location}</p>
            </div>
            {canExecute && (
              <Button variant="primary" onClick={() => setShowAdjustment(true)}>
                <Icon icon="adjustments" className="me-1" /> Adjustment
              </Button>
            )}
          </div>

          <Row className="g-3 align-items-end">
            <Col md={3}>
              <Form.Label>From</Form.Label>
              <Form.Control type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </Col>
            <Col md={3}>
              <Form.Label>To</Form.Label>
              <Form.Control type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </Col>
            <Col md={3}>
              <Form.Label>Adjustment Type</Form.Label>
              <Form.Select value={transType} onChange={(e) => setTransType(e.target.value)}>
                <option value="">Select adjustment type</option>
                <option value="debit">Debit</option>
                <option value="credit">Credit</option>
                <option value="deposit">Deposit</option>
              </Form.Select>
            </Col>
            <Col md="auto">
              <Button variant="outline-primary" onClick={handleApply} disabled={loading}>
                <Icon icon="filter" className="me-1" /> Display
              </Button>
            </Col>
          </Row>

          {canExport && (
            <Row className="g-3 mt-1">
              <Col md="auto">
                <Button variant="outline-secondary" disabled={exporting !== '' || transactions.length === 0} onClick={() => handleExport('pdf')}>
                  <Icon icon="file-type-pdf" className="me-1" /> {exporting === 'pdf' ? 'Exporting...' : 'Export to PDF'}
                </Button>
              </Col>
              <Col md="auto">
                <Button variant="outline-success" disabled={exporting !== '' || transactions.length === 0} onClick={() => handleExport('csv')}>
                  <Icon icon="file-type-xls" className="me-1" /> {exporting === 'csv' ? 'Exporting...' : 'Export to Excel'}
                </Button>
              </Col>
            </Row>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h6 className="mb-3">Kiosk Deposits and Adjustments</h6>
          {loading ? <LoadingState message="Loading transactions..." /> : (
            <div className="table-responsive">
              <Table size="sm" hover className="align-middle mb-0">
                <thead className="thead-sm text-uppercase fs-xxs table-light">
                  <tr>
                    <th>Kiosk</th>
                    <th>Location</th>
                    <th>Timestamp</th>
                    <th>Transaction ID</th>
                    <th>Adjustment Type</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 && (
                    <tr><td colSpan={8} className="text-center text-muted py-4">No transactions found.</td></tr>
                  )}
                  {transactions.map((row) => (
                    <tr key={row.id}>
                      <td>{row.kiosk_terminal}</td>
                      <td>{row.location}</td>
                      <td>{row.create_date}</td>
                      <td>{row.transaction_id}</td>
                      <td>{row.trans_type}</td>
                      <td>{row.description}</td>
                      <td>{money(row.amount)}</td>
                      <td>{row.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </CardBody>
      </Card>

      <AdjustmentModal
        show={showAdjustment}
        onHide={() => setShowAdjustment(false)}
        terminal={terminal}
        context={context}
        onSaved={load}
      />
    </>
  )
}

export default DetailView
