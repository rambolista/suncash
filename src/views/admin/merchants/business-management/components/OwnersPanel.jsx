import { useState } from 'react'
import { Button, Card, Table } from 'react-bootstrap'
import Icon from '@/components/wrappers/Icon'
import OwnerFormModal from './OwnerFormModal'

const OwnersPanel = ({ merchantId, owners, canEdit, onSaved }) => {
  const [modalOwner, setModalOwner] = useState(undefined)
  const [showModal, setShowModal] = useState(false)

  const openAdd = () => { setModalOwner(null); setShowModal(true) }
  const openEdit = (owner) => { setModalOwner(owner); setShowModal(true) }

  return (
    <Card>
      <Card.Header className="d-flex align-items-center justify-content-between">
        <div>
          <h5 className="mb-1">Owners / Directors</h5>
          <p className="text-muted mb-0 small">Executive officers, directors, and beneficial owners declared for this business.</p>
        </div>
        {canEdit && (
          <Button size="sm" onClick={openAdd}><Icon icon="plus" className="me-1" /> Add Owner</Button>
        )}
      </Card.Header>
      <Card.Body>
        <div className="table-responsive">
          <Table className="align-middle mb-0">
            <thead className="thead-sm text-uppercase fs-xxs">
              <tr>
                <th>Name</th>
                <th>DOB</th>
                <th>Mobile</th>
                <th>Position</th>
                <th>ID Type / Number</th>
                <th>Signatory Rights</th>
                {canEdit && <th className="text-end">Action</th>}
              </tr>
            </thead>
            <tbody>
              {owners.map((owner) => (
                <tr key={owner.id}>
                  <td>{owner.owner_name}</td>
                  <td className="text-nowrap">{owner.dob}</td>
                  <td>{owner.mobile_number}</td>
                  <td>{owner.position_level}</td>
                  <td>{owner.id_type} / {owner.id_number}</td>
                  <td>{owner.signatory_rights || '—'}</td>
                  {canEdit && (
                    <td className="text-end">
                      <Button variant="light" size="sm" className="btn-icon rounded-circle" title="Edit" onClick={() => openEdit(owner)}>
                        <Icon icon="edit" className="fs-lg" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
              {!owners.length && (
                <tr><td colSpan={canEdit ? 7 : 6} className="text-center text-muted py-4">No owners declared yet.</td></tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card.Body>

      <OwnerFormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        merchantId={merchantId}
        owner={modalOwner}
        onSaved={onSaved}
      />
    </Card>
  )
}

export default OwnersPanel
