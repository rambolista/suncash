import { useEffect } from 'react'
import { Alert, Button, Col, Form, Modal, Row } from 'react-bootstrap'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const emptyValues = {
  user_type: 'kiosk', branch_id: '', first_name: '', last_name: '', username: '', email_address: '', password: '', confirm_password: '',
}

const buildSchema = (isEdit) => Yup.object({
  user_type: Yup.string().oneOf(['kiosk', 'admin']).required(),
  branch_id: Yup.number().when('user_type', {
    is: 'admin',
    then: (s) => s.moreThan(0, 'Please select a kiosk branch.').required('Please select a kiosk branch.'),
    otherwise: (s) => s.min(0).required('Please select a kiosk branch.'),
  }),
  first_name: Yup.string().trim().required('Please enter a first name.'),
  last_name: Yup.string().trim().required('Please enter a last name.'),
  username: Yup.string().trim().required('Please enter a username.'),
  email_address: Yup.string().trim().when('user_type', {
    is: 'admin',
    then: (s) => s.email('Please enter a valid email address.').required('Please enter an email address.'),
    otherwise: (s) => s.required('Please enter an email address.'),
  }),
  password: isEdit ? Yup.string() : Yup.string().when('user_type', {
    is: 'admin',
    then: (s) => s.min(8, 'Password must contain at least 8 characters long, one uppercase letter, one lowercase letter, and one number.')
      .matches(/[A-Z]/, 'Password must contain at least 8 characters long, one uppercase letter, one lowercase letter, and one number.')
      .matches(/[a-z]/, 'Password must contain at least 8 characters long, one uppercase letter, one lowercase letter, and one number.')
      .matches(/[0-9]/, 'Password must contain at least 8 characters long, one uppercase letter, one lowercase letter, and one number.')
      .required('Please enter a password.'),
    otherwise: (s) => s.min(4, 'Password must contain at least 4 characters long.').required('Please enter a password.'),
  }),
  confirm_password: isEdit ? Yup.string() : Yup.string().oneOf([Yup.ref('password')], 'Passwords do not match.').required('Please confirm the password.'),
})

const UserFormModal = ({ show, onHide, user, initialType = 'kiosk', branches, onSaved }) => {
  const { showNotification } = useNotificationContext()
  const isEdit = Boolean(user)

  const formik = useFormik({
    initialValues: emptyValues,
    validationSchema: buildSchema(isEdit),
    onSubmit: async (values, { setSubmitting, setErrors }) => {
      const payload = {
        user_type: values.user_type,
        branch_id: values.branch_id,
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        username: values.username.trim(),
        email_address: values.email_address.trim(),
        ...(isEdit ? {} : { password: values.password, confirm_password: values.confirm_password }),
      }
      try {
        if (isEdit) {
          await ApiService.updateKioskUser(user.user_type.toLowerCase(), user.id, payload)
        } else {
          await ApiService.addKioskUser(payload)
        }
        showNotification({ title: 'Success', message: `Kiosk user has been ${isEdit ? 'updated' : 'added'}.`, variant: 'success' })
        onSaved?.()
        onHide()
      } catch (err) {
        if (err?.errors) {
          setErrors(Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])))
        } else {
          showNotification({ title: 'Failed', message: err?.message || 'Failed to save kiosk user.', variant: 'danger' })
        }
      } finally {
        setSubmitting(false)
      }
    },
  })

  useEffect(() => {
    if (!show) return
    formik.resetForm({
      values: isEdit
        ? {
          user_type: user.user_type.toLowerCase(),
          branch_id: user.branch_id ?? '',
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          username: user.username || '',
          email_address: user.email_address || '',
          password: '',
          confirm_password: '',
        }
        : { ...emptyValues, user_type: initialType },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, user, initialType])

  const { values: v, errors: e, touched: t } = formik

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{isEdit ? 'Edit Kiosk User' : (initialType === 'admin' ? 'Add Kiosk Admin User' : 'Add Kiosk User')}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={formik.handleSubmit} noValidate>
        <Modal.Body>
          {isEdit && v.user_type !== user.user_type.toLowerCase() && (
            <Alert variant="warning" className="py-2 small mb-3">
              Saving will {v.user_type === 'admin' ? 'promote this Kiosk user to an Admin user' : 'demote this Admin user back to a Kiosk user'}.
            </Alert>
          )}
          <Row className="g-3">
            <Col md={12}>
              <Form.Label className="d-block">User Type *</Form.Label>
              <div className="d-flex gap-3">
                <Form.Check
                  type="radio"
                  id="user_type_kiosk"
                  name="user_type"
                  label="Kiosk User"
                  value="kiosk"
                  checked={v.user_type === 'kiosk'}
                  onChange={formik.handleChange}
                />
                <Form.Check
                  type="radio"
                  id="user_type_admin"
                  name="user_type"
                  label="Admin User"
                  value="admin"
                  checked={v.user_type === 'admin'}
                  onChange={formik.handleChange}
                />
              </div>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Kiosk Branch *</Form.Label>
                <Form.Select name="branch_id" value={v.branch_id} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.branch_id && !!e.branch_id}>
                  <option value="">Select...</option>
                  {v.user_type === 'kiosk' && <option value="0">ALL Branches</option>}
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{e.branch_id}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6} />
            <Col md={6}>
              <Form.Group>
                <Form.Label>First Name *</Form.Label>
                <Form.Control name="first_name" value={v.first_name} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.first_name && !!e.first_name} />
                <Form.Control.Feedback type="invalid">{e.first_name}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Last Name *</Form.Label>
                <Form.Control name="last_name" value={v.last_name} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.last_name && !!e.last_name} />
                <Form.Control.Feedback type="invalid">{e.last_name}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Username *</Form.Label>
                <Form.Control name="username" value={v.username} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.username && !!e.username} />
                <Form.Control.Feedback type="invalid">{e.username}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Email Address *</Form.Label>
                <Form.Control name="email_address" value={v.email_address} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.email_address && !!e.email_address} />
                <Form.Control.Feedback type="invalid">{e.email_address}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            {!isEdit && (
              <>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Password *</Form.Label>
                    <Form.Control type="password" name="password" value={v.password} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.password && !!e.password} />
                    <Form.Control.Feedback type="invalid">{e.password}</Form.Control.Feedback>
                    <Form.Text className="text-muted">
                      {v.user_type === 'admin' ? 'At least 8 characters, with upper, lower, and a number.' : 'At least 4 characters.'}
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Confirm Password *</Form.Label>
                    <Form.Control type="password" name="confirm_password" value={v.confirm_password} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.confirm_password && !!e.confirm_password} />
                    <Form.Control.Feedback type="invalid">{e.confirm_password}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </>
            )}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={formik.isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={formik.isSubmitting}>
            {formik.isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add User'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default UserFormModal
