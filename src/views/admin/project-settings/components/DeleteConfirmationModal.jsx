import { Button, Modal } from 'react-bootstrap'

const DeleteConfirmationModal = ({ show, title = 'Delete item?', message, deleting, onHide, onConfirm }) => (
  <Modal show={show} onHide={onHide} centered>
    <Modal.Header closeButton>
      <Modal.Title>{title}</Modal.Title>
    </Modal.Header>
    <Modal.Body>{message}</Modal.Body>
    <Modal.Footer>
      <Button variant="light" onClick={onHide} disabled={deleting}>Cancel</Button>
      <Button variant="danger" onClick={onConfirm} disabled={deleting}>
        {deleting ? 'Deleting...' : 'Delete'}
      </Button>
    </Modal.Footer>
  </Modal>
)

export default DeleteConfirmationModal
