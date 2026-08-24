import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import Select from '@/components/wrappers/Select'
import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Col, Form, Row } from 'react-bootstrap'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useNotificationContext } from '@/context/useNotificationContext'
import { DEFAULT_MENU_CAPABILITIES, MENU_ACTIONS } from '@/utils/menuPermissions'

const toSlug = (label) =>
  label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

const schema = Yup.object({
  label:      Yup.string().trim().required('Label is required'),
  slug:       Yup.string().trim().required('Slug is required').matches(/^[a-z0-9:_-]+$/, 'Only lowercase letters, numbers, colons, hyphens and underscores'),
  url:        Yup.string().trim().nullable(),
  icon:       Yup.string().trim().nullable(),
  parent_id:  Yup.string().nullable(),
  sort_order: Yup.number().integer().min(0).default(0),
  is_title:   Yup.boolean().default(false),
  is_active:  Yup.boolean().default(true),
  is_disabled: Yup.boolean().default(false),
  is_special: Yup.boolean().default(false),
  badge_text:  Yup.string().trim().nullable(),
  badge_class: Yup.string().trim().nullable(),
  tab_layout: Yup.string().oneOf(['horizontal', 'vertical']).default('horizontal'),
  ...Object.fromEntries(MENU_ACTIONS.map(({ capability }) => [capability, Yup.boolean()])),
  tabs: Yup.array().of(Yup.object({
    key: Yup.string().trim().required('Key is required').matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase words separated by hyphens'),
    label: Yup.string().trim().required('Label is required'),
    icon: Yup.string().trim().nullable(),
    sort_order: Yup.number().integer().min(0),
    is_active: Yup.boolean(),
    ...Object.fromEntries(MENU_ACTIONS.map(({ capability }) => [capability, Yup.boolean()])),
  })),
})

const empty = {
  label: '', slug: '', url: '', icon: '',
  parent_id: '', sort_order: 0,
  is_title: false, is_active: true,
  is_disabled: false, is_special: false,
  badge_text: '', badge_class: '',
  tab_layout: 'horizontal',
  ...DEFAULT_MENU_CAPABILITIES,
  tabs: [],
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

const MenuForm = ({ onCancel, onSave, menus, initial }) => {
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
          parent_id:  values.parent_id === '' ? null : Number(values.parent_id),
          sort_order: Number(values.sort_order) || 0,
          url:        values.url || null,
          icon:       values.icon || null,
          badge_text:  values.badge_text  || null,
          badge_class: values.badge_class || null,
          tabs: values.is_title
            ? []
            : values.tabs.map((tab, index) => ({
                key: tab.key.trim(),
                label: tab.label.trim(),
                icon: tab.icon?.trim() || null,
                sort_order: Number(tab.sort_order) || index,
                is_active: Boolean(tab.is_active),
                ...MENU_ACTIONS.reduce((capabilities, { capability }) => ({
                  ...capabilities,
                  [capability]: Boolean(tab[capability]),
                }), {}),
              })),
        }
        await onSave(payload)
      } catch (err) {
        setErrors(err?.errors ?? {})
        showNotification({ title: 'Failed', message: err?.message ?? 'Failed to save menu.', variant: 'danger' })
      } finally {
        setSubmitting(false)
      }
    },
  })

  useEffect(() => {
    formik.resetForm({
      values: initial
        ? {
            ...empty,
            ...initial,
            parent_id:  initial.parent_id ?? '',
            url:        initial.url        ?? '',
            icon:       initial.icon       ?? '',
            badge_text:  initial.badge_text  ?? '',
            badge_class: initial.badge_class ?? '',
            tab_layout: initial.tab_layout ?? 'horizontal',
            tabs: Array.isArray(initial.tabs) ? initial.tabs : [],
          }
        : { ...empty },
    })
    setIconSearch('')
    setIconOptions(ensureSelectedIconOption(cachedDefaultIconOptions ?? [], initial?.icon ?? ''))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial])

  useEffect(() => {
    if (cachedDefaultIconOptions) {
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
  }, [formik.values.icon])

  useEffect(() => {
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
  }, [iconSearch, formik.values.icon])

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
      <span
        className="border rounded d-inline-flex align-items-center justify-content-center bg-light flex-shrink-0"
        style={{ width: 32, height: 32 }}
      >
        <Icon icon={option.value} className="fs-5" />
      </span>
      <span>{option.label}</span>
    </div>
  )

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">{initial ? 'Edit Menu' : 'Add Menu'}</h5>
      </Card.Header>
      <Form onSubmit={formik.handleSubmit} noValidate>
        <Card.Body>
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
                  type="number" name="sort_order" value={f.sort_order}
                  onChange={formik.handleChange} min={0}
                  isInvalid={t.sort_order && !!e.sort_order}
                />
                <Form.Control.Feedback type="invalid">{e.sort_order}</Form.Control.Feedback>
              </Form.Group>
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
            <Col md={12} className="d-flex flex-wrap gap-4 align-items-end pb-1">
              <Form.Check
                id="menu-modal-is_title" type="switch" label="Section title"
                name="is_title" checked={!!f.is_title} onChange={formik.handleChange}
              />
              <Form.Check
                id="menu-modal-is_active" type="switch" label="Active"
                name="is_active" checked={!!f.is_active} onChange={formik.handleChange}
              />
              <Form.Check
                id="menu-modal-is_disabled" type="switch" label="Disabled"
                name="is_disabled" checked={!!f.is_disabled} onChange={formik.handleChange}
              />
              <Form.Check
                id="menu-modal-is_special" type="switch" label="Special menu"
                name="is_special" checked={!!f.is_special} onChange={formik.handleChange}
              />
            </Col>
            {!f.is_title && (
              <>
                <Col md={12}>
                  <div className="border rounded p-3">
                    <h6 className="mb-1">Available access rights</h6>
                    <p className="text-muted small mb-3">
                      Roles only show checkboxes for access rights enabled here.
                    </p>
                    <div className="d-flex flex-wrap gap-4">
                      {MENU_ACTIONS.map(({ capability, label }) => (
                        <Form.Check
                          key={capability}
                          id={`menu-modal-${capability}`}
                          type="switch"
                          label={label}
                          name={capability}
                          checked={Boolean(f[capability])}
                          onChange={formik.handleChange}
                        />
                      ))}
                    </div>
                  </div>
                </Col>
                <Col md={12}>
                  <div className="border rounded p-3">
                    <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                      <div>
                        <h6 className="mb-1">Menu tabs</h6>
                        <p className="text-muted small mb-0">
                          Tabs are ordered here and can be granted separately in Roles.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline-primary"
                        size="sm"
                        onClick={() => formik.setFieldValue('tabs', [
                          ...f.tabs,
                          {
                            key: '',
                            label: '',
                            icon: '',
                            sort_order: f.tabs.length,
                            is_active: true,
                            ...DEFAULT_MENU_CAPABILITIES,
                          },
                        ])}
                      >
                        + Add tab
                      </Button>
                    </div>
                    <Row className="mb-3">
                      <Col md={6} lg={4}>
                        <Form.Group>
                          <Form.Label>Tab display</Form.Label>
                          <Form.Select
                            name="tab_layout"
                            value={f.tab_layout}
                            onChange={formik.handleChange}
                          >
                            <option value="horizontal">Horizontal bordered tabs</option>
                            <option value="vertical">Vertical bordered tabs</option>
                          </Form.Select>
                          <Form.Text className="text-muted">
                            Vertical is recommended when the menu contains many tabs.
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>
                    {f.tabs.length === 0 ? (
                      <div className="text-muted small text-center py-3">This menu has no tabs.</div>
                    ) : (
                      <div className="d-flex flex-column gap-2">
                        {f.tabs.map((tab, index) => (
                          <div className="border rounded p-3" key={`${tab.key}-${index}`}>
                            <div className="row g-2 align-items-start">
                            <div className="col-md-3">
                              <Form.Control
                                size="sm"
                                value={tab.key}
                                placeholder="tab-key"
                                aria-label={`Tab ${index + 1} key`}
                                onChange={(event) => formik.setFieldValue(`tabs.${index}.key`, toSlug(event.target.value))}
                                isInvalid={Boolean(e.tabs?.[index]?.key)}
                              />
                              <Form.Control.Feedback type="invalid">{e.tabs?.[index]?.key}</Form.Control.Feedback>
                            </div>
                            <div className="col-md-4">
                              <Form.Control
                                size="sm"
                                value={tab.label}
                                placeholder="Tab label"
                                aria-label={`Tab ${index + 1} label`}
                                onChange={(event) => formik.setFieldValue(`tabs.${index}.label`, event.target.value)}
                                isInvalid={Boolean(e.tabs?.[index]?.label)}
                              />
                              <Form.Control.Feedback type="invalid">{e.tabs?.[index]?.label}</Form.Control.Feedback>
                            </div>
                            <div className="col-md-3">
                              <Select
                                className="react-select"
                                classNamePrefix="react-select"
                                options={ensureSelectedIconOption(iconOptions, tab.icon)}
                                value={tab.icon ? { value: tab.icon, label: tab.icon } : null}
                                onChange={(selected) => formik.setFieldValue(`tabs.${index}.icon`, selected?.value || '')}
                                onInputChange={(inputValue, meta) => {
                                  if (meta.action === 'input-change') setIconSearch(inputValue)
                                  if (meta.action === 'menu-close') setIconSearch('')
                                }}
                                placeholder="Select icon..."
                                isClearable
                                isSearchable
                                isLoading={iconsLoading}
                                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                styles={iconSelectStyles}
                                filterOption={() => true}
                                noOptionsMessage={() => iconLoadError || 'No icons found'}
                                formatOptionLabel={renderIconOption}
                              />
                            </div>
                            <div className="col-md-1 ms-auto">
                              <Form.Control
                                size="sm"
                                type="number"
                                min={0}
                                value={tab.sort_order ?? index}
                                aria-label={`Tab ${index + 1} order`}
                                onChange={(event) => formik.setFieldValue(`tabs.${index}.sort_order`, Number(event.target.value))}
                              />
                            </div>
                            <div className="col-md-1 pt-1">
                              <Form.Check
                                type="switch"
                                label="Visible"
                                checked={Boolean(tab.is_active)}
                                aria-label={`Tab ${index + 1} visible`}
                                onChange={(event) => formik.setFieldValue(`tabs.${index}.is_active`, event.target.checked)}
                              />
                            </div>
                            <div className="col-md-1">
                              <Button
                                type="button"
                                variant="outline-danger"
                                size="sm"
                                className="btn-icon"
                                aria-label={`Remove tab ${index + 1}`}
                                onClick={() => formik.setFieldValue('tabs', f.tabs.filter((_, tabIndex) => tabIndex !== index))}
                              >
                                <Icon icon="trash" />
                              </Button>
                            </div>
                            </div>
                            <div className="mt-3 pt-3 border-top">
                              <div className="small fw-semibold mb-2">Available access rights</div>
                              <div className="d-flex flex-wrap gap-4">
                                {MENU_ACTIONS.map(({ capability, label }) => (
                                  <Form.Check
                                    key={capability}
                                    id={`menu-tab-${index}-${capability}`}
                                    type="switch"
                                    label={label}
                                    checked={Boolean(tab[capability])}
                                    onChange={(event) => formik.setFieldValue(`tabs.${index}.${capability}`, event.target.checked)}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Col>
              </>
            )}
          </Row>
        </Card.Body>
        <Card.Footer className="d-flex justify-content-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={formik.isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={formik.isSubmitting}>
            {formik.isSubmitting ? 'Saving...' : initial ? 'Save changes' : 'Create'}
          </Button>
        </Card.Footer>
      </Form>
    </Card>
  )
}

export default MenuForm
