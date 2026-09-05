import { useEffect, useState } from 'react'
import { Button, Form, Modal } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import LoadingState from '@/components/LoadingState'

/** "Services" — add modules the terminal doesn't already have enabled. */
const ServicesModal = ({ show, onHide, terminal, onSaved }) => {
  const { showNotification } = useNotificationContext()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [available, setAvailable] = useState([])
  const [selected, setSelected] = useState([])

  useEffect(() => {
    if (!show || !terminal) return
    setLoading(true)
    setSelected([])
    ApiService.getKioskProductProfileTerminalModules(terminal.id)
      .then((data) => setAvailable((data?.modules || []).filter((m) => !m.included)))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load services.', variant: 'danger' }))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, terminal])

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]))
  }

  const handleSubmit = async () => {
    if (selected.length === 0) {
      showNotification({ title: 'Failed', message: 'Please select at least one service to add.', variant: 'danger' })
      return
    }
    setSubmitting(true)
    try {
      await ApiService.addKioskProductProfileServices(terminal.id, selected)
      showNotification({ title: 'Success', message: 'Service(s) have been added.', variant: 'success' })
      onSaved?.()
      onHide()
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to add services.', variant: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Add Services{terminal ? ` — ${terminal.name}` : ''}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? <LoadingState message="Loading services..." /> : (
          available.length === 0 ? (
            <div className="text-center text-muted py-3">This terminal already has every available service enabled.</div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {available.map((module) => (
                <Form.Check
                  key={module.id}
                  type="checkbox"
                  id={`service-${module.id}`}
                  label={module.description}
                  checked={selected.includes(module.id)}
                  onChange={() => toggle(module.id)}
                />
              ))}
            </div>
          )
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={submitting}>Close</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={submitting || loading || available.length === 0}>
          {submitting ? 'Saving...' : 'Activate'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ServicesModal
