import { useEffect, useState } from 'react'
import { Button, Form, Modal } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import LoadingState from '@/components/LoadingState'

/** "Product Profile" — view and fully replace which modules a terminal has enabled (can also remove). */
const ProductProfileModal = ({ show, onHide, terminal, onSaved }) => {
  const { showNotification } = useNotificationContext()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [modules, setModules] = useState([])
  const [selected, setSelected] = useState([])

  useEffect(() => {
    if (!show || !terminal) return
    setLoading(true)
    ApiService.getKioskProductProfileTerminalModules(terminal.id)
      .then((data) => {
        const list = data?.modules || []
        setModules(list)
        setSelected(list.filter((m) => m.included).map((m) => m.id))
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load product profile.', variant: 'danger' }))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, terminal])

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]))
  }

  const toggleAll = (checked) => {
    setSelected(checked ? modules.map((m) => m.id) : [])
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await ApiService.replaceKioskProductProfileServices(terminal.id, selected)
      showNotification({ title: 'Success', message: 'Product profile has been updated.', variant: 'success' })
      onSaved?.()
      onHide()
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to update product profile.', variant: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Product Profile{terminal ? ` — ${terminal.name}` : ''}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? <LoadingState message="Loading product profile..." /> : (
          <>
            <Form.Check
              type="checkbox"
              id="select-all-modules"
              label="Select All"
              className="mb-2 fw-semibold"
              checked={modules.length > 0 && selected.length === modules.length}
              onChange={(e) => toggleAll(e.target.checked)}
            />
            <div className="d-flex flex-column gap-2">
              {modules.map((module) => (
                <Form.Check
                  key={module.id}
                  type="checkbox"
                  id={`product-${module.id}`}
                  label={module.description}
                  checked={selected.includes(module.id)}
                  onChange={() => toggle(module.id)}
                />
              ))}
            </div>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={submitting}>Close</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={submitting || loading}>
          {submitting ? 'Saving...' : 'Apply Changes'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ProductProfileModal
