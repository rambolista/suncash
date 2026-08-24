import { Button, Modal } from 'react-bootstrap'

const DeleteMenuModal = ({ show, onHide, onConfirm, menu }) => (
  <Modal centered show={show} onHide={onHide}>
    <Modal.Header closeButton>
      <Modal.Title>Delete menu</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      Are you sure you want to delete <strong>{menu?.label}</strong>?
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onHide}>Cancel</Button>
      <Button variant="danger" onClick={onConfirm}>Delete</Button>
    </Modal.Footer>
  </Modal>
)

export default DeleteMenuModal
