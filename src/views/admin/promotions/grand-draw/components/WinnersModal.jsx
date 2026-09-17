import { Button, Modal } from 'react-bootstrap'

const WinnersModal = ({ show, onHide, winners }) => (
  <Modal show={show} onHide={onHide} centered>
    <Modal.Header closeButton>
      <Modal.Title>Grand Draw Winner{winners.length === 1 ? '' : 's'}</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      {winners.length === 0 ? (
        <p className="text-muted mb-0">No winner has been drawn yet.</p>
      ) : (
        <div className="d-flex flex-column gap-4">
          {winners.map((winner, index) => (
            <div key={`${winner.ticket_no}-${index}`} className="text-center">
              {winner.image_url && (
                <img src={winner.image_url} alt={winner.item_description} className="img-fluid rounded mb-3" style={{ maxHeight: 200 }} />
              )}
              <h5 className="mb-1">{winner.customer_name}</h5>
              <p className="text-muted mb-1">{winner.ticket_no}</p>
              <p className="mb-0 fw-medium">{winner.item_description}</p>
            </div>
          ))}
        </div>
      )}
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onHide}>Close</Button>
    </Modal.Footer>
  </Modal>
)

export default WinnersModal
