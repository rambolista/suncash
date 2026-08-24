import { registerPlugin } from 'filepond'
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation'
import FilePondPluginImagePreview from 'filepond-plugin-image-preview'
import { useEffect, useMemo, useState } from 'react'
import { Button, Col, Form, Modal, Row } from 'react-bootstrap'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import Select from '@/components/wrappers/Select'
import { FilePond } from 'react-filepond'
import { useNotificationContext } from '@/context/useNotificationContext'

registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview)

const buildSchema = (isEdit) =>
  Yup.object({
    first_name: Yup.string().trim().required('First name is required').max(255),
    middle_name: Yup.string().trim().max(255).nullable(),
    last_name: Yup.string().trim().required('Last name is required').max(255),
    email:    Yup.string().trim().email('Invalid email address').required('Email is required'),
    mobile_number: Yup.string().trim().max(50, 'Maximum 50 characters').nullable(),
    address: Yup.string().trim().max(1000, 'Maximum 1000 characters').nullable(),
    password: isEdit
      ? Yup.string().min(8, 'Minimum 8 characters').nullable()
      : Yup.string().min(8, 'Minimum 8 characters').required('Password is required'),
    role_ids: Yup.array().of(Yup.number()),
    avatar: Yup.mixed().nullable(),
    clear_avatar: Yup.boolean().nullable(),
    status: Yup.string().oneOf(['active', 'inactive', 'suspended']).required('Status is required'),
  })

const empty = {
  first_name: '',
  middle_name: '',
  last_name: '',
  email: '',
  mobile_number: '',
  address: '',
  password: '',
  role_ids: [],
  avatar: null,
  clear_avatar: false,
  status: 'active',
}

const avatarIconLabel = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M5 7h1a2 2 0 0 0 2-2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2"/><path d="M9 13a3 3 0 1 0 6 0a3 3 0 0 0-6 0"/></g></svg>'
const escapeHtmlAttribute = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const avatarIdleLabel = (avatarUrl) => {
  if (!avatarUrl) {
    return avatarIconLabel
  }

  return `
    <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">
      <img
        src="${escapeHtmlAttribute(avatarUrl)}"
        alt="Current avatar"
        style="width:56px;height:56px;border-radius:999px;object-fit:cover;display:block;margin:auto;"
      />
    </div>
  `
}

const UserFormModal = ({ show, onHide, onSave, roles, initial }) => {
  const { showNotification } = useNotificationContext()
  const isEdit = !!initial
  const [avatarFiles, setAvatarFiles] = useState([])

  const formik = useFormik({
    initialValues: empty,
    validationSchema: buildSchema(isEdit),
    enableReinitialize: false,
    onSubmit: async (values, { setErrors, setSubmitting }) => {
      try {
        const payload = new FormData()

        payload.append('first_name', values.first_name)
        payload.append('middle_name', values.middle_name ?? '')
        payload.append('last_name', values.last_name)
        payload.append('email', values.email)
        payload.append('mobile_number', values.mobile_number ?? '')
        payload.append('address', values.address ?? '')
        payload.append('status', values.status)
        payload.append('clear_avatar', values.clear_avatar ? '1' : '0')
        payload.append('role_ids_json', JSON.stringify(values.role_ids ?? []))

        if (values.password) {
          payload.append('password', values.password)
        }

        if (values.avatar) {
          payload.append('avatar', values.avatar)
        }

        await onSave(payload)
        setAvatarFiles([])
        onHide()
      } catch (err) {
        setErrors(err?.errors ?? {})
        showNotification({ title: 'Failed', message: err?.message ?? 'Failed to save user.', variant: 'danger' })
      } finally {
        setSubmitting(false)
      }
    },
  })

  useEffect(() => {
    if (show) {
      setAvatarFiles([])
      formik.resetForm({
        values: initial
          ? {
              first_name: initial.first_name ?? '',
              middle_name: initial.middle_name ?? '',
              last_name: initial.last_name ?? '',
              email: initial.email,
              mobile_number: initial.mobile_number ?? '',
              address: initial.address ?? '',
              password: '',
              role_ids: initial.role_ids ?? [],
              avatar: null,
              clear_avatar: false,
              status: initial.status ?? 'active',
            }
          : { ...empty },
      })

    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, initial])

  const { values: f, errors: e, touched: t } = formik
  const roleOptions = useMemo(
    () => roles.map((role) => ({ value: role.id, label: role.name })),
    [roles]
  )
  const selectedRoleOptions = useMemo(
    () => roleOptions.filter((option) => f.role_ids.some((id) => String(id) === String(option.value))),
    [f.role_ids, roleOptions]
  )

  return (
    <Modal show={show} onHide={onHide} size="lg" backdrop="static" centered>
      <Modal.Header closeButton>
        <Modal.Title>{initial ? 'Edit User' : 'Add User'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={formik.handleSubmit} noValidate>
        <Modal.Body>
          <Row className="g-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label>Profile Picture</Form.Label>
                <div className="avatar-xxl">
                  <FilePond
                    className="filepond filepond-input-circle rounded"
                    files={avatarFiles}
                    allowMultiple={false}
                    maxFiles={1}
                    allowReorder={false}
                    acceptedFileTypes={['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']}
                    stylePanelAspectRatio="1:1"
                    labelIdle={avatarIdleLabel(!avatarFiles.length && !f.clear_avatar ? initial?.avatar_url : null)}
                    onupdatefiles={(fileItems) => {
                      setAvatarFiles(fileItems)
                      formik.setFieldTouched('avatar', true, false)
                      const nextItem = fileItems[0]
                      const nextFile = nextItem?.file
                      const isUploadedFile = typeof File !== 'undefined' && nextFile instanceof File

                      formik.setFieldValue('avatar', isUploadedFile ? nextFile : null)
                      formik.setFieldValue('clear_avatar', !nextItem && !!initial?.avatar_url)
                    }}
                  />
                </div>
                <div className="text-muted small mt-2">
                  Click the image if you want to change your photo.
                </div>
                {initial?.avatar_url && !f.clear_avatar && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    type="button"
                    className="mt-2"
                    onClick={() => {
                      setAvatarFiles([])
                      formik.setFieldValue('avatar', null)
                      formik.setFieldValue('clear_avatar', true)
                    }}
                  >
                    Clear image
                  </Button>
                )}
                {t.avatar && e.avatar && (
                  <div className="text-danger small mt-1">{e.avatar}</div>
                )}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>First Name <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  name="first_name"
                  value={f.first_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  isInvalid={t.first_name && !!e.first_name}
                  placeholder="Jane"
                  autoFocus
                />
                <Form.Control.Feedback type="invalid">{e.first_name}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Middle Name</Form.Label>
                <Form.Control
                  name="middle_name"
                  value={f.middle_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  isInvalid={t.middle_name && !!e.middle_name}
                  placeholder="Middle Name"
                />
                <Form.Control.Feedback type="invalid">{e.middle_name}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Last Name <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  name="last_name"
                  value={f.last_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  isInvalid={t.last_name && !!e.last_name}
                  placeholder="Doe"
                />
                <Form.Control.Feedback type="invalid">{e.last_name}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={f.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  isInvalid={t.email && !!e.email}
                  placeholder="user@example.com"
                />
                <Form.Control.Feedback type="invalid">{e.email}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Mobile Number</Form.Label>
                <Form.Control
                  name="mobile_number"
                  value={f.mobile_number}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  isInvalid={t.mobile_number && !!e.mobile_number}
                  placeholder="09XXXXXXXXX"
                />
                <Form.Control.Feedback type="invalid">{e.mobile_number}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Address</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="address"
                  value={f.address}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  isInvalid={t.address && !!e.address}
                  placeholder="Address"
                />
                <Form.Control.Feedback type="invalid">{e.address}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Status <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="status"
                  value={f.status}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  isInvalid={t.status && !!e.status}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">{e.status}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  Password{' '}
                  {isEdit
                    ? <span className="text-muted small">(leave blank to keep current)</span>
                    : <span className="text-danger">*</span>}
                </Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={f.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  isInvalid={t.password && !!e.password}
                  placeholder="Min 8 characters"
                />
                <Form.Control.Feedback type="invalid">{e.password}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  Roles <span className="text-muted small">(select one or more)</span>
                </Form.Label>
                <Select
                  className="react-select"
                  classNamePrefix="react-select"
                  isMulti
                  options={roleOptions}
                  value={selectedRoleOptions}
                  onChange={(selected) => {
                    const ids = Array.isArray(selected) ? selected.map((option) => option.value) : []
                    formik.setFieldValue('role_ids', ids)
                  }}
                  onBlur={() => formik.setFieldTouched('role_ids', true)}
                  placeholder={roles.length ? 'Select roles...' : 'No roles available. Create roles first.'}
                  isSearchable={true}
                  isDisabled={!roles.length}
                  closeMenuOnSelect={false}
                />
                {t.role_ids && e.role_ids && (
                  <div className="text-danger small mt-1">{e.role_ids}</div>
                )}
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={formik.isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={formik.isSubmitting}>
            {formik.isSubmitting ? 'Saving...' : initial ? 'Save changes' : 'Create user'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default UserFormModal
