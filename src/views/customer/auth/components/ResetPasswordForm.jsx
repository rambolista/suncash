import { useNotificationContext } from '@/context/useNotificationContext'
import useCustomerAuth from '@/hooks/useCustomerAuth'
import { useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import { useNavigate } from 'react-router'

const ResetPasswordForm = () => {
  const navigate = useNavigate()
  const { showNotification } = useNotificationContext()
  const { forgotPassword } = useCustomerAuth()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      const response = await forgotPassword(email)
      showNotification({
        title: 'Request sent',
        message: response,
        variant: 'success',
      })
      navigate('/customer/success-mail', { replace: true })
    } catch (error) {
      showNotification({
        title: 'Request failed',
        message: error?.errors?.email?.[0] ?? error?.message ?? 'Unable to send the password reset email.',
        variant: 'danger',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>
          Email address<span className="text-danger ms-1">*</span>
        </Form.Label>
        <Form.Control
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
      </Form.Group>
      <div className="d-grid">
        <Button variant="primary" type="submit" className="fw-semibold py-2" disabled={submitting}>
          {submitting ? 'Sending...' : 'Send Request'}
        </Button>
      </div>
    </Form>
  )
}

export default ResetPasswordForm
