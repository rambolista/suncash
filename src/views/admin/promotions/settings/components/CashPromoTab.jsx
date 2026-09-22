import { useEffect, useState } from 'react'
import { Button } from 'react-bootstrap'
import Icon from '@/components/wrappers/Icon'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import CashPromoModal from './CashPromoModal'
import CashPromoTable from './CashPromoTable'

const CashPromoTab = ({ editable, islands }) => {
  const { showNotification } = useNotificationContext()
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalSetting, setModalSetting] = useState(undefined)
  const [showModal, setShowModal] = useState(false)

  const load = () => {
    setLoading(true)
    ApiService.getCashPromoSettings()
      .then((data) => setSettings(Array.isArray(data) ? data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load cash promos.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openAdd = () => { setModalSetting(null); setShowModal(true) }
  const openEdit = (setting) => { setModalSetting(setting); setShowModal(true) }

  const handleDelete = async (setting) => {
    try {
      await ApiService.deleteCashPromoSetting(setting.id)
      showNotification({ title: 'Success', message: 'Cash promo removed successfully.', variant: 'success' })
      load()
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to remove cash promo.', variant: 'danger' })
    }
  }

  if (loading) return <LoadingState />

  return (
    <div>
      {editable && (
        <div className="d-flex justify-content-end mb-3">
          <Button onClick={openAdd}><Icon icon="plus" className="me-1" /> Add Cash Promo</Button>
        </div>
      )}
      <CashPromoTable data={settings} islands={islands} canEdit={editable} onEdit={openEdit} onDelete={handleDelete} />

      <CashPromoModal
        show={showModal}
        onHide={() => setShowModal(false)}
        setting={modalSetting}
        islands={islands}
        onSaved={load}
      />
    </div>
  )
}

export default CashPromoTab
