import { useEffect, useState } from 'react'
import { Button, Form, Modal } from 'react-bootstrap'
import QuillEditor from '@/components/wrappers/QuillEditor'

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  header_sign_in_label: 'SIGN IN',
  header_sign_in_url: '/auth/sign-in',
  header_sign_up_label: 'Sign Up',
  header_sign_up_url: '/auth/sign-in',
  is_navigation_fixed: false,
  status: 'draft',
  is_active: true,
}

const LandingPageModal = ({ show, page, saving, errors = {}, onHide, onSave }) => {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    setForm(page ? {
      name: page.name ?? '',
      slug: page.slug ?? '',
      description: page.description ?? '',
      header_sign_in_label: page.header_sign_in_label ?? 'SIGN IN',
      header_sign_in_url: page.header_sign_in_url ?? '/auth/sign-in',
      header_sign_up_label: page.header_sign_up_label ?? 'Sign Up',
      header_sign_up_url: page.header_sign_up_url ?? '/auth/sign-in',
      is_navigation_fixed: page.is_navigation_fixed ?? false,
      status: page.status ?? 'draft',
      is_active: page.is_active ?? true,
    } : emptyForm)
  }, [page, show])

  const updateField = (event) => {
    const { name, value, checked, type } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSave(form)
  }

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{page ? 'Edit Landing Page' : 'Create Landing Page'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Page name</Form.Label>
            <Form.Control name="name" value={form.name} onChange={updateField} isInvalid={Boolean(errors.name)} required />
            <Form.Control.Feedback type="invalid">{errors.name?.[0]}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Slug</Form.Label>
            <Form.Control name="slug" value={form.slug} onChange={updateField} isInvalid={Boolean(errors.slug)} placeholder="company-home" required />
            <Form.Text>Used as the stable page identifier.</Form.Text>
            <Form.Control.Feedback type="invalid">{errors.slug?.[0]}</Form.Control.Feedback>
          </Form.Group>
          <QuillEditor
            label="Internal description"
            value={form.description}
            onChange={(nextValue) => setForm((current) => ({ ...current, description: nextValue }))}
            placeholder="Write a short internal description..."
            className="mb-3"
            error={errors.description?.[0]}
          />
          <hr />
          <h6 className="mb-3">Header buttons</h6>
          <Form.Group className="mb-3">
            <Form.Label>Sign in label</Form.Label>
            <Form.Control name="header_sign_in_label" value={form.header_sign_in_label} onChange={updateField} isInvalid={Boolean(errors.header_sign_in_label)} />
            <Form.Control.Feedback type="invalid">{errors.header_sign_in_label?.[0]}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Sign in URL</Form.Label>
            <Form.Control name="header_sign_in_url" value={form.header_sign_in_url} onChange={updateField} placeholder="/auth/sign-in" isInvalid={Boolean(errors.header_sign_in_url)} />
            <Form.Control.Feedback type="invalid">{errors.header_sign_in_url?.[0]}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Sign up label</Form.Label>
            <Form.Control name="header_sign_up_label" value={form.header_sign_up_label} onChange={updateField} isInvalid={Boolean(errors.header_sign_up_label)} />
            <Form.Control.Feedback type="invalid">{errors.header_sign_up_label?.[0]}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Sign up URL</Form.Label>
            <Form.Control name="header_sign_up_url" value={form.header_sign_up_url} onChange={updateField} placeholder="/auth/sign-in" isInvalid={Boolean(errors.header_sign_up_url)} />
            <Form.Control.Feedback type="invalid">{errors.header_sign_up_url?.[0]}</Form.Control.Feedback>
          </Form.Group>
          <Form.Check
            type="switch"
            name="is_navigation_fixed"
            id="landing-page-fixed-navigation"
            label="Keep navigation visible while scrolling"
            checked={form.is_navigation_fixed}
            onChange={updateField}
            className="mb-3"
          />
          <Form.Check
            type="switch"
            id="landing-page-published"
            label="Published"
            checked={form.status === 'published'}
            onChange={(event) => setForm((current) => ({
              ...current,
              status: event.target.checked ? 'published' : 'draft',
            }))}
          />
          <Form.Check
            type="switch"
            name="is_active"
            id="landing-page-active"
            label="Enabled and available for selection"
            checked={form.is_active}
            onChange={updateField}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onHide} disabled={saving}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Page'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default LandingPageModal
