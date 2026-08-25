import { useEffect, useState } from 'react'
import { Badge, Button, Col, Form, Row, Spinner, Table } from 'react-bootstrap'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const emptyUser = { first_name: '', last_name: '', username: '', password: '', email: '' }

const schema = Yup.object({
  first_name: Yup.string().trim().required('First name is required'),
  last_name: Yup.string().trim().required('Last name is required'),
  username: Yup.string().trim().required('Username is required'),
  password: Yup.string().trim()
    .min(8, 'Password must be at least 8 characters')
    .max(20, 'Password must be at most 20 characters')
    .matches(/[0-9]/, 'Password must include a number')
    .matches(/[A-Z]/, 'Password must include an uppercase letter')
    .required('Password is required'),
  email: Yup.string().trim().email('Enter a valid e-mail address').required('E-mail is required'),
})

const UserManagementPanel = ({ merchant, editable }) => {
  const { showNotification } = useNotificationContext()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const loadUsers = () => {
    if (!merchant) return
    setLoading(true)
    ApiService.getMerchantUsers(merchant.id)
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load users.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setShowForm(false)
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchant])

  const formik = useFormik({
    initialValues: emptyUser,
    validationSchema: schema,
    onSubmit: async (values, { setErrors, setSubmitting, resetForm }) => {
      try {
        await ApiService.addMerchantUser(merchant.id, values)
        showNotification({ title: 'Success', message: 'User added successfully.', variant: 'success' })
        resetForm({ values: emptyUser })
        setShowForm(false)
        loadUsers()
      } catch (err) {
        setErrors(err?.errors ?? {})
        showNotification({ title: 'Failed', message: err?.message || 'Failed to add user.', variant: 'danger' })
      } finally {
        setSubmitting(false)
      }
    },
  })

  const { values: f, errors: e, touched: t } = formik

  return (
    <div>
      {loading ? (
        <div className="text-center py-4"><Spinner size="sm" /></div>
      ) : (
        <div className="table-responsive">
          <Table size="sm" className="align-middle mb-0">
            <thead className="thead-sm text-uppercase fs-xxs">
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>E-mail</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.first_name} {user.last_name}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <Badge bg={user.status === 'active' ? 'success-subtle' : 'danger-subtle'} className={user.status === 'active' ? 'text-success' : 'text-danger'}>
                      {user.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                </tr>
              ))}
              {!users.length && (
                <tr><td colSpan={4} className="text-center text-muted py-3">No portal users yet.</td></tr>
              )}
            </tbody>
          </Table>
        </div>
      )}

      {!editable ? null : showForm ? (
        <Form onSubmit={formik.handleSubmit} noValidate className="border rounded p-3 mt-3">
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>First Name <span className="text-danger">*</span></Form.Label>
                <Form.Control name="first_name" value={f.first_name} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.first_name && !!e.first_name} />
                <Form.Control.Feedback type="invalid">{e.first_name}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Last Name <span className="text-danger">*</span></Form.Label>
                <Form.Control name="last_name" value={f.last_name} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.last_name && !!e.last_name} />
                <Form.Control.Feedback type="invalid">{e.last_name}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Username <span className="text-danger">*</span></Form.Label>
                <Form.Control name="username" value={f.username} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.username && !!e.username} />
                <Form.Control.Feedback type="invalid">{e.username}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Password <span className="text-danger">*</span></Form.Label>
                <Form.Control type="text" name="password" value={f.password} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.password && !!e.password} />
                <Form.Control.Feedback type="invalid">{e.password}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label>E-mail <span className="text-danger">*</span></Form.Label>
                <Form.Control name="email" value={f.email} onChange={formik.handleChange} onBlur={formik.handleBlur} isInvalid={t.email && !!e.email} />
                <Form.Control.Feedback type="invalid">{e.email}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          <div className="d-flex justify-content-end gap-2 mt-3">
            <Button variant="secondary" size="sm" onClick={() => setShowForm(false)} disabled={formik.isSubmitting}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit" disabled={formik.isSubmitting}>
              {formik.isSubmitting ? 'Adding...' : 'Add user'}
            </Button>
          </div>
        </Form>
      ) : (
        <div className="mt-3">
          <Button variant="light" size="sm" onClick={() => setShowForm(true)}>
            <Icon icon="plus" className="me-1" /> Add user
          </Button>
        </div>
      )}
    </div>
  )
}

export default UserManagementPanel
