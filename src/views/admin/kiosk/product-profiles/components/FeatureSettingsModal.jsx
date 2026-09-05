import { useEffect, useState } from 'react'
import { Badge, Button, Modal, Table } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import LoadingState from '@/components/LoadingState'

/** "Kiosk Features Setting" — enable/disable individual kiosk feature toggles. */
const FeatureSettingsModal = ({ show, onHide, canEdit }) => {
  const { showNotification } = useNotificationContext()
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState([])
  const [savingId, setSavingId] = useState(null)

  const load = () => {
    setLoading(true)
    ApiService.getKioskFeatureSettings()
      .then((data) => setSettings(Array.isArray(data?.settings) ? data.settings : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load feature settings.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (show) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show])

  const handleToggle = async (setting) => {
    setSavingId(setting.id)
    try {
      await ApiService.updateKioskFeatureSetting(setting.id, !Number(setting.is_active))
      showNotification({ title: 'Success', message: 'Feature setting has been updated.', variant: 'success' })
      load()
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to update feature setting.', variant: 'danger' })
    } finally {
      setSavingId(null)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Kiosk Features Setting</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? <LoadingState message="Loading feature settings..." /> : (
          <Table responsive hover size="sm" className="align-middle mb-0">
            <thead className="thead-sm text-uppercase fs-xxs table-light">
              <tr>
                <th style={{ width: 50 }}>#</th>
                <th>Feature Name</th>
                <th>Status</th>
                {canEdit && <th className="text-center" style={{ width: 100 }}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {settings.length === 0 && (
                <tr><td colSpan={canEdit ? 4 : 3} className="text-center text-muted py-4">No feature settings found.</td></tr>
              )}
              {settings.map((setting, index) => {
                const isActive = Boolean(Number(setting.is_active))
                return (
                  <tr key={setting.id}>
                    <td>{index + 1}</td>
                    <td>
                      <div>{setting.name}</div>
                      {setting.description && <div className="small text-muted">{setting.description}</div>}
                    </td>
                    <td>
                      <Badge bg={isActive ? 'success-subtle' : 'danger-subtle'} className={isActive ? 'text-success' : 'text-danger'}>
                        {isActive ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </td>
                    {canEdit && (
                      <td className="text-center">
                        <Button
                          size="sm"
                          variant={isActive ? 'outline-warning' : 'outline-success'}
                          disabled={savingId === setting.id}
                          onClick={() => handleToggle(setting)}
                        >
                          {isActive ? 'Disable' : 'Enable'}
                        </Button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default FeatureSettingsModal
