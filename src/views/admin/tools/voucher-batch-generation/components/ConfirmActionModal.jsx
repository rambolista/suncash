import { Button, Modal } from 'react-bootstrap'

/** Generic yes/no confirmation modal shared by Process / Resend / Cancel row actions on this page. */
const ConfirmActionModal = ({ show, onHide, onConfirm, title, body, confirmLabel = 'Confirm', confirmVariant = 'primary', submitting }) => (
  <Modal centered show={show} onHide={onHide}>
    <Modal.Header closeButton>
      <Modal.Title>{title}</Modal.Title>
    </Modal.Header>
    <Modal.Body>{body}</Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onHide} disabled={submitting}>Cancel</Button>
      <Button variant={confirmVariant} onClick={onConfirm} disabled={submitting}>
        {submitting ? 'Please wait...' : confirmLabel}
      </Button>
    </Modal.Footer>
  </Modal>
)

export default ConfirmActionModal
