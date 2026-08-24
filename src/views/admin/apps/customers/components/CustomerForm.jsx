import { registerPlugin } from 'filepond'
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation'
import FilePondPluginImagePreview from 'filepond-plugin-image-preview'
import { useEffect, useState } from 'react'
import { Button, Card, Col, Form, Row } from 'react-bootstrap'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { FilePond } from 'react-filepond'
import { useNotificationContext } from '@/context/useNotificationContext'

registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview)

const buildSchema = (isEdit) =>
  Yup.object({
    account_number: Yup.string().trim().max(50).nullable(),
    first_name: Yup.string().trim().required('First name is required').max(255),
    middle_name: Yup.string().trim().max(255).nullable(),
    last_name: Yup.string().trim().required('Last name is required').max(255),
    email: Yup.string().trim().email('Invalid email address').required('Email is required'),
    mobile_number: Yup.string().trim().max(50, 'Maximum 50 characters').nullable(),
    address: Yup.string().trim().max(1000, 'Maximum 1000 characters').nullable(),
    password: isEdit
      ? Yup.string().min(8, 'Minimum 8 characters').nullable()
      : Yup.string().min(8, 'Minimum 8 characters').required('Password is required'),
    avatar: Yup.mixed().nullable(),
    clear_avatar: Yup.boolean().nullable(),
    status: Yup.string().oneOf(['active', 'inactive', 'suspended']).required('Status is required'),
  })

const empty = {
  account_number: '',
  first_name: '',
  middle_name: '',
  last_name: '',
  email: '',
  mobile_number: '',
  address: '',
  password: '',
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
  if (!avatarUrl) return avatarIconLabel

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

const CustomerForm = ({ onCancel, onSave, initial }) => {
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

        payload.append('account_number', values.account_number ?? '')
        payload.append('first_name', values.first_name)
        payload.append('middle_name', values.middle_name ?? '')
        payload.append('last_name', values.last_name)
        payload.append('email', values.email)
        payload.append('mobile_number', values.mobile_number ?? '')
        payload.append('address', values.address ?? '')
        payload.append('status', values.status)
        payload.append('clear_avatar', values.clear_avatar ? '1' : '0')

        if (values.password) {
          payload.append('password', values.password)
        }

        if (values.avatar) {
          payload.append('avatar', values.avatar)
        }

        await onSave(payload)
        setAvatarFiles([])
      } catch (err) {
        setErrors(err?.errors ?? {})
        showNotification({ title: 'Failed', message: err?.message ?? 'Failed to save customer.', variant: 'danger' })
      } finally {
        setSubmitting(false)
      }
    },
  })

  useEffect(() => {
    setAvatarFiles([])
    formik.resetForm({
      values: initial
        ? {
            account_number: initial.account_number ?? '',
            first_name: initial.first_name ?? '',
            middle_name: initial.middle_name ?? '',
            last_name: initial.last_name ?? '',
            email: initial.email ?? '',
            mobile_number: initial.mobile_number ?? '',
            address: initial.address ?? '',
            password: '',
            avatar: null,
            clear_avatar: false,
            status: initial.status ?? 'active',
          }
        : { ...empty },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial])

  const { values: f, errors: e, touched: t } = formik

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">{initial ? 'Edit Customer' : 'Add Customer'}</h5>
      </Card.Header>
      <Form onSubmit={formik.handleSubmit} noValidate>
        <Card.Body>
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
                <Form.Label>Account Number</Form.Label>
                <Form.Control
                  name="account_number"
                  value={f.account_number}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  isInvalid={t.account_number && !!e.account_number}
                  placeholder="Optional; auto-generated if blank"
                />
                <Form.Control.Feedback type="invalid">{e.account_number}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Status <span className="text-danger">*</span></Form.Label>
                <Form.Select name="status" value={f.status} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.status && !!e.status}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">{e.status}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>First Name <span className="text-danger">*</span></Form.Label>
                <Form.Control name="first_name" value={f.first_name} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.first_name && !!e.first_name} placeholder="Jane" />
                <Form.Control.Feedback type="invalid">{e.first_name}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Middle Name</Form.Label>
                <Form.Control name="middle_name" value={f.middle_name} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.middle_name && !!e.middle_name} placeholder="Middle Name" />
                <Form.Control.Feedback type="invalid">{e.middle_name}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Last Name <span className="text-danger">*</span></Form.Label>
                <Form.Control name="last_name" value={f.last_name} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.last_name && !!e.last_name} placeholder="Doe" />
                <Form.Control.Feedback type="invalid">{e.last_name}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                <Form.Control type="email" name="email" value={f.email} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.email && !!e.email} placeholder="customer@example.com" />
                <Form.Control.Feedback type="invalid">{e.email}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Mobile Number</Form.Label>
                <Form.Control name="mobile_number" value={f.mobile_number} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.mobile_number && !!e.mobile_number} placeholder="09XXXXXXXXX" />
                <Form.Control.Feedback type="invalid">{e.mobile_number}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Address</Form.Label>
                <Form.Control as="textarea" rows={3} name="address" value={f.address} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.address && !!e.address} placeholder="Address" />
                <Form.Control.Feedback type="invalid">{e.address}</Form.Control.Feedback>
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
                <Form.Control type="password" name="password" value={f.password} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.password && !!e.password} placeholder="Minimum 8 characters" />
                <Form.Control.Feedback type="invalid">{e.password}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
        <Card.Footer className="d-flex justify-content-end gap-2">
          <Button variant="light" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={formik.isSubmitting}>{formik.isSubmitting ? 'Saving...' : 'Save changes'}</Button>
        </Card.Footer>
      </Form>
    </Card>
  )
}

export default CustomerForm
