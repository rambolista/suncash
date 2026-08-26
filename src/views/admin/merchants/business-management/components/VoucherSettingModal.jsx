import { useEffect, useState } from 'react'
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const BUILT_IN = ['s', 'u']

const VoucherSettingModal = ({ show, onHide, merchant, onDone }) => {
  const { showNotification } = useNotificationContext()
  const [options, setOptions] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!show || !merchant) return
    setLoading(true)
    setError('')
    ApiService.getBusinessVoucherSettings(merchant.id)
      .then((data) => {
        setOptions(Array.isArray(data?.options) ? data.options : [])
        setSelected(Array.isArray(data?.selected) ? data.selected : [])
      })
      .catch((err) => setError(err?.message || 'Failed to load voucher settings.'))
      .finally(() => setLoading(false))
  }, [show, merchant])

  const toggle = (value) => {
    if (BUILT_IN.includes(value)) return
    setSelected((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
  }

  const handleSave = async () => {
    setSubmitting(true)
    setError('')
    try {
      const result = await ApiService.updateBusinessVoucherSettings(merchant.id, selected)
      showNotification({ title: 'Success', message: result?.message || 'Voucher setting updated successfully.', variant: 'success' })
      onDone?.()
      onHide()
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Voucher Setting</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" className="py-2 small mb-3">{error}</Alert>}
        {loading ? (
          <div className="text-center py-4"><Spinner size="sm" /></div>
        ) : (
          <>
            <p className="text-muted small">Select which voucher and gift-card products this merchant's checkout can sell. SunCash and Unibucks vouchers are always enabled.</p>
            {options.map((option) => (
              <Form.Check
                key={option.value}
                type="checkbox"
                id={`voucher-${option.value}`}
                label={option.label}
                checked={selected.includes(option.value)}
                onChange={() => toggle(option.value)}
                disabled={BUILT_IN.includes(option.value)}
                className="mb-2"
              />
            ))}
            {!options.length && <div className="text-muted text-center py-3">No voucher products available.</div>}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={submitting}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={submitting || loading}>
          {submitting ? 'Saving...' : 'Save'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default VoucherSettingModal
