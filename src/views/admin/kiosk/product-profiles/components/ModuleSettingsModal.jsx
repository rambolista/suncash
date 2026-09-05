import { useEffect, useState } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import LoadingState from '@/components/LoadingState'

/** "Product Profile Setting" — globally enable/disable a module for every kiosk terminal. */
const ModuleSettingsModal = ({ show, onHide, canEdit, onSaved }) => {
  const { showNotification } = useNotificationContext()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [modules, setModules] = useState([])
  const [activeIds, setActiveIds] = useState([])

  useEffect(() => {
    if (!show) return
    setLoading(true)
    ApiService.getKioskProductProfiles()
      .then((data) => {
        const list = data?.modules || []
        setModules(list)
        setActiveIds(list.filter((m) => m.status === 'ACTIVE').map((m) => m.id))
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load modules.', variant: 'danger' }))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show])

  const toggle = (id) => {
    setActiveIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]))
  }

  const handleSubmit = async () => {
    const originalActiveIds = modules.filter((m) => m.status === 'ACTIVE').map((m) => m.id)
    const changed = modules.filter((m) => originalActiveIds.includes(m.id) !== activeIds.includes(m.id))
    if (changed.length === 0) {
      onHide()
      return
    }

    setSubmitting(true)
    try {
      await Promise.all(changed.map((m) => ApiService.updateKioskModuleStatus(m.id, activeIds.includes(m.id) ? 'ACTIVE' : 'INACTIVE')))
      showNotification({ title: 'Success', message: 'Module changes have been applied.', variant: 'success' })
      onSaved?.()
      onHide()
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to update modules.', variant: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Product Profile Setting</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!canEdit && (
          <Alert variant="secondary" className="py-2 small mb-3">
            You have view-only access to this setting.
          </Alert>
        )}
        {loading ? <LoadingState message="Loading modules..." /> : (
          <div className="d-flex flex-column gap-2">
            {modules.map((module) => (
              <Form.Check
                key={module.id}
                type="checkbox"
                id={`module-${module.id}`}
                label={module.description}
                checked={activeIds.includes(module.id)}
                disabled={!canEdit}
                onChange={() => toggle(module.id)}
              />
            ))}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={submitting}>Close</Button>
        {canEdit && (
          <Button variant="primary" onClick={handleSubmit} disabled={submitting || loading}>
            {submitting ? 'Saving...' : 'Apply Changes'}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  )
}

export default ModuleSettingsModal
