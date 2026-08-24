import { useNotificationContext } from '@/context/useNotificationContext'
import useCustomerAuth from '@/hooks/useCustomerAuth'
import { useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import { useSearchParams } from 'react-router'

const NewPasswordForm = () => {
  const { resetPassword } = useCustomerAuth()
  const { showNotification } = useNotificationContext()
  const [searchParams] = useSearchParams()
  const [submitting, setSubmitting] = useState(false)
  const [values, setValues] = useState({
    email: searchParams.get('email') ?? '',
    password: '',
    password_confirmation: '',
  })

  const updateValue = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (values.password !== values.password_confirmation) {
      showNotification({ title: 'Invalid password', message: 'Passwords do not match.', variant: 'danger' })
      return
    }

    setSubmitting(true)
    try {
      const response = await resetPassword(
        searchParams.get('token') ?? '',
        values.email,
        values.password,
        values.password_confirmation,
      )
      showNotification({ title: 'Password updated', message: response, variant: 'success' })
    } catch (error) {
      showNotification({
        title: 'Update failed',
        message: error?.message ?? 'Unable to reset the password.',
        variant: 'danger',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>Email address</Form.Label>
        <Form.Control type="email" name="email" value={values.email} onChange={updateValue} required />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>New password</Form.Label>
        <Form.Control type="password" name="password" value={values.password} onChange={updateValue} minLength={8} required />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Confirm new password</Form.Label>
        <Form.Control type="password" name="password_confirmation" value={values.password_confirmation} onChange={updateValue} minLength={8} required />
      </Form.Group>
      <div className="d-grid">
        <Button variant="primary" type="submit" className="fw-semibold py-2" disabled={submitting}>
          {submitting ? 'Updating...' : 'Update Password'}
        </Button>
      </div>
    </Form>
  )
}

export default NewPasswordForm
