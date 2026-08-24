import { useNotificationContext } from '@/context/useNotificationContext'
import ApiService from '@/services/ApiService'
import { unlockScreen } from '@/utils/lockScreen'
import { useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router'

const LockScreenForm = () => {
  const navigate = useNavigate()
  const { showNotification } = useNotificationContext()
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      await ApiService.unlockScreen(password)
      navigate(unlockScreen(), { replace: true })
    } catch (error) {
      showNotification({
        title: 'Unlock failed',
        message: error?.errors?.password?.[0] ?? error?.message ?? 'Unable to unlock the screen.',
        variant: 'danger',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>Password</Form.Label>
        <Form.Control
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          autoFocus
          required
        />
      </Form.Group>
      <div className="d-grid gap-2">
        <Button variant="primary" type="submit" className="fw-semibold py-2" disabled={submitting}>
          {submitting ? 'Unlocking...' : 'Unlock'}
        </Button>
        <Button as={Link} to="/auth/login-pin" variant="link">
          Unlock with PIN
        </Button>
      </div>
    </Form>
  )
}

export default LockScreenForm
