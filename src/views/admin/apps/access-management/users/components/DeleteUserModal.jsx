import { Button, Modal } from 'react-bootstrap'

const DeleteUserModal = ({ show, onHide, onConfirm, user }) => (
  <Modal centered show={show} onHide={onHide}>
    <Modal.Header closeButton>
      <Modal.Title>Delete user</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      Are you sure you want to delete <strong>{user?.name}</strong> ({user?.email})?
      <p className="text-danger small mt-2 mb-0">This action cannot be undone.</p>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onHide}>Cancel</Button>
      <Button variant="danger" onClick={onConfirm}>Delete</Button>
    </Modal.Footer>
  </Modal>
)

export default DeleteUserModal
