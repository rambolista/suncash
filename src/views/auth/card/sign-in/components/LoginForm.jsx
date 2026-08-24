import Icon from '@/components/wrappers/Icon'
import { Button, Form, FormCheck, FormControl, FormLabel, InputGroup } from 'react-bootstrap'
import { Link } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'
const LoginForm = () => {
  const { login, loading, error } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })

  const handleSubmit = async (event) => {
    event.preventDefault()
    await login(form.email, form.password)
  }

  return (
    <Form onSubmit={handleSubmit}>
      <div className="mb-3">
        <FormLabel>
          Email address
          <span className="text-danger">&nbsp;*</span>
        </FormLabel>

        <InputGroup>
          <InputGroup.Text className="bg-body-tertiary">
            <Icon icon="mail" className="fs-xl text-muted" />
          </InputGroup.Text>

          <FormControl type="email" name="email" id="userEmail" placeholder="you@example.com" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
        </InputGroup>
      </div>
      <div className="mb-3">
        <FormLabel>
          Password
          <span className="text-danger">&nbsp;*</span>
        </FormLabel>
        <InputGroup>
          <InputGroup.Text className="bg-body-tertiary">
            <Icon icon="lock-password" className="fs-xl text-muted" />
          </InputGroup.Text>

          <FormControl type="password" name="password" id="userPassword" placeholder="••••••••" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />
        </InputGroup>
      </div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <FormCheck>
          <Form.Check.Input className="form-check-input fs-14" type="checkbox" id="rememberMe" />
          <Form.Check.Label className="form-check-label" htmlFor="rememberMe">
            Keep me signed in
          </Form.Check.Label>
        </FormCheck>
        <Link to="/auth/reset-pass" className="text-decoration-underline link-offset-3 text-muted">
          Forgot Password?
        </Link>
      </div>
      {error && <p className="text-danger">{error}</p>}
      <div className="d-grid">
        <Button variant="primary" type="submit" className="fw-semibold py-2" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </div>
    </Form>
  )
}
export default LoginForm
