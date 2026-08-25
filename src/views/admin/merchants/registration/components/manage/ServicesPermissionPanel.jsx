import { useEffect, useState } from 'react'
import { Button, Col, Form, Row, Spinner } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const ServicesPermissionPanel = ({ merchant, editable }) => {
  const { showNotification } = useNotificationContext()
  const [services, setServices] = useState([])
  const [granted, setGranted] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!merchant) return

    let active = true
    setLoading(true)

    ApiService.getMerchantServices(merchant.id)
      .then((data) => {
        if (!active) return
        const list = Array.isArray(data) ? data : []
        setServices(list)
        setGranted(list.filter((service) => service.granted).map((service) => service.id))
      })
      .catch((err) => {
        if (active) showNotification({ title: 'Failed', message: err?.message || 'Failed to load services.', variant: 'danger' })
      })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchant])

  const toggle = (id) => {
    if (!editable) return
    setGranted((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const handleSave = async () => {
    setSubmitting(true)
    try {
      await ApiService.updateMerchantServices(merchant.id, granted)
      showNotification({ title: 'Success', message: 'Services permission updated successfully.', variant: 'success' })
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to update services permission.', variant: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="text-center py-4"><Spinner size="sm" /></div>

  return (
    <div>
      <p className="text-muted small">Select the platform services this merchant is granted access to.</p>
      <Row className="g-2">
        {services.map((service) => (
          <Col md={6} key={service.id}>
            <Form.Check
              type="checkbox"
              id={`service-${service.id}`}
              label={service.name}
              checked={granted.includes(service.id)}
              onChange={() => toggle(service.id)}
              disabled={!editable}
            />
          </Col>
        ))}
        {!services.length && <Col xs={12} className="text-muted text-center py-3">No services available.</Col>}
      </Row>
      {editable && (
        <div className="d-flex justify-content-end mt-3">
          <Button variant="primary" size="sm" onClick={handleSave} disabled={submitting}>
            {submitting ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      )}
    </div>
  )
}

export default ServicesPermissionPanel
