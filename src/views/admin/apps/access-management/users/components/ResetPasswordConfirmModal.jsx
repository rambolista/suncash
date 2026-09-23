import { Button, Modal } from 'react-bootstrap'

const ResetPasswordConfirmModal = ({ show, onHide, onConfirm, user, submitting }) => (
  <Modal centered show={show} onHide={onHide}>
    <Modal.Header closeButton>
      <Modal.Title>Reset password</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      Send a password reset link to <strong>{user?.name}</strong> ({user?.email})?
      <p className="text-muted small mt-2 mb-0">They&apos;ll receive an e-mail with a link to set a new password.</p>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onHide} disabled={submitting}>Cancel</Button>
      <Button variant="primary" onClick={onConfirm} disabled={submitting}>
        {submitting ? 'Sending...' : 'Send Reset Link'}
      </Button>
    </Modal.Footer>
  </Modal>
)

export default ResetPasswordConfirmModal
