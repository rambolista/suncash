import { useNotificationContext } from '@/context/useNotificationContext'
import useCurrentUser from '@/hooks/useCurrentUser'
import ApiService from '@/services/ApiService'
import { setStoredCurrentUser } from '@/utils/currentUser'
import { isScreenLocked, unlockScreen } from '@/utils/lockScreen'
import { useState } from 'react'
import { Alert, Button, Form } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router'

const getError = (error, field) =>
  error?.errors?.[field]?.[0] ?? error?.message ?? 'The request could not be completed.'

const PinForm = () => {
  const navigate = useNavigate()
  const currentUser = useCurrentUser()
  const { showNotification } = useNotificationContext()
  const locked = isScreenLocked()
  const [submitting, setSubmitting] = useState(false)
  const [values, setValues] = useState({ current_password: '', pin: '', pin_confirmation: '' })

  const updateValue = (event) => {
    const { name, value } = event.target
    if (name !== 'current_password' && !/^\d{0,6}$/.test(value)) return
    setValues((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      if (locked) {
        await ApiService.verifyPin(values.pin)
        navigate(unlockScreen(), { replace: true })
        return
      }

      const response = await ApiService.updatePin(values.current_password, values.pin, values.pin_confirmation)
      setStoredCurrentUser({ ...currentUser, has_pin: response.has_pin })
      showNotification({ title: 'PIN updated', message: response.message, variant: 'success' })
      navigate('/', { replace: true })
    } catch (error) {
      const field = error?.errors?.current_password ? 'current_password' : 'pin'
      showNotification({ title: 'PIN request failed', message: getError(error, field), variant: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  if (locked && !currentUser?.has_pin) {
    return (
      <Alert variant="warning">
        You have not created a PIN. <Link to="/auth/lock-screen">Unlock with your password</Link>.
      </Alert>
    )
  }

  return (
    <Form onSubmit={handleSubmit}>
      {!locked && (
        <Form.Group className="mb-3">
          <Form.Label>Current password</Form.Label>
          <Form.Control name="current_password" type="password" value={values.current_password} onChange={updateValue} required />
        </Form.Group>
      )}
      <Form.Group className="mb-3">
        <Form.Label>{locked ? 'PIN' : 'New PIN'}</Form.Label>
        <Form.Control
          name="pin"
          type="password"
          inputMode="numeric"
          pattern="\d{4,6}"
          minLength={4}
          maxLength={6}
          value={values.pin}
          onChange={updateValue}
          autoFocus
          required
        />
        <Form.Text>Use 4 to 6 digits.</Form.Text>
      </Form.Group>
      {!locked && (
        <Form.Group className="mb-3">
          <Form.Label>Confirm PIN</Form.Label>
          <Form.Control
            name="pin_confirmation"
            type="password"
            inputMode="numeric"
            pattern="\d{4,6}"
            minLength={4}
            maxLength={6}
            value={values.pin_confirmation}
            onChange={updateValue}
            required
          />
        </Form.Group>
      )}
      <div className="d-grid">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : locked ? 'Unlock' : currentUser?.has_pin ? 'Change PIN' : 'Create PIN'}
        </Button>
      </div>
    </Form>
  )
}

export default PinForm
