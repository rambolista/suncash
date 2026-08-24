import { useEffect, useState } from 'react'
import { Button, Col, Form, Modal, Row } from 'react-bootstrap'
import QuillEditor from '@/components/wrappers/QuillEditor'
import LandingImageField from './LandingImageField'

const sectionTypes = ['hero', 'carousel', 'features', 'about', 'gallery', 'pricing', 'testimonials', 'blog', 'faq', 'contact', 'cta', 'footer']
const emptyForm = {
  type: 'hero',
  title: '',
  subtitle: '',
  content: '',
  primary_link_label: '',
  primary_link_url: '',
  secondary_link_label: '',
  secondary_link_url: '',
  nav_label: '',
  background_color: '',
  text_color: '',
  alignment: 'center',
  container_width: 'default',
  image_position: 'left',
  overlay_opacity: 0,
  carousel_autoplay: true,
  carousel_interval: 5000,
  carousel_fade: true,
  carousel_full_width: false,
  faq_open_first: true,
  is_enabled: true,
  image: null,
  background_image: null,
}

const LandingSectionModal = ({ show, section, saving, errors = {}, onHide, onSave }) => {
  const [form, setForm] = useState(emptyForm)
  const [sectionImageFile, setSectionImageFile] = useState(null)
  const [backgroundImageFile, setBackgroundImageFile] = useState(null)
  const [clearSectionImage, setClearSectionImage] = useState(false)
  const [clearBackgroundImage, setClearBackgroundImage] = useState(false)

  useEffect(() => {
    const settings = section?.settings ?? {}
    setForm(section ? {
      type: section.type ?? 'hero',
      title: section.title ?? '',
      subtitle: section.subtitle ?? '',
      content: section.content ?? '',
      primary_link_label: section.primary_link_label ?? '',
      primary_link_url: section.primary_link_url ?? '',
      secondary_link_label: section.secondary_link_label ?? '',
      secondary_link_url: section.secondary_link_url ?? '',
      nav_label: settings.nav_label ?? '',
      background_color: settings.background_color ?? '',
      text_color: settings.text_color ?? '',
      alignment: settings.alignment ?? 'center',
      container_width: settings.container_width ?? 'default',
      image_position: settings.image_position ?? 'left',
      overlay_opacity: settings.overlay_opacity ?? 0,
      carousel_autoplay: settings.carousel_autoplay ?? true,
      carousel_interval: settings.carousel_interval ?? 5000,
      carousel_fade: settings.carousel_fade ?? true,
      carousel_full_width: settings.carousel_full_width ?? false,
      faq_open_first: settings.faq_open_first ?? true,
      is_enabled: section.is_enabled ?? true,
      image: null,
      background_image: null,
    } : emptyForm)
    setSectionImageFile(null)
    setBackgroundImageFile(null)
    setClearSectionImage(false)
    setClearBackgroundImage(false)
  }, [section, show])

  const updateField = (event) => {
    const { name, value, checked, type, files } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'file' ? files?.[0] ?? null : type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const payload = new FormData()
    const settings = {
      ...section?.settings,
      nav_label: form.nav_label,
      background_color: form.background_color,
      text_color: form.text_color,
      alignment: form.alignment,
      container_width: form.container_width,
      image_position: form.image_position,
      overlay_opacity: Number(form.overlay_opacity),
      carousel_autoplay: form.carousel_autoplay,
      carousel_interval: Number(form.carousel_interval),
      carousel_fade: form.carousel_fade,
      carousel_full_width: form.carousel_full_width,
      faq_open_first: form.faq_open_first,
    }

    Object.entries(form).forEach(([key, value]) => {
      if (['nav_label', 'background_color', 'text_color', 'alignment', 'container_width', 'image_position', 'overlay_opacity', 'carousel_autoplay', 'carousel_interval', 'carousel_fade', 'carousel_full_width', 'faq_open_first'].includes(key)) return
      if (value instanceof File) payload.append(key, value)
      else if (value !== null) payload.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : value)
    })
    if (sectionImageFile) payload.append('image', sectionImageFile)
    if (backgroundImageFile) payload.append('background_image', backgroundImageFile)
    payload.append('clear_image', clearSectionImage ? '1' : '0')
    payload.append('clear_background_image', clearBackgroundImage ? '1' : '0')
    payload.append('settings', JSON.stringify(settings))
    onSave(payload)
  }

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{section ? 'Edit Section' : 'Add Section'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col lg={6}>
              <Form.Group className="mb-3">
                <Form.Label>Section type</Form.Label>
                <Form.Select name="type" value={form.type} onChange={updateField} disabled={Boolean(section)} isInvalid={Boolean(errors.type)}>
                  {sectionTypes.map((type) => <option key={type} value={type}>{type[0].toUpperCase() + type.slice(1)}</option>)}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.type?.[0]}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col lg={6}>
              <Form.Group className="mb-3">
                <Form.Label>Navigation label</Form.Label>
                <Form.Control name="nav_label" value={form.nav_label} onChange={updateField} placeholder="Optional header link name" />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Title</Form.Label>
            <Form.Control name="title" value={form.title} onChange={updateField} isInvalid={Boolean(errors.title)} />
            <Form.Control.Feedback type="invalid">{errors.title?.[0]}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Subtitle</Form.Label>
            <Form.Control name="subtitle" value={form.subtitle} onChange={updateField} />
          </Form.Group>
          <QuillEditor
            label="Content"
            value={form.content}
            onChange={(nextValue) => setForm((current) => ({ ...current, content: nextValue }))}
            placeholder="Write the section content..."
            className="mb-3"
            error={errors.content?.[0]}
          />
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Primary link label</Form.Label>
                <Form.Control name="primary_link_label" value={form.primary_link_label} onChange={updateField} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Primary link URL</Form.Label>
                <Form.Control name="primary_link_url" value={form.primary_link_url} onChange={updateField} placeholder="/auth/sign-in or https://..." />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Secondary link label</Form.Label>
                <Form.Control name="secondary_link_label" value={form.secondary_link_label} onChange={updateField} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Secondary link URL</Form.Label>
                <Form.Control name="secondary_link_url" value={form.secondary_link_url} onChange={updateField} />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col lg={6}>
              <LandingImageField
                label="Section image"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                note="Recommended: 1200 × 800 px. Maximum 10 MB."
                currentUrl={section?.image_url}
                currentAlt={section?.title || 'Section image'}
                file={sectionImageFile}
                cleared={clearSectionImage}
                error={errors.image?.[0]}
                onFileChange={(file) => {
                  setSectionImageFile(file)
                  setClearSectionImage(false)
                }}
                onClear={() => {
                  setSectionImageFile(null)
                  setClearSectionImage(true)
                }}
              />
            </Col>
            <Col lg={6}>
              <LandingImageField
                label="Background image"
                accept="image/png,image/jpeg,image/webp"
                note="Recommended: 1920 × 1080 px. Maximum 10 MB."
                currentUrl={section?.background_image_url}
                currentAlt={section?.title || 'Background image'}
                file={backgroundImageFile}
                cleared={clearBackgroundImage}
                error={errors.background_image?.[0]}
                onFileChange={(file) => {
                  setBackgroundImageFile(file)
                  setClearBackgroundImage(false)
                }}
                onClear={() => {
                  setBackgroundImageFile(null)
                  setClearBackgroundImage(true)
                }}
              />
            </Col>
          </Row>
          <Row>
            <Col lg={3}>
              <Form.Group className="mb-3">
                <div className="d-flex align-items-center justify-content-between">
                  <Form.Label>Background color</Form.Label>
                  <Button variant="link" size="sm" className="p-0" onClick={() => setForm((current) => ({ ...current, background_color: '' }))}>Clear</Button>
                </div>
                <Form.Control type="color" name="background_color" value={form.background_color || '#ffffff'} onChange={updateField} />
              </Form.Group>
            </Col>
            <Col lg={3}>
              <Form.Group className="mb-3">
                <div className="d-flex align-items-center justify-content-between">
                  <Form.Label>Text color</Form.Label>
                  <Button variant="link" size="sm" className="p-0" onClick={() => setForm((current) => ({ ...current, text_color: '' }))}>Clear</Button>
                </div>
                <Form.Control type="color" name="text_color" value={form.text_color || '#212529'} onChange={updateField} />
              </Form.Group>
            </Col>
            <Col lg={3}>
              <Form.Group className="mb-3">
                <Form.Label>Alignment</Form.Label>
                <Form.Select name="alignment" value={form.alignment} onChange={updateField}>
                  <option value="start">Left</option>
                  <option value="center">Center</option>
                  <option value="end">Right</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col lg={3}>
              <Form.Group className="mb-3">
                <Form.Label>Overlay %</Form.Label>
                <Form.Control type="number" min={0} max={100} name="overlay_opacity" value={form.overlay_opacity} onChange={updateField} />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Image position</Form.Label>
            <Form.Select name="image_position" value={form.image_position} onChange={updateField}>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </Form.Select>
            <Form.Text>Used by split-content and feature showcase sections.</Form.Text>
          </Form.Group>
          {form.type === 'carousel' && (
            <div className="border rounded p-3 mb-3">
              <h6>Carousel settings</h6>
              <Row className="align-items-end">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Slide interval (milliseconds)</Form.Label>
                    <Form.Control
                      type="number"
                      min={1000}
                      step={500}
                      name="carousel_interval"
                      value={form.carousel_interval}
                      onChange={updateField}
                      disabled={!form.carousel_autoplay}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Check
                    type="switch"
                    name="carousel_autoplay"
                    id="carousel-autoplay"
                    label="Automatically change slides"
                    checked={form.carousel_autoplay}
                    onChange={updateField}
                  />
                </Col>
                <Col md={3}>
                  <Form.Check
                    type="switch"
                    name="carousel_fade"
                    id="carousel-fade"
                    label="Use fade transition"
                    checked={form.carousel_fade}
                    onChange={updateField}
                  />
                </Col>
                <Col md={3}>
                  <Form.Check
                    type="switch"
                    name="carousel_full_width"
                    id="carousel-full-width"
                    label="Full width (100%)"
                    checked={form.carousel_full_width}
                    onChange={updateField}
                  />
                </Col>
              </Row>
              <Form.Text>Add multiple slides after saving this section.</Form.Text>
            </div>
          )}
          {form.type === 'faq' && (
            <div className="border rounded p-3 mb-3">
              <h6>FAQ settings</h6>
              <Form.Check
                type="switch"
                name="faq_open_first"
                id="faq-open-first"
                label="Open the first answer by default"
                checked={form.faq_open_first}
                onChange={updateField}
              />
              <Form.Text>Add questions and answers after saving this section.</Form.Text>
            </div>
          )}
          <Form.Check type="switch" name="is_enabled" id="section-enabled" label="Section enabled" checked={form.is_enabled} onChange={updateField} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onHide} disabled={saving}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Section'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default LandingSectionModal
