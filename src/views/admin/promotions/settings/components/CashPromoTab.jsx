import { useEffect, useState } from 'react'
import { Button, Table } from 'react-bootstrap'
import Icon from '@/components/wrappers/Icon'
import LoadingState from '@/components/LoadingState'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import CashPromoModal from './CashPromoModal'

const statusBadgeClass = (status) => {
  switch (status) {
    case 'ACTIVE': return 'bg-success-subtle text-success'
    case 'USED': return 'bg-secondary-subtle text-secondary'
    default: return 'bg-secondary-subtle text-secondary'
  }
}

const DRAW_TYPE_LABELS = {
  weekly_draw: 'WEEKLY DRAW',
  instant_prize: 'INSTANT PRIZE',
}

const resolveTargetGroup = (setting, islands) => {
  const islandName = (id) => islands.find((island) => island.id === Number(id))?.name || `Island #${id}`

  if (setting.target_group_type === 'island' || setting.target_group_type === 'multiple') {
    const ids = String(setting.target_group || '').split(',').filter(Boolean)
    return ids.map(islandName).join(', ') || '—'
  }

  if (setting.target_group_type === 'percentage') {
    const totalQuantity = Number(setting.quantity) || 0
    return String(setting.target_group || '').split(',').filter(Boolean)
      .map((pair) => {
        const [islandId, quantity] = pair.split('-')
        if (Number(islandId) === 0) return null
        const pct = totalQuantity > 0 ? Math.round((Number(quantity) / totalQuantity) * 100) : 0
        return `${islandName(islandId)} (${pct}%)`
      })
      .filter(Boolean)
      .join(', ') || '—'
  }

  return 'All Islands'
}

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
      <div className="table-responsive">
        <Table className="align-middle mb-0">
          <thead className="thead-sm text-uppercase fs-xxs">
            <tr>
              <th>ID</th>
              <th>Created</th>
              <th>Prize</th>
              <th>Qty</th>
              <th>Description</th>
              <th>Draw Type</th>
              <th>Target Group</th>
              <th>Draw Date</th>
              <th>Status</th>
              {editable && <th className="text-end">Action</th>}
            </tr>
          </thead>
          <tbody>
            {settings.map((setting) => (
              <tr key={setting.id}>
                <td>{setting.id}</td>
                <td className="text-nowrap">{setting.created_date}</td>
                <td>${Number(setting.price).toLocaleString()}</td>
                <td>{setting.remaining_quantity}/{setting.quantity}</td>
                <td>{setting.description}</td>
                <td className="text-nowrap">{DRAW_TYPE_LABELS[setting.draw_type] || setting.draw_type}</td>
                <td>{resolveTargetGroup(setting, islands)}</td>
                <td className="text-nowrap">{setting.draw_date || '—'}</td>
                <td><span className={`badge ${statusBadgeClass(setting.status)} badge-label`}>{setting.status}</span></td>
                {editable && (
                  <td className="text-end">
                    <div className="d-flex gap-1 justify-content-end">
                      <Button variant="light" size="sm" className="btn-icon rounded-circle" title="Edit" onClick={() => openEdit(setting)}>
                        <Icon icon="edit" className="fs-lg" />
                      </Button>
                      <Button variant="light" size="sm" className="btn-icon rounded-circle" title="Remove" onClick={() => handleDelete(setting)}>
                        <Icon icon="trash" className="fs-lg text-danger" />
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {!settings.length && (
              <tr><td colSpan={editable ? 10 : 9} className="text-center text-muted py-4">No cash promos found.</td></tr>
            )}
          </tbody>
        </Table>
      </div>

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
