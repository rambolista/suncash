import { useEffect, useState } from 'react'
import { Button, Table } from 'react-bootstrap'
import Icon from '@/components/wrappers/Icon'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import PromoItemModal from './PromoItemModal'

const statusBadgeClass = (status) => {
  switch (status) {
    case 'ACTIVE': return 'bg-success-subtle text-success'
    case 'USED': return 'bg-secondary-subtle text-secondary'
    default: return 'bg-secondary-subtle text-secondary'
  }
}

const PhysicalItemsTab = ({ editable }) => {
  const { showNotification } = useNotificationContext()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalItem, setModalItem] = useState(undefined)
  const [showModal, setShowModal] = useState(false)

  const load = () => {
    setLoading(true)
    ApiService.getPromoItems()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load promo items.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openAdd = () => { setModalItem(null); setShowModal(true) }
  const openEdit = (item) => { setModalItem(item); setShowModal(true) }

  const handleDelete = async (item) => {
    try {
      await ApiService.deletePromoItem(item.id)
      showNotification({ title: 'Success', message: 'Promo item removed successfully.', variant: 'success' })
      load()
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to remove promo item.', variant: 'danger' })
    }
  }

  if (loading) return <LoadingState />

  return (
    <div>
      {editable && (
        <div className="d-flex justify-content-end mb-3">
          <Button onClick={openAdd}><Icon icon="plus" className="me-1" /> Add Promo Item</Button>
        </div>
      )}
      <div className="table-responsive">
        <Table className="align-middle mb-0">
          <thead className="thead-sm text-uppercase fs-xxs">
            <tr>
              <th>Image</th>
              <th>Branch</th>
              <th>Merchant</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Draw Type</th>
              <th>Draw Date</th>
              <th>Status</th>
              {editable && <th className="text-end">Action</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.item_description} style={{ width: 40, height: 40, objectFit: 'cover' }} className="rounded border" />
                  ) : <span className="text-muted">—</span>}
                </td>
                <td className="text-nowrap">{item.branch_name || '—'}</td>
                <td className="text-nowrap">{item.merchant_name || '—'}</td>
                <td>{item.item_description}</td>
                <td>{item.remaining_quantity}/{item.quantity}</td>
                <td className="text-nowrap">{item.draw_type}</td>
                <td className="text-nowrap">{item.draw_date || '—'}</td>
                <td><span className={`badge ${statusBadgeClass(item.status)} badge-label`}>{item.status}</span></td>
                {editable && (
                  <td className="text-end">
                    <div className="d-flex gap-1 justify-content-end">
                      <Button variant="light" size="sm" className="btn-icon rounded-circle" title="Edit" onClick={() => openEdit(item)}>
                        <Icon icon="edit" className="fs-lg" />
                      </Button>
                      <Button variant="light" size="sm" className="btn-icon rounded-circle" title="Remove" onClick={() => handleDelete(item)}>
                        <Icon icon="trash" className="fs-lg text-danger" />
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {!items.length && (
              <tr><td colSpan={editable ? 9 : 8} className="text-center text-muted py-4">No promo items found.</td></tr>
            )}
          </tbody>
        </Table>
      </div>

      <PromoItemModal show={showModal} onHide={() => setShowModal(false)} item={modalItem} onSaved={load} />
    </div>
  )
}

export default PhysicalItemsTab
