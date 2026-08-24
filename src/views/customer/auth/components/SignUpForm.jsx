import { useNotificationContext } from '@/context/useNotificationContext'
import useCustomerAuth from '@/hooks/useCustomerAuth'
import { useState } from 'react'
import { Button, Col, Form, Row } from 'react-bootstrap'

const initialValues = {
  first_name: '',
  middle_name: '',
  last_name: '',
  email: '',
  mobile_number: '',
  address: '',
  password: '',
  password_confirmation: '',
}

const SignUpForm = () => {
  const { register, loading, error } = useCustomerAuth()
  const { showNotification } = useNotificationContext()
  const [values, setValues] = useState(initialValues)
  const [fieldErrors, setFieldErrors] = useState({})

  const updateValue = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (values.password !== values.password_confirmation) {
      setFieldErrors({ password_confirmation: ['Passwords do not match.'] })
      return
    }

    const errors = await register(values)
    if (errors) {
      setFieldErrors(errors)
      showNotification({
        title: 'Registration failed',
        message: 'Please correct the highlighted fields.',
        variant: 'danger',
      })
    }
  }

  const field = (name, label, props = {}) => (
    <Form.Group className="mb-3">
      <Form.Label>
        {label}
        {props.required && <span className="text-danger ms-1">*</span>}
      </Form.Label>
      <Form.Control
        {...props}
        name={name}
        value={values[name]}
        onChange={updateValue}
        isInvalid={Boolean(fieldErrors[name])}
      />
      <Form.Control.Feedback type="invalid">{fieldErrors[name]?.[0]}</Form.Control.Feedback>
    </Form.Group>
  )

  return (
    <Form onSubmit={handleSubmit}>
      <Row>
        <Col md={6}>{field('first_name', 'First name', { required: true, autoComplete: 'given-name' })}</Col>
        <Col md={6}>{field('middle_name', 'Middle name', { autoComplete: 'additional-name' })}</Col>
      </Row>
      {field('last_name', 'Last name', { required: true, autoComplete: 'family-name' })}
      {field('email', 'Email address', { type: 'email', required: true, autoComplete: 'email' })}
      {field('mobile_number', 'Mobile number', { type: 'tel', autoComplete: 'tel' })}
      {field('address', 'Address', { as: 'textarea', rows: 2, autoComplete: 'street-address' })}
      {field('password', 'Password', {
        type: 'password',
        required: true,
        minLength: 8,
        autoComplete: 'new-password',
        placeholder: 'Minimum 8 characters',
      })}
      {field('password_confirmation', 'Confirm password', {
        type: 'password',
        required: true,
        minLength: 8,
        autoComplete: 'new-password',
      })}
      {error && <p className="text-danger">{error}</p>}
      <div className="d-grid">
        <Button variant="primary" type="submit" className="fw-semibold py-2" disabled={loading}>
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>
      </div>
    </Form>
  )
}

export default SignUpForm
