import { Button, Modal } from 'react-bootstrap'

const DeleteCustomerModal = ({ show, onHide, onConfirm, customer }) => (
  <Modal centered show={show} onHide={onHide}>
    <Modal.Header closeButton>
      <Modal.Title>Delete customer</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      Are you sure you want to delete <strong>{customer?.name}</strong> ({customer?.email})?
      <p className="text-danger small mt-2 mb-0">This action cannot be undone.</p>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onHide}>Cancel</Button>
      <Button variant="danger" onClick={onConfirm}>Delete</Button>
    </Modal.Footer>
  </Modal>
)

export default DeleteCustomerModal
