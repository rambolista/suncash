import { useNotificationContext } from '@/context/useNotificationContext'
import { useProjectSettingsContext } from '@/context/useProjectSettingsContext'
import ApiService from '@/services/ApiService'
import { useEffect, useState } from 'react'
import { Button, Card, Col, Form, Image, Row } from 'react-bootstrap'

const imageFields = [
  {
    key: 'favicon',
    urlKey: 'favicon_url',
    label: 'Favicon',
    accept: '.ico,.png,.jpg,.jpeg,.webp,.svg',
    note: 'Ideal: 64 × 64 px, square. ICO, PNG, JPG, WebP, or SVG; maximum 2 MB.',
  },
  {
    key: 'logo_sm',
    urlKey: 'logo_sm_url',
    label: 'Small logo',
    accept: '.png,.jpg,.jpeg,.webp,.svg',
    note: 'Ideal: 64 × 64 px, square with a transparent background. Maximum 5 MB.',
  },
  {
    key: 'logo_dark',
    urlKey: 'logo_dark_url',
    label: 'Dark logo',
    accept: '.png,.jpg,.jpeg,.webp,.svg',
    note: 'Ideal: 220 × 60 px with a transparent background, for light surfaces. Maximum 5 MB.',
  },
  {
    key: 'logo_light',
    urlKey: 'logo_light_url',
    label: 'Light logo',
    accept: '.png,.jpg,.jpeg,.webp,.svg',
    note: 'Ideal: 220 × 60 px with a transparent background, for dark surfaces. Maximum 5 MB.',
  },
  {
    key: 'auth_background',
    urlKey: 'auth_background_url',
    label: 'Authentication background',
    accept: '.png,.jpg,.jpeg,.webp',
    note: 'Ideal: 1920 × 1080 px (16:9), with the subject away from the edges. Maximum 10 MB.',
    wide: true,
  },
  {
    key: 'sidenav_image',
    urlKey: 'sidenav_image_url',
    label: 'Sidenav color image',
    accept: '.png,.jpg,.jpeg,.webp',
    note: 'Ideal: 600 × 1200 px (1:2 portrait), with a dark or low-contrast background. Maximum 5 MB.',
    wide: true,
  },
]

const gradientFields = [
  { key: 'sidenav_gradient_start', label: 'Sidenav gradient start' },
  { key: 'sidenav_gradient_end', label: 'Sidenav gradient end' },
  { key: 'topbar_gradient_start', label: 'Topbar gradient start' },
  { key: 'topbar_gradient_end', label: 'Topbar gradient end' },
]

const ProjectSetupForm = ({ landingPages = [] }) => {
  const { settings, applySettings } = useProjectSettingsContext()
  const { showNotification } = useNotificationContext()
  const [form, setForm] = useState({
    name: '',
    author: '',
    year: new Date().getFullYear(),
    description: '',
    authentication_type: 'basic',
    customer_authentication_type: 'basic',
    landing_page_id: '',
    sidenav_gradient_start: '#1a455f',
    sidenav_gradient_end: '#262549',
    topbar_gradient_start: '#1a455f',
    topbar_gradient_end: '#262549',
  })
  const [files, setFiles] = useState({})
  const [previews, setPreviews] = useState({})
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm({
      name: settings.name ?? '',
      author: settings.author ?? '',
      year: settings.year ?? new Date().getFullYear(),
      description: settings.description ?? '',
      authentication_type: settings.authentication_type ?? 'basic',
      customer_authentication_type: settings.customer_authentication_type ?? 'basic',
      landing_page_id: settings.landing_page_id ?? '',
      sidenav_gradient_start: settings.sidenav_gradient_start ?? '#1a455f',
      sidenav_gradient_end: settings.sidenav_gradient_end ?? '#262549',
      topbar_gradient_start: settings.topbar_gradient_start ?? '#1a455f',
      topbar_gradient_end: settings.topbar_gradient_end ?? '#262549',
    })
    setFiles({})
    setPreviews({})
    setErrors({})
  }, [settings])

  useEffect(() => () => {
    Object.values(previews).forEach((url) => URL.revokeObjectURL(url))
  }, [previews])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  const handleFileChange = (key, file) => {
    if (previews[key]) URL.revokeObjectURL(previews[key])
    setFiles((current) => ({ ...current, [key]: file }))
    setPreviews((current) => ({
      ...current,
      [key]: file ? URL.createObjectURL(file) : undefined,
    }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setErrors({})

    const payload = new FormData()
    Object.entries(form).forEach(([key, value]) => payload.append(key, value ?? ''))
    Object.entries(files).forEach(([key, file]) => {
      if (file) payload.append(key, file)
    })

    try {
      const response = await ApiService.updateProjectSettings(payload)
      applySettings(response?.settings)
      showNotification({ title: 'Success', message: 'Project settings saved.', variant: 'success' })
    } catch (error) {
      setErrors(error?.errors ?? {})
      showNotification({ title: 'Failed', message: error?.message ?? 'Failed to save project settings.', variant: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Form onSubmit={handleSubmit}>
        <Card>
          <Card.Header>
            <h5 className="mb-0">Project Information</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={5}>
                <Form.Group className="mb-3" controlId="project-name">
                  <Form.Label>Project name</Form.Label>
                  <Form.Control name="name" value={form.name} onChange={handleChange} isInvalid={Boolean(errors.name)} required />
                  <Form.Control.Feedback type="invalid">{errors.name?.[0]}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={5}>
                <Form.Group className="mb-3" controlId="project-author">
                  <Form.Label>Author</Form.Label>
                  <Form.Control name="author" value={form.author} onChange={handleChange} isInvalid={Boolean(errors.author)} required />
                  <Form.Control.Feedback type="invalid">{errors.author?.[0]}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-3" controlId="project-year">
                  <Form.Label>Year</Form.Label>
                  <Form.Control type="number" min={1900} max={9999} name="year" value={form.year} onChange={handleChange} isInvalid={Boolean(errors.year)} required />
                  <Form.Control.Feedback type="invalid">{errors.year?.[0]}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3" controlId="project-description">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={3} name="description" value={form.description} onChange={handleChange} isInvalid={Boolean(errors.description)} />
              <Form.Control.Feedback type="invalid">{errors.description?.[0]}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group controlId="authentication-type">
              <Form.Label>Admin Authentication UI</Form.Label>
              <Form.Select name="authentication_type" value={form.authentication_type} onChange={handleChange} isInvalid={Boolean(errors.authentication_type)}>
                <option value="basic">Basic</option>
                <option value="card">Card</option>
                <option value="split">Split</option>
              </Form.Select>
              <Form.Control.Feedback type="invalid">{errors.authentication_type?.[0]}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mt-3" controlId="customer-authentication-type">
              <Form.Label>Customer Authentication UI</Form.Label>
              <Form.Select
                name="customer_authentication_type"
                value={form.customer_authentication_type}
                onChange={handleChange}
                isInvalid={Boolean(errors.customer_authentication_type)}
              >
                <option value="basic">Basic</option>
                <option value="card">Card</option>
                <option value="split">Split</option>
              </Form.Select>
              <Form.Control.Feedback type="invalid">{errors.customer_authentication_type?.[0]}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mt-3" controlId="landing-page">
              <Form.Label>Active landing page</Form.Label>
              <Form.Select name="landing_page_id" value={form.landing_page_id} onChange={handleChange} isInvalid={Boolean(errors.landing_page_id)}>
                <option value="">No dynamic landing page</option>
                {landingPages.map((page) => (
                  <option
                    key={page.id}
                    value={page.id}
                    disabled={page.status !== 'published' || !page.is_active}
                  >
                    {page.name}{page.status !== 'published' ? ' (Draft)' : !page.is_active ? ' (Disabled)' : ''}
                  </option>
                ))}
              </Form.Select>
              <Form.Text>Select which published landing page is rendered at /landing.</Form.Text>
              <Form.Control.Feedback type="invalid">{errors.landing_page_id?.[0]}</Form.Control.Feedback>
            </Form.Group>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <h5 className="mb-0">Gradient Colors</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              {gradientFields.map((field) => (
                <Col md={6} key={field.key}>
                  <Form.Group className="mb-3" controlId={`project-${field.key}`}>
                    <Form.Label>{field.label}</Form.Label>
                    <div className="d-flex align-items-center gap-2">
                      <Form.Control
                        type="color"
                        name={field.key}
                        value={form[field.key]}
                        onChange={handleChange}
                        isInvalid={Boolean(errors[field.key])}
                        title={field.label}
                        style={{ width: 64, height: 42 }}
                      />
                      <Form.Control
                        type="text"
                        name={field.key}
                        value={form[field.key]}
                        onChange={handleChange}
                        isInvalid={Boolean(errors[field.key])}
                        pattern="^#[0-9A-Fa-f]{6}$"
                        required
                      />
                    </div>
                    <Form.Control.Feedback type="invalid">{errors[field.key]?.[0]}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              ))}
            </Row>
            <Row>
              <Col md={6}>
                <div className="rounded p-4 text-white" style={{ background: `linear-gradient(135deg, ${form.sidenav_gradient_start}, ${form.sidenav_gradient_end})` }}>
                  Sidenav gradient preview
                </div>
              </Col>
              <Col md={6}>
                <div className="rounded p-4 text-white" style={{ background: `linear-gradient(to bottom, ${form.topbar_gradient_start}, ${form.topbar_gradient_end})` }}>
                  Topbar gradient preview
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <h5 className="mb-0">System Images</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              {imageFields.map((field) => (
                <Col md={field.wide ? 12 : 6} key={field.key}>
                  <Form.Group className="mb-4" controlId={`project-${field.key}`}>
                    <Form.Label>{field.label}</Form.Label>
                    <div
                      className="border rounded p-3 mb-2 d-flex align-items-center justify-content-center bg-light overflow-hidden"
                      style={{ minHeight: field.wide ? 220 : 100 }}
                    >
                      <Image
                       src={previews[field.key] || settings[field.urlKey]}
                        alt={field.label}
                        style={{ maxWidth: '100%', maxHeight: field.wide ? 300 : 70, objectFit: 'contain' }}
                      />
                    </div>
                    <Form.Control
                      type="file"
                      accept={field.accept}
                      isInvalid={Boolean(errors[field.key])}
                      onChange={(event) => handleFileChange(field.key, event.target.files?.[0] ?? null)}
                    />
                    <Form.Text className="text-muted">{field.note}</Form.Text>
                    <Form.Control.Feedback type="invalid">{errors[field.key]?.[0]}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              ))}
            </Row>
          </Card.Body>
          <Card.Footer className="text-end">
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save setup'}</Button>
          </Card.Footer>
        </Card>
    </Form>
  )
}

export default ProjectSetupForm
