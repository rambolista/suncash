import { useNotificationContext } from '@/context/useNotificationContext'
import { useAuth } from '@/hooks/useAuth'
import ApiService from '@/services/ApiService'
import { removeToken } from '@/services/HttpService'
import { clearStoredCurrentUser } from '@/utils/currentUser'
import { clearScreenLock } from '@/utils/lockScreen'
import { useState } from 'react'
import { Alert, Button, Form } from 'react-bootstrap'
import { useNavigate } from 'react-router'

const DeleteAccountForm = () => {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { showNotification } = useNotificationContext()
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      const response = await ApiService.deleteAccount(password)
      clearScreenLock()
      removeToken()
      clearStoredCurrentUser()
      showNotification({ title: 'Account deleted', message: response.message, variant: 'success' })
      navigate('/auth/sign-in', { replace: true })
    } catch (error) {
      showNotification({
        title: 'Deletion failed',
        message: error?.errors?.current_password?.[0] ?? error?.errors?.status?.[0] ?? error?.message ?? 'Unable to delete the account.',
        variant: 'danger',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Form onSubmit={handleSubmit} className="text-start">
      <Alert variant="danger">
        This permanently deletes your account and associated data. This action cannot be undone.
      </Alert>
      <Form.Group className="mb-3">
        <Form.Label>Current password</Form.Label>
        <Form.Control
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
      </Form.Group>
      <div className="d-grid gap-2">
        <Button variant="danger" type="submit" disabled={submitting}>
          {submitting ? 'Deleting account...' : 'Permanently Delete Account'}
        </Button>
        <Button variant="link" type="button" onClick={logout} disabled={submitting}>
          Log out instead
        </Button>
      </div>
    </Form>
  )
}

export default DeleteAccountForm
