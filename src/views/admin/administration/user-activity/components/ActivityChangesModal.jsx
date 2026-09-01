import { Modal, Table } from 'react-bootstrap'

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return String(value)
}

const ActivityChangesModal = ({ show, onHide, entry }) => {
  const changes = entry?.changes && typeof entry.changes === 'object' ? Object.entries(entry.changes) : []

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Activity Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-1"><strong>{entry?.actor_name}</strong> {entry?.description}</p>
        <p className="text-muted small mb-3">{entry?.module} {entry?.auditable_id ? `#${entry.auditable_id}` : ''}</p>
        {changes.length > 0 ? (
          <Table size="sm" bordered className="mb-0">
            <thead>
              <tr>
                <th>Field</th>
                <th>From</th>
                <th>To</th>
              </tr>
            </thead>
            <tbody>
              {changes.map(([field, value]) => (
                <tr key={field}>
                  <td className="text-nowrap fw-medium">{field}</td>
                  <td className="text-muted">{formatValue(value?.from)}</td>
                  <td>{formatValue(value?.to)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <p className="text-muted small mb-0">No field-level changes recorded for this entry.</p>
        )}
      </Modal.Body>
    </Modal>
  )
}

export default ActivityChangesModal
