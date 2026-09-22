import { useEffect, useState } from 'react'
import { Button } from 'react-bootstrap'
import Icon from '@/components/wrappers/Icon'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import PromoItemModal from './PromoItemModal'
import PhysicalItemsTable from './PhysicalItemsTable'

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
      <PhysicalItemsTable data={items} canEdit={editable} onEdit={openEdit} onDelete={handleDelete} />

      <PromoItemModal show={showModal} onHide={() => setShowModal(false)} item={modalItem} onSaved={load} />
    </div>
  )
}

export default PhysicalItemsTab
