import { Modal } from 'react-bootstrap'
import EzpayAccessPanel from '../../registration/components/manage/EzpayAccessPanel'

const EzpayAccessModal = ({ show, onHide, merchant, editable }) => (
  <Modal show={show} onHide={onHide} centered>
    <Modal.Header closeButton>
      <Modal.Title>Smartpay Permission — {merchant?.dba_name || merchant?.legal_name}</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <EzpayAccessPanel merchant={merchant} editable={editable} />
    </Modal.Body>
  </Modal>
)

export default EzpayAccessModal
