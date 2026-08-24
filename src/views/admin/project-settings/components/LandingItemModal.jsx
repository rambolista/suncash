import { useEffect, useState } from 'react'
import { Button, Col, Form, Modal, Row } from 'react-bootstrap'
import QuillEditor from '@/components/wrappers/QuillEditor'
import LandingImageField from './LandingImageField'

const emptyForm = {
  title: '',
  subtitle: '',
  content: '',
  link_label: '',
  link_url: '',
  icon: '',
  accent_color: '',
  price: '',
  badge: '',
  meta: '',
  is_enabled: true,
  image: null,
}

const LandingItemModal = ({ show, section, item, saving, errors = {}, onHide, onSave }) => {
  const isCarouselSlide = section?.type === 'carousel'
  const isFaqEntry = section?.type === 'faq'
  const itemName = isCarouselSlide ? 'Slide' : isFaqEntry ? 'FAQ' : 'Section Item'
  const [form, setForm] = useState(emptyForm)
  const [itemImageFile, setItemImageFile] = useState(null)
  const [clearItemImage, setClearItemImage] = useState(false)

  useEffect(() => {
    const settings = item?.settings ?? {}
    setForm(item ? {
      title: item.title ?? '',
      subtitle: item.subtitle ?? '',
      content: item.content ?? '',
      link_label: item.link_label ?? '',
      link_url: item.link_url ?? '',
      icon: item.icon ?? '',
      accent_color: settings.accent_color ?? '',
      price: settings.price ?? '',
      badge: settings.badge ?? '',
      meta: settings.meta ?? '',
      is_enabled: item.is_enabled ?? true,
      image: null,
    } : emptyForm)
    setItemImageFile(null)
    setClearItemImage(false)
  }, [item, show])

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
    Object.entries(form).forEach(([key, value]) => {
      if (['accent_color', 'price', 'badge', 'meta'].includes(key)) return
      if (value instanceof File) payload.append(key, value)
      else if (value !== null) payload.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : value)
    })
    if (itemImageFile) payload.append('image', itemImageFile)
    payload.append('clear_image', clearItemImage ? '1' : '0')
    payload.append('settings', JSON.stringify({
      ...item?.settings,
      accent_color: form.accent_color,
      price: form.price,
      badge: form.badge,
      meta: form.meta,
    }))
    onSave(payload)
  }

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{item ? `Edit ${itemName}` : `Add ${itemName}`}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>{isFaqEntry ? 'Question' : 'Title'}</Form.Label>
            <Form.Control name="title" value={form.title} onChange={updateField} isInvalid={Boolean(errors.title)} required />
            <Form.Control.Feedback type="invalid">{errors.title?.[0]}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>{isFaqEntry ? 'Category or short label' : 'Subtitle'}</Form.Label>
            <Form.Control name="subtitle" value={form.subtitle} onChange={updateField} />
          </Form.Group>
          <QuillEditor
            label={isFaqEntry ? 'Answer' : 'Information'}
            value={form.content}
            onChange={(nextValue) => setForm((current) => ({ ...current, content: nextValue }))}
            placeholder={isFaqEntry ? 'Write the answer...' : 'Write the item content...'}
            className="mb-3"
            error={errors.content?.[0]}
          />
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Link name</Form.Label>
                <Form.Control name="link_label" value={form.link_label} onChange={updateField} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Link URL</Form.Label>
                <Form.Control name="link_url" value={form.link_url} onChange={updateField} />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Icon</Form.Label>
            <Form.Control name="icon" value={form.icon} onChange={updateField} placeholder="Tabler icon name, e.g. rocket" />
          </Form.Group>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Price</Form.Label>
                <Form.Control name="price" value={form.price} onChange={updateField} placeholder="$49" />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Badge</Form.Label>
                <Form.Control name="badge" value={form.badge} onChange={updateField} placeholder="Best Value" />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Metadata</Form.Label>
                <Form.Control name="meta" value={form.meta} onChange={updateField} placeholder="Jan 12, 2025" />
              </Form.Group>
            </Col>
          </Row>
          <LandingImageField
            label={isCarouselSlide ? 'Slide image' : 'Photo'}
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            note={isCarouselSlide ? 'Recommended: 1920 × 900 px. Maximum 10 MB.' : 'Recommended: 800 × 600 px. Maximum 10 MB.'}
            currentUrl={item?.image_url}
            currentAlt={item?.title || 'Section item image'}
            file={itemImageFile}
            cleared={clearItemImage}
            error={errors.image?.[0]}
            onFileChange={(file) => {
              setItemImageFile(file)
              setClearItemImage(false)
            }}
            onClear={() => {
              setItemImageFile(null)
              setClearItemImage(true)
            }}
          />
          <Form.Group className="mb-3">
            <div className="d-flex align-items-center justify-content-between">
              <Form.Label>Accent color</Form.Label>
              <Button variant="link" size="sm" className="p-0" onClick={() => setForm((current) => ({ ...current, accent_color: '' }))}>Clear</Button>
            </div>
            <Form.Control type="color" name="accent_color" value={form.accent_color || '#0d6efd'} onChange={updateField} />
          </Form.Group>
          <Form.Check type="switch" name="is_enabled" id="section-item-enabled" label="Item enabled" checked={form.is_enabled} onChange={updateField} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onHide} disabled={saving}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : `Save ${isCarouselSlide ? 'Slide' : isFaqEntry ? 'FAQ' : 'Item'}`}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default LandingItemModal
