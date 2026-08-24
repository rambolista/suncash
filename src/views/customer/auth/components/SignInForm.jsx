import useCustomerAuth from '@/hooks/useCustomerAuth'
import { Button, Form, FormCheck } from 'react-bootstrap'
import FormCheckInput from 'react-bootstrap/esm/FormCheckInput'
import FormCheckLabel from 'react-bootstrap/esm/FormCheckLabel'
import { Link } from 'react-router'
import { useState } from 'react'

const SignInForm = () => {
  const { login, loading, error } = useCustomerAuth()
  const [form, setForm] = useState({ email: '', password: '' })

  const handleSubmit = async (event) => {
    event.preventDefault()
    await login(form.email, form.password)
  }

  return (
    <Form className="mt-4" onSubmit={handleSubmit}>
      <div className="mb-3">
        <div className="input-group">
          <input type="email" name="email" className="form-control py-2 px-3" id="customerEmail" placeholder="Enter email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
        </div>
      </div>
      <div className="mb-3">
        <div className="input-group">
          <input type="password" name="password" className="form-control py-2 px-3" id="customerPassword" placeholder="Enter password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />
        </div>
      </div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <FormCheck>
          <FormCheckInput className="fs-14" type="checkbox" defaultChecked id="rememberCustomer" />
          <FormCheckLabel>Keep me signed in</FormCheckLabel>
        </FormCheck>
        <Link to="/customer/forgot-password" className="text-decoration-underline link-offset-3 text-muted">
          Forgot Password?
        </Link>
      </div>
      {error && <p className="text-danger">{error}</p>}
      <div className="d-grid">
        <Button variant="primary" type="submit" className="fw-bold py-2" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </div>
    </Form>
  )
}

export default SignInForm
