import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import Select from '@/components/wrappers/Select'
import { useEffect, useMemo, useState } from 'react'
import { Button, Col, Form, Modal, Row } from 'react-bootstrap'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useNotificationContext } from '@/context/useNotificationContext'

const schema = Yup.object({
  name:        Yup.string().trim().required('Role name is required').max(80, 'Max 80 characters'),
  description: Yup.string().trim().nullable().max(255, 'Max 255 characters'),
  key_responsibilities: Yup.string().trim().nullable().max(5000, 'Max 5000 characters'),
  icon: Yup.string().trim().nullable().max(120, 'Max 120 characters'),
  user_ids:    Yup.array().of(Yup.number().integer()),
})

const empty = { name: '', description: '', key_responsibilities: '', icon: 'shield', user_ids: [] }

let cachedDefaultIconOptions = null
let cachedDefaultIconOptionsPromise = null
const cachedIconSearches = new Map()

const loadRoleIconOptions = async (search = '') => {
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

const RoleFormModal = ({ show, onHide, onSave, initial, userOptions = [] }) => {
  const { showNotification } = useNotificationContext()
  const [iconOptions, setIconOptions] = useState(() => ensureSelectedIconOption(cachedDefaultIconOptions ?? [], 'shield'))
  const [iconSearch, setIconSearch] = useState('')
  const [iconsLoading, setIconsLoading] = useState(false)
  const [iconLoadError, setIconLoadError] = useState('')

  const formik = useFormik({
    initialValues: empty,
    validationSchema: schema,
    onSubmit: async (values, { setErrors, setSubmitting }) => {
      try {
        await onSave({
          name: values.name.trim(),
          description: values.description?.trim() || null,
          key_responsibilities: values.key_responsibilities?.trim() || null,
          icon: values.icon?.trim() || 'shield',
          user_ids: values.user_ids ?? [],
        })
        onHide()
      } catch (err) {
        setErrors(err?.errors ?? {})
        showNotification({ title: 'Failed', message: err?.message ?? 'Failed to save role.', variant: 'danger' })
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
              name: initial.name,
              description: initial.description || '',
              key_responsibilities: initial.key_responsibilities || '',
              icon: initial.icon || 'shield',
              user_ids: initial.user_ids || [],
            }
          : { ...empty },
      })
      setIconSearch('')
      setIconOptions(ensureSelectedIconOption(cachedDefaultIconOptions ?? [], initial?.icon || 'shield'))
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

    loadRoleIconOptions('')
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

      loadRoleIconOptions(iconSearch)
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

  const { values: f, errors: e, touched: t } = formik
  const selectedIconOption = useMemo(
    () => (f.icon ? { value: f.icon, label: f.icon } : { value: 'shield', label: 'shield' }),
    [f.icon]
  )
  const iconSelectStyles = useMemo(() => ({
    menuPortal: (base) => ({ ...base, zIndex: 2000 }),
    menu: (base) => ({ ...base, zIndex: 2000 }),
    option: (base) => ({ ...base, paddingTop: 8, paddingBottom: 8 }),
  }), [])

  const renderIconOption = (option) => (
    <div className="d-flex align-items-center gap-2">
      <span
        className="border rounded d-inline-flex align-items-center justify-content-center bg-light flex-shrink-0"
        style={{ width: 30, height: 30 }}
      >
        <Icon icon={option.value} className="fs-5" />
      </span>
      <span>{option.label}</span>
    </div>
  )

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" size="xl">
      <Modal.Header closeButton>
        <Modal.Title>{initial ? 'Edit Role' : 'Add Role'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={formik.handleSubmit} noValidate>
        <Modal.Body>
          <Row className="g-3">
            <Col lg={8}>
              <Form.Group>
                <Form.Label>Role name <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  name="name"
                  value={f.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  isInvalid={t.name && !!e.name}
                  placeholder="e.g. Administrator"
                  autoFocus
                />
                <Form.Control.Feedback type="invalid">{e.name}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col lg={4}>
              <Form.Group>
                <Form.Label>Role Icon</Form.Label>
                <Select
                  className="react-select"
                  classNamePrefix="react-select"
                  options={iconOptions}
                  value={selectedIconOption}
                  onChange={(selected) => formik.setFieldValue('icon', selected?.value || 'shield')}
                  onInputChange={(input, meta) => {
                    if (meta.action === 'input-change') setIconSearch(input || '')
                    if (meta.action === 'menu-close') setIconSearch('')
                    return input
                  }}
                  onBlur={() => formik.setFieldTouched('icon', true)}
                  placeholder={iconsLoading ? 'Loading icons...' : 'Search role icon...'}
                  isLoading={iconsLoading}
                  isSearchable
                  isClearable={false}
                  menuPortalTarget={document.body}
                  styles={iconSelectStyles}
                  formatOptionLabel={renderIconOption}
                />
                {iconLoadError && (
                  <div className="text-warning small mt-1">{iconLoadError}</div>
                )}
                {t.icon && e.icon && (
                  <div className="text-danger small mt-1">{e.icon}</div>
                )}
              </Form.Group>
            </Col>
            <Col lg={12}>
              <Form.Group>
                <Form.Label>Description</Form.Label>
                <Form.Control
                  name="description"
                  value={f.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  isInvalid={t.description && !!e.description}
                  placeholder="Brief description of this role"
                />
                <Form.Control.Feedback type="invalid">{e.description}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col lg={12}>
              <Form.Group>
                <Form.Label>Key Responsibilities</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  name="key_responsibilities"
                  value={f.key_responsibilities}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  isInvalid={t.key_responsibilities && !!e.key_responsibilities}
                  placeholder={'Codebase Maintenance\nAPI Integration\nUnit Testing\nFeature Deployment'}
                />
                <Form.Control.Feedback type="invalid">{e.key_responsibilities}</Form.Control.Feedback>
                <small className="text-muted">Separate each item by comma or line</small>
              </Form.Group>
            </Col>
            <Col lg={12}>
              <Form.Group>
                <Form.Label>Users who can access this role</Form.Label>
                <Select
                  className="react-select"
                  classNamePrefix="react-select"
                  isMulti
                  options={userOptions}
                  value={userOptions.filter((opt) => f.user_ids.includes(opt.value))}
                  onChange={(selected) => {
                    const ids = Array.isArray(selected) ? selected.map((opt) => opt.value) : []
                    formik.setFieldValue('user_ids', ids)
                  }}
                  onBlur={() => formik.setFieldTouched('user_ids', true)}
                  placeholder="Select users..."
                />
                {t.user_ids && e.user_ids && (
                  <div className="text-danger small mt-1">{e.user_ids}</div>
                )}
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={formik.isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={formik.isSubmitting}>
            {formik.isSubmitting ? 'Saving...' : initial ? 'Save changes' : 'Create role'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default RoleFormModal
