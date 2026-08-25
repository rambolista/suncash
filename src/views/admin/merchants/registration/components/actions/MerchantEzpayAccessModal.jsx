import { useEffect, useState } from 'react'
import { Button, Form, Modal, Spinner } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const MerchantEzpayAccessModal = ({ show, onHide, merchant }) => {
  const { showNotification } = useNotificationContext()
  const [options, setOptions] = useState({})
  const [granted, setGranted] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!show || !merchant) return

    let active = true
    setLoading(true)

    ApiService.getMerchantEzpayAccess(merchant.id)
      .then((data) => {
        if (!active) return
        setOptions(data?.options || {})
        setGranted(Array.isArray(data?.granted) ? data.granted : [])
      })
      .catch((err) => {
        if (active) showNotification({ title: 'Failed', message: err?.message || 'Failed to load Ezpay access.', variant: 'danger' })
      })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, merchant])

  const toggle = (key) => {
    setGranted((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]))
  }

  const handleSave = async () => {
    setSubmitting(true)
    try {
      await ApiService.updateMerchantEzpayAccess(merchant.id, granted)
      showNotification({ title: 'Success', message: 'Ezpay access updated successfully.', variant: 'success' })
      onHide()
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to update Ezpay access.', variant: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Ezpay Access — {merchant?.dba_name || merchant?.legal_name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-4"><Spinner size="sm" /></div>
        ) : (
          <>
            <p className="text-muted small">Select the Ezpay card transaction types this merchant is allowed to perform.</p>
            {Object.entries(options).map(([key, label]) => (
              <Form.Check
                key={key}
                type="checkbox"
                id={`ezpay-${key}`}
                label={label}
                checked={granted.includes(key)}
                onChange={() => toggle(key)}
                className="mb-2"
              />
            ))}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={submitting}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={submitting || loading}>
          {submitting ? 'Saving...' : 'Save changes'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default MerchantEzpayAccessModal
