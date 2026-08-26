import { Modal } from 'react-bootstrap'
import ServicesPermissionPanel from '../../registration/components/manage/ServicesPermissionPanel'

const ServicesPermissionModal = ({ show, onHide, merchant, editable }) => (
  <Modal show={show} onHide={onHide} centered>
    <Modal.Header closeButton>
      <Modal.Title>Services Permission — {merchant?.dba_name || merchant?.legal_name}</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <ServicesPermissionPanel merchant={merchant} editable={editable} />
    </Modal.Body>
  </Modal>
)

export default ServicesPermissionModal
