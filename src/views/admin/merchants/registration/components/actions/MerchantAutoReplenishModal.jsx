import { useEffect, useState } from 'react'
import { Button, Form, Modal, Spinner } from 'react-bootstrap'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const empty = { is_auto_replenish: false, amount: '', min_amount: '', remarks: '' }

const MerchantAutoReplenishModal = ({ show, onHide, merchant }) => {
  const { showNotification } = useNotificationContext()
  const [values, setValues] = useState(empty)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!show || !merchant) return

    let active = true
    setLoading(true)
    ApiService.getMerchantAutoReplenish(merchant.id)
      .then((data) => {
        if (!active || !data) return
        setValues({
          is_auto_replenish: !!data.is_auto_replenish,
          amount: data.amount || '',
          min_amount: data.min_amount || '',
          remarks: data.remarks || '',
        })
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load auto replenish settings.', variant: 'danger' }))
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, merchant])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})
    try {
      await ApiService.updateMerchantAutoReplenish(merchant.id, values)
      showNotification({ title: 'Success', message: 'Auto replenish settings saved successfully.', variant: 'success' })
      onHide()
    } catch (err) {
      setErrors(err?.errors ?? {})
      showNotification({ title: 'Failed', message: err?.message || 'Failed to save auto replenish settings.', variant: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Auto Replenish — {merchant?.dba_name || merchant?.legal_name}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Body>
          {loading ? (
            <div className="text-center py-4"><Spinner size="sm" /></div>
          ) : (
            <>
              <Form.Check
                type="switch"
                id="auto-replenish-toggle"
                label="Enable auto replenish"
                checked={values.is_auto_replenish}
                onChange={(e) => setValues((prev) => ({ ...prev, is_auto_replenish: e.target.checked }))}
                className="mb-3"
              />
              <Form.Group className="mb-3">
                <Form.Label>Top-up amount {values.is_auto_replenish && <span className="text-danger">*</span>}</Form.Label>
                <Form.Control
                  type="number" min="0" step="0.01" disabled={!values.is_auto_replenish}
                  value={values.amount} onChange={(e) => setValues((prev) => ({ ...prev, amount: e.target.value }))}
                  isInvalid={!!errors.amount}
                />
                <Form.Control.Feedback type="invalid">{errors.amount?.[0]}</Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Minimum balance threshold {values.is_auto_replenish && <span className="text-danger">*</span>}</Form.Label>
                <Form.Control
                  type="number" min="0" step="0.01" disabled={!values.is_auto_replenish}
                  value={values.min_amount} onChange={(e) => setValues((prev) => ({ ...prev, min_amount: e.target.value }))}
                  isInvalid={!!errors.min_amount}
                />
                <Form.Control.Feedback type="invalid">{errors.min_amount?.[0]}</Form.Control.Feedback>
                <Form.Text>When the prefund balance drops below this amount, it's topped up by the amount above.</Form.Text>
              </Form.Group>
              <Form.Group>
                <Form.Label>Remarks {values.is_auto_replenish && <span className="text-danger">*</span>}</Form.Label>
                <Form.Control
                  disabled={!values.is_auto_replenish}
                  value={values.remarks} onChange={(e) => setValues((prev) => ({ ...prev, remarks: e.target.value }))}
                  isInvalid={!!errors.remarks}
                />
                <Form.Control.Feedback type="invalid">{errors.remarks?.[0]}</Form.Control.Feedback>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={submitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={submitting || loading}>
            {submitting ? 'Saving...' : 'Save changes'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default MerchantAutoReplenishModal
