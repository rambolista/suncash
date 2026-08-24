import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import Select from '@/components/wrappers/Select'
import { useEffect, useMemo, useState } from 'react'
import { Button, Col, Form, Modal, Row } from 'react-bootstrap'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useNotificationContext } from '@/context/useNotificationContext'

const toSlug = (label) =>
  label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

const schema = Yup.object({
  label: Yup.string().trim().required('Label is required'),
  slug: Yup.string().trim().required('Slug is required').matches(/^[a-z0-9:_-]+$/, 'Only lowercase letters, numbers, colons, hyphens and underscores'),
  url: Yup.string().trim().nullable(),
  icon: Yup.string().trim().nullable(),
  parent_id: Yup.string().nullable(),
  sort_order: Yup.number().integer().min(0).default(0),
  is_title: Yup.boolean().default(false),
  is_active: Yup.boolean().default(true),
  is_disabled: Yup.boolean().default(false),
  is_special: Yup.boolean().default(false),
  show_in_customer_page: Yup.boolean().default(true),
  badge_text: Yup.string().trim().nullable(),
  badge_class: Yup.string().trim().nullable(),
})

const empty = {
  label: '',
  slug: '',
  url: '',
  icon: '',
  parent_id: '',
  sort_order: 0,
  is_title: false,
  is_active: true,
  is_disabled: false,
  is_special: false,
  show_in_customer_page: true,
  badge_text: '',
  badge_class: '',
}

const getDescendantIds = (id, list) => {
  const children = list.filter((m) => m.parent_id === id)
  return [id, ...children.flatMap((c) => getDescendantIds(c.id, list))]
}

let cachedDefaultIconOptions = null
let cachedDefaultIconOptionsPromise = null
const cachedIconSearches = new Map()

const loadMenuIconOptions = async (search = '') => {
  const query = search.trim().toLowerCase()

  if (!query && cachedDefaultIconOptions) {
    return cachedDefaultIconOptions
  }

  if (!query && cachedDefaultIconOptionsPromise) {
    return cachedDefaultIconOptionsPromise
  }

  if (cachedIconSearches.has(query)) {
    return cachedIconSearches.get(query)
  }

  const request = ApiService.searchMenuIcons(query, 50).then((items) => {
    const options = Array.isArray(items)
      ? items.map((item) => ({ value: item.name, label: item.name }))
      : []

    if (!query) {
      cachedDefaultIconOptions = options
      cachedDefaultIconOptionsPromise = Promise.resolve(options)
    }

    cachedIconSearches.set(query, options)

    return options
  })

  cachedIconSearches.set(query, request)

  if (!query) {
    cachedDefaultIconOptionsPromise = request
  }

  return request
}

const ensureSelectedIconOption = (options, iconValue) => {
  if (!iconValue) return options
  if (options.some((option) => option.value === iconValue)) return options
  return [{ value: iconValue, label: iconValue }, ...options]
}

const CustomerMenuFormModal = ({ show, onHide, onSave, menus, initial }) => {
  const { showNotification } = useNotificationContext()
  const [iconOptions, setIconOptions] = useState(() => cachedDefaultIconOptions ?? [])
  const [iconSearch, setIconSearch] = useState('')
  const [iconsLoading, setIconsLoading] = useState(false)
  const [iconLoadError, setIconLoadError] = useState('')

  const formik = useFormik({
    initialValues: empty,
    validationSchema: schema,
    onSubmit: async (values, { setErrors, setSubmitting }) => {
      try {
        const payload = {
          ...values,
          parent_id: values.parent_id === '' ? null : Number(values.parent_id),
          sort_order: Number(values.sort_order) || 0,
          url: values.url || null,
          icon: values.icon || null,
          badge_text: values.badge_text || null,
          badge_class: values.badge_class || null,
        }
        await onSave(payload)
        onHide()
      } catch (err) {
        setErrors(err?.errors ?? {})
        showNotification({ title: 'Failed', message: err?.message ?? 'Failed to save menu.', variant: 'danger' })
      } finally {
        setSubmitting(false)
      }
    },
  })

  useEffect(() => {
    if (show) {
      formik.resetForm({
        values: initial
          ? {
              ...empty,
              ...initial,
              parent_id: initial.parent_id ?? '',
              url: initial.url ?? '',
              icon: initial.icon ?? '',
              badge_text: initial.badge_text ?? '',
              badge_class: initial.badge_class ?? '',
              show_in_customer_page: initial.show_in_customer_page ?? true,
            }
          : { ...empty },
      })
      setIconSearch('')
      setIconOptions(ensureSelectedIconOption(cachedDefaultIconOptions ?? [], initial?.icon ?? ''))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, initial])

  useEffect(() => {
    if (!show || cachedDefaultIconOptions) {
      if (cachedDefaultIconOptions) {
        setIconOptions(ensureSelectedIconOption(cachedDefaultIconOptions, formik.values.icon))
      }
      return
    }

    let active = true
    setIconsLoading(true)

    loadMenuIconOptions('')
      .then((options) => {
        if (active) {
          setIconOptions(ensureSelectedIconOption(options, formik.values.icon))
          setIconLoadError('')
        }
      })
      .catch(() => {
        if (active) setIconLoadError('Unable to load icons.')
      })
      .finally(() => {
        if (active) setIconsLoading(false)
      })

    return () => {
      active = false
    }
  }, [show, formik.values.icon])

  useEffect(() => {
    if (!show) return

    const timer = setTimeout(() => {
      setIconsLoading(true)

      loadMenuIconOptions(iconSearch)
        .then((options) => {
          setIconOptions(ensureSelectedIconOption(options, formik.values.icon))
          setIconLoadError('')
        })
        .catch(() => {
          setIconLoadError('Unable to load icons.')
        })
        .finally(() => {
          setIconsLoading(false)
        })
    }, 250)

    return () => clearTimeout(timer)
  }, [show, iconSearch, formik.values.icon])

  const excludeIds = initial ? getDescendantIds(initial.id, menus) : []
  const parentChoices = menus.filter((m) => !m.is_title && !excludeIds.includes(m.id))
  const parentOptions = useMemo(
    () => parentChoices.map((m) => ({ value: m.id, label: `${m.label} (${m.slug})` })),
    [parentChoices]
  )

  const { values: f, errors: e, touched: t } = formik

  const selectedIconOption = useMemo(
    () => (f.icon ? { value: f.icon, label: f.icon } : null),
    [f.icon]
  )

  const iconSelectStyles = useMemo(() => ({
    menuPortal: (base) => ({ ...base, zIndex: 2000 }),
    menu: (base) => ({ ...base, zIndex: 2000 }),
    option: (base) => ({ ...base, paddingTop: 8, paddingBottom: 8 }),
  }), [])

  const renderIconOption = (option) => (
    <div className="d-flex align-items-center gap-2">
      <span className="border rounded d-inline-flex align-items-center justify-content-center bg-light flex-shrink-0" style={{ width: 32, height: 32 }}>
        <Icon icon={option.value} className="fs-5" />
      </span>
      <span>{option.label}</span>
    </div>
  )

  if (!show) {
    return null
  }

  return (
    <Modal show={show} onHide={onHide} size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>{initial ? 'Edit Menu' : 'Add Menu'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={formik.handleSubmit} noValidate>
        <Modal.Body>
          <Row className="g-3">
            <Col md={7}>
              <Form.Group>
                <Form.Label>Label <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  name="label"
                  value={f.label}
                  onChange={(ev) => {
                    formik.handleChange(ev)
                    if (!initial) formik.setFieldValue('slug', toSlug(ev.target.value))
                  }}
                  onBlur={formik.handleBlur}
                  isInvalid={t.label && !!e.label}
                />
                <Form.Control.Feedback type="invalid">{e.label}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={5}>
              <Form.Group>
                <Form.Label>Slug <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  name="slug"
                  value={f.slug}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  isInvalid={t.slug && !!e.slug}
                />
                <Form.Control.Feedback type="invalid">{e.slug}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={7}>
              <Form.Group>
                <Form.Label>URL</Form.Label>
                <Form.Control name="url" value={f.url} onChange={formik.handleChange} placeholder="/apps/example" />
              </Form.Group>
            </Col>
            <Col md={5}>
              <Form.Group>
                <Form.Label>Icon</Form.Label>
                <Select
                  className="react-select"
                  classNamePrefix="react-select"
                  options={ensureSelectedIconOption(iconOptions, f.icon)}
                  value={selectedIconOption}
                  onChange={(selected) => formik.setFieldValue('icon', selected?.value || '')}
                  onBlur={() => formik.setFieldTouched('icon', true)}
                  onInputChange={(inputValue, meta) => {
                    if (meta.action === 'input-change') setIconSearch(inputValue)
                    if (meta.action === 'menu-close') setIconSearch('')
                  }}
                  placeholder="Search or select an icon..."
                  isClearable
                  isSearchable
                  isLoading={iconsLoading}
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  styles={iconSelectStyles}
                  filterOption={() => true}
                  noOptionsMessage={() => iconLoadError || 'No icons found'}
                  formatOptionLabel={renderIconOption}
                />
              </Form.Group>
            </Col>
            <Col md={8}>
              <Form.Group>
                <Form.Label>Parent</Form.Label>
                <Select
                  className="react-select"
                  classNamePrefix="react-select"
                  options={parentOptions}
                  value={parentOptions.find((option) => String(option.value) === String(f.parent_id)) || null}
                  onChange={(selected) => formik.setFieldValue('parent_id', selected ? String(selected.value) : '')}
                  onBlur={() => formik.setFieldTouched('parent_id', true)}
                  placeholder="- None (top-level) -"
                  isClearable
                  isSearchable
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  styles={iconSelectStyles}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Sort order</Form.Label>
                <Form.Control
                  type="number"
                  name="sort_order"
                  value={f.sort_order}
                  onChange={formik.handleChange}
                  min={0}
                  isInvalid={t.sort_order && !!e.sort_order}
                />
                <Form.Control.Feedback type="invalid">{e.sort_order}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Check
                id="menu-modal-is_title"
                type="switch"
                label="Section title"
                name="is_title"
                checked={!!f.is_title}
                onChange={formik.handleChange}
              />
            </Col>
            <Col md={3}>
              <Form.Check
                id="menu-modal-is_active"
                type="switch"
                label="Active"
                name="is_active"
                checked={!!f.is_active}
                onChange={formik.handleChange}
              />
            </Col>
            <Col md={3}>
              <Form.Check
                id="menu-modal-is_disabled"
                type="switch"
                label="Disabled"
                name="is_disabled"
                checked={!!f.is_disabled}
                onChange={formik.handleChange}
              />
            </Col>
            <Col md={3}>
              <Form.Check
                id="menu-modal-is_special"
                type="switch"
                label="Special menu"
                name="is_special"
                checked={!!f.is_special}
                onChange={formik.handleChange}
              />
            </Col>
            <Col md={12} className="d-flex flex-wrap gap-4 align-items-end pb-1">
              <Form.Check
                id="customer-menu-modal-show-in-customer-page"
                type="switch"
                label="Show in customer page"
                name="show_in_customer_page"
                checked={!!f.show_in_customer_page}
                onChange={formik.handleChange}
              />
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Badge text</Form.Label>
                <Form.Control name="badge_text" value={f.badge_text} onChange={formik.handleChange} placeholder="New" />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Badge class</Form.Label>
                <Form.Control name="badge_class" value={f.badge_class} onChange={formik.handleChange} placeholder="bg-danger text-white" />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={formik.isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={formik.isSubmitting}>
            {formik.isSubmitting ? 'Saving...' : initial ? 'Save changes' : 'Create'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default CustomerMenuFormModal
