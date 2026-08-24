import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'
import { setToken } from '@/services/HttpService'
import { useEffect, useState } from 'react'
import { Button, Form, Modal } from 'react-bootstrap'

const emptyForm = {
  current_password: '',
  password: '',
  password_confirmation: '',
}

const passwordIsValid = (password) =>
  password.length >= 8 &&
  /[A-Za-z]/.test(password) &&
  /\d/.test(password) &&
  /[^A-Za-z0-9]/.test(password)

const ChangePasswordModal = ({ show, onHide }) => {
  const { showNotification } = useNotificationContext()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!show) return
    setForm(emptyForm)
    setErrors({})
  }, [show])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const clientErrors = {}

    if (!passwordIsValid(form.password)) {
      clientErrors.password = ['Use at least 8 characters with a letter, number, and symbol.']
    }
    if (form.password !== form.password_confirmation) {
      clientErrors.password_confirmation = ['The password confirmation does not match.']
    }
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      showNotification({ title: 'Failed', message: 'Please meet all password requirements.', variant: 'danger' })
      return
    }

    setSaving(true)
    setErrors({})

    try {
      const response = await ApiService.changePassword(
        form.current_password,
        form.password,
        form.password_confirmation
      )
      setToken(response.token)
      setForm(emptyForm)
      showNotification({ title: 'Success', message: response.message ?? 'Password updated successfully.', variant: 'success' })
    } catch (error) {
      setErrors(error?.errors ?? { form: [error?.message ?? 'Unable to change your password.'] })
      showNotification({ title: 'Failed', message: error?.message ?? 'Unable to change your password.', variant: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Change Password</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3" controlId="current-password">
            <Form.Label>Current password</Form.Label>
            <Form.Control type="password" name="current_password" value={form.current_password} onChange={handleChange} isInvalid={Boolean(errors.current_password)} autoComplete="current-password" required />
            <Form.Control.Feedback type="invalid">{errors.current_password?.[0]}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="new-password">
            <Form.Label>New password</Form.Label>
            <Form.Control type="password" name="password" value={form.password} onChange={handleChange} isInvalid={Boolean(errors.password)} autoComplete="new-password" required />
            <Form.Control.Feedback type="invalid">{errors.password?.[0]}</Form.Control.Feedback>
            <Form.Text>Minimum 8 characters with at least one letter, one number, and one symbol.</Form.Text>
          </Form.Group>

          <Form.Group controlId="password-confirmation">
            <Form.Label>Confirm new password</Form.Label>
            <Form.Control type="password" name="password_confirmation" value={form.password_confirmation} onChange={handleChange} isInvalid={Boolean(errors.password_confirmation)} autoComplete="new-password" required />
            <Form.Control.Feedback type="invalid">{errors.password_confirmation?.[0]}</Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onHide}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Updating...' : 'Update password'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default ChangePasswordModal
