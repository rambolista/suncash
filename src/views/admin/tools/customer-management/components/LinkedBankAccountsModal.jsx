import { Col, Modal, Row } from 'react-bootstrap'

/** Legacy `myModalBanks` — shows the single bank account picked from the "Linked Bank Accounts" dropdown, not a full list. Read-only in legacy (no delete wired). */
const LinkedBankAccountsModal = ({ show, onHide, account }) => (
  <Modal show={show} onHide={onHide} centered>
    <Modal.Header closeButton>
      <Modal.Title>Customer Bank Details</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      {!account ? <p className="text-muted mb-0">No bank account selected.</p> : (
        <Row className="g-3">
          <Col md={6}><div className="text-muted small">Bank</div><div className="fw-semibold">{account.bank || '—'}</div></Col>
          <Col md={6}><div className="text-muted small">Branch</div><div className="fw-semibold">{account.branch || '—'}</div></Col>
          <Col md={6}><div className="text-muted small">Account Name</div><div className="fw-semibold">{account.account_name || '—'}</div></Col>
          <Col md={6}><div className="text-muted small">Account Number</div><div className="fw-semibold">{account.account_number || '—'}</div></Col>
          <Col md={6}><div className="text-muted small">Account Type</div><div className="fw-semibold">{account.account_type || '—'}</div></Col>
        </Row>
      )}
    </Modal.Body>
  </Modal>
)

export default LinkedBankAccountsModal
