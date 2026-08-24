import { useEffect, useState } from 'react'
import { Button, Form, Modal } from 'react-bootstrap'

const toSlug = (value) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

const getCopyIdentity = (page, landingPages) => {
  const slugs = new Set(landingPages.map((landingPage) => landingPage.slug))
  let number = 1
  let slug = `${page.slug}-copy`

  while (slugs.has(slug)) {
    number += 1
    slug = `${page.slug}-copy-${number}`
  }

  return {
    name: `${page.name} Copy${number > 1 ? ` ${number}` : ''}`,
    slug,
  }
}

const DuplicateLandingPageModal = ({ show, page, landingPages = [], saving, errors = {}, onHide, onSave }) => {
  const [form, setForm] = useState({ name: '', slug: '' })
  const [slugEdited, setSlugEdited] = useState(false)

  useEffect(() => {
    setForm(page ? getCopyIdentity(page, landingPages) : { name: '', slug: '' })
    setSlugEdited(false)
  }, [page, landingPages, show])

  const handleNameChange = (event) => {
    const name = event.target.value
    setForm((current) => ({
      name,
      slug: slugEdited ? current.slug : toSlug(name),
    }))
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={(event) => {
        event.preventDefault()
        onSave(form)
      }}>
        <Modal.Header closeButton>
          <Modal.Title>Duplicate Landing Page</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted">
            This creates an independent draft containing all sections, items, settings, ordering, and uploaded media from <strong>{page?.name}</strong>.
          </p>
          <Form.Group className="mb-3">
            <Form.Label>Copy name</Form.Label>
            <Form.Control
              name="name"
              value={form.name}
              onChange={handleNameChange}
              isInvalid={Boolean(errors.name)}
              required
            />
            <Form.Control.Feedback type="invalid">{errors.name?.[0]}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group>
            <Form.Label>Copy slug</Form.Label>
            <Form.Control
              name="slug"
              value={form.slug}
              onChange={(event) => {
                setSlugEdited(true)
                setForm((current) => ({ ...current, slug: toSlug(event.target.value) }))
              }}
              isInvalid={Boolean(errors.slug)}
              required
            />
            <Form.Control.Feedback type="invalid">{errors.slug?.[0]}</Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onHide} disabled={saving}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Copying...' : 'Create Copy'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default DuplicateLandingPageModal
