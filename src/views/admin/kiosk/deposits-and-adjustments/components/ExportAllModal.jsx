import { useState } from 'react'
import { Button, Col, Form, Modal, Row } from 'react-bootstrap'
import Icon from '@/components/wrappers/Icon'

const todayValue = () => new Date().toISOString().slice(0, 10)

const ExportAllModal = ({ show, onHide, onExport }) => {
  const [dateFrom, setDateFrom] = useState(todayValue())
  const [dateTo, setDateTo] = useState(todayValue())
  const [transType, setTransType] = useState('')
  const [exporting, setExporting] = useState('')

  const handleExport = async (format) => {
    setExporting(format)
    try {
      await onExport({ date_from: dateFrom, date_to: dateTo, trans_type: transType || null }, format)
    } finally {
      setExporting('')
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Kiosk Deposits and Adjustments</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="g-3">
          <Col md={6}>
            <Form.Label>From</Form.Label>
            <Form.Control type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </Col>
          <Col md={6}>
            <Form.Label>To</Form.Label>
            <Form.Control type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </Col>
          <Col md={12}>
            <Form.Label>Adjustment Type</Form.Label>
            <Form.Select value={transType} onChange={(e) => setTransType(e.target.value)}>
              <option value="">Select an Adjustment Type</option>
              <option value="debit">Debit</option>
              <option value="credit">Credit</option>
              <option value="deposit">Deposit</option>
            </Form.Select>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={exporting !== ''}>Close</Button>
        <Button variant="outline-secondary" disabled={exporting !== ''} onClick={() => handleExport('pdf')}>
          <Icon icon="file-type-pdf" className="me-1" /> {exporting === 'pdf' ? 'Exporting...' : 'Export to PDF'}
        </Button>
        <Button variant="primary" disabled={exporting !== ''} onClick={() => handleExport('csv')}>
          <Icon icon="file-type-xls" className="me-1" /> {exporting === 'csv' ? 'Exporting...' : 'Export to Excel'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ExportAllModal
