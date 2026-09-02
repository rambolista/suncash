import { Button, Col, Modal, Row, Table } from 'react-bootstrap'

const money = (value) => `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const DENOMS = [1, 2, 5, 10, 20, 50, 100]

const DenomTable = ({ title, currencyPrefix, details, totalQty, totalAmount }) => (
  <Col md={6}>
    <h6 className="mb-2">{title}</h6>
    <Table size="sm" bordered className="mb-2">
      <thead>
        <tr>
          <th>Denomination</th>
          <th className="text-end">Quantity</th>
        </tr>
      </thead>
      <tbody>
        {DENOMS.map((denom) => (
          <tr key={denom}>
            <td>{currencyPrefix}{denom}</td>
            <td className="text-end">{details?.[`${currencyPrefix.toLowerCase()}${denom}`] ?? 0}</td>
          </tr>
        ))}
      </tbody>
    </Table>
    <div className="d-flex justify-content-between small fw-semibold px-1">
      <span>Total Quantity: {totalQty ?? 0}</span>
      <span>Total Amount: {money(totalAmount)}</span>
    </div>
  </Col>
)

const ZoutDetailsModal = ({ show, onHide, details }) => (
  <Modal show={show} onHide={onHide} centered size="lg">
    <Modal.Header closeButton>
      <Modal.Title>Zout Settlement Details</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      {details && (
        <>
          <Row className="g-3 mb-3">
            <Col md={4}><div className="text-muted small">Kiosk ID</div><div className="fw-semibold">{details.kiosk_id || '—'}</div></Col>
            <Col md={4}><div className="text-muted small">Kiosk Location</div><div className="fw-semibold">{details.location || '—'}</div></Col>
            <Col md={4}><div className="text-muted small">Date</div><div className="fw-semibold">{details.date || '—'}</div></Col>
            <Col md={4}><div className="text-muted small">Settlement No</div><div className="fw-semibold">{details.settlement_no || '—'}</div></Col>
            <Col md={4}><div className="text-muted small">User</div><div className="fw-semibold">{details.user || '—'}</div></Col>
            <Col md={4}><div className="text-muted small">Previous Settlement</div><div className="fw-semibold">{details.previous_settlement || '—'}</div></Col>
            <Col md={4}><div className="text-muted small">Total Transactions</div><div className="fw-semibold">{details.total_transactions ?? 0}</div></Col>
          </Row>

          <Row className="g-3">
            <DenomTable title="USD Denominations" currencyPrefix="usd" details={details} totalQty={details.total_qty_usd} totalAmount={details.total_amount_usd} />
            <DenomTable title="BSD Denominations" currencyPrefix="bsd" details={details} totalQty={details.total_qty_bsd} totalAmount={details.total_amount_bsd} />
          </Row>
        </>
      )}
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onHide}>Back</Button>
    </Modal.Footer>
  </Modal>
)

export default ZoutDetailsModal
