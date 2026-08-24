import { Button, Modal } from 'react-bootstrap'

const DeleteRoleModal = ({ show, onHide, onConfirm, role }) => (
  <Modal centered show={show} onHide={onHide}>
    <Modal.Header closeButton>
      <Modal.Title>Delete role</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      Are you sure you want to delete the role <strong>{role?.name}</strong>?
      <p className="text-warning small mt-2 mb-0">
        This will remove the role from all assigned users.
      </p>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onHide}>Cancel</Button>
      <Button variant="danger" onClick={onConfirm}>Delete</Button>
    </Modal.Footer>
  </Modal>
)

export default DeleteRoleModal
