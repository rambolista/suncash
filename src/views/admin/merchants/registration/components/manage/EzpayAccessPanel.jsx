import { useEffect, useState } from 'react'
import { Button, Form, Spinner } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const EzpayAccessPanel = ({ merchant, editable }) => {
  const { showNotification } = useNotificationContext()
  const [options, setOptions] = useState({})
  const [granted, setGranted] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!merchant) return

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
  }, [merchant])

  const toggle = (key) => {
    if (!editable) return
    setGranted((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]))
  }

  const handleSave = async () => {
    setSubmitting(true)
    try {
      await ApiService.updateMerchantEzpayAccess(merchant.id, granted)
      showNotification({ title: 'Success', message: 'Ezpay access updated successfully.', variant: 'success' })
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to update Ezpay access.', variant: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="text-center py-4"><Spinner size="sm" /></div>

  return (
    <div>
      <p className="text-muted small">Select the Ezpay card transaction types this merchant is allowed to perform.</p>
      {Object.entries(options).map(([key, label]) => (
        <Form.Check
          key={key}
          type="checkbox"
          id={`ezpay-${key}`}
          label={label}
          checked={granted.includes(key)}
          onChange={() => toggle(key)}
          disabled={!editable}
          className="mb-2"
        />
      ))}
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

export default EzpayAccessPanel
