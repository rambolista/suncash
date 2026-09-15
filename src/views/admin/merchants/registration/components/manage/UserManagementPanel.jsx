import { useEffect, useState } from 'react'
import { Badge, Button, Col, Form, Row, Spinner, Table } from 'react-bootstrap'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import Icon from '@/components/wrappers/Icon'
import ActionButton from '@/views/admin/merchants/components/ActionButton'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const emptyUser = { first_name: '', last_name: '', username: '', password: '', email: '', user_type_id: '' }

const addSchema = Yup.object({
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
  user_type_id: Yup.string().trim().required('Role is required'),
})

const editSchema = Yup.object({
  username: Yup.string().trim().required('Username is required'),
  email: Yup.string().trim().email('Enter a valid e-mail address').required('E-mail is required'),
  status: Yup.string().trim().required(),
})

const UserManagementPanel = ({ merchant, editable }) => {
  const { showNotification } = useNotificationContext()
  const [users, setUsers] = useState([])
  const [userTypes, setUserTypes] = useState({})
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('list') // 'list' | 'add' | 'edit'
  const [editingId, setEditingId] = useState(null)
  const [resettingId, setResettingId] = useState(null)

  const loadUsers = () => {
    if (!merchant) return
    setLoading(true)
    ApiService.getMerchantUsers(merchant.id)
      .then((data) => {
        setUsers(Array.isArray(data?.users) ? data.users : [])
        setUserTypes(data?.user_types || {})
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load users.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setMode('list')
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchant])

  const addFormik = useFormik({
    initialValues: emptyUser,
    validationSchema: addSchema,
    onSubmit: async (values, { setErrors, setSubmitting, resetForm }) => {
      try {
        await ApiService.addMerchantUser(merchant.id, values)
        showNotification({ title: 'Success', message: 'User added successfully.', variant: 'success' })
        resetForm({ values: emptyUser })
        setMode('list')
        loadUsers()
      } catch (err) {
        setErrors(err?.errors ?? {})
        showNotification({ title: 'Failed', message: err?.message || 'Failed to add user.', variant: 'danger' })
      } finally {
        setSubmitting(false)
      }
    },
  })

  const editFormik = useFormik({
    initialValues: { username: '', email: '', status: 'active' },
    validationSchema: editSchema,
    onSubmit: async (values, { setErrors, setSubmitting }) => {
      try {
        await ApiService.updateMerchantUser(merchant.id, editingId, values)
        showNotification({ title: 'Success', message: 'User updated successfully.', variant: 'success' })
        setMode('list')
        setEditingId(null)
        loadUsers()
      } catch (err) {
        setErrors(err?.errors ?? {})
        showNotification({ title: 'Failed', message: err?.message || 'Failed to update user.', variant: 'danger' })
      } finally {
        setSubmitting(false)
      }
    },
  })

  const openAdd = () => {
    addFormik.resetForm({ values: emptyUser })
    setMode('add')
  }

  const openEdit = (user) => {
    setEditingId(user.id)
    editFormik.resetForm({ values: { username: user.username || '', email: user.email || '', status: user.status || 'active' } })
    setMode('edit')
  }

  const handleResetPassword = async (user) => {
    setResettingId(user.id)
    try {
      const result = await ApiService.resetMerchantUserPassword(merchant.id, user.id)
      showNotification({ title: 'Success', message: result?.message || 'Password reset successfully.', variant: 'success' })
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to reset password.', variant: 'danger' })
    } finally {
      setResettingId(null)
    }
  }

  const { values: af, errors: ae, touched: at } = addFormik
  const { values: ef, errors: ee, touched: et } = editFormik

  return (
    <div>
      {loading ? (
        <div className="text-center py-4"><Spinner size="sm" /></div>
      ) : (
        <div className="table-responsive">
          <Table size="sm" className="align-middle mb-0">
            <thead className="thead-sm text-uppercase fs-xxs">
              <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Username</th>
                <th>E-mail</th>
                <th>Role</th>
                <th>Status</th>
                {editable && <th />}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.first_name} {user.last_name}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.user_type || '—'}</td>
                  <td>
                    <Badge bg={user.status === 'active' ? 'success-subtle' : 'danger-subtle'} className={user.status === 'active' ? 'text-success' : 'text-danger'}>
                      {user.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  {editable && (
                    <td className="text-end text-nowrap">
                      <ActionButton label="Edit" icon="edit" onClick={() => openEdit(user)} />
                      <ActionButton
                        label="Reset password"
                        icon="key"
                        disabled={resettingId === user.id}
                        onClick={() => handleResetPassword(user)}
                      />
                    </td>
                  )}
                </tr>
              ))}
              {!users.length && (
                <tr><td colSpan={7} className="text-center text-muted py-3">No portal users yet.</td></tr>
              )}
            </tbody>
          </Table>
        </div>
      )}

      {!editable ? null : mode === 'add' ? (
        <Form onSubmit={addFormik.handleSubmit} noValidate className="border rounded p-3 mt-3">
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>First Name <span className="text-danger">*</span></Form.Label>
                <Form.Control name="first_name" value={af.first_name} onChange={addFormik.handleChange} onBlur={addFormik.handleBlur} isInvalid={at.first_name && !!ae.first_name} />
                <Form.Control.Feedback type="invalid">{ae.first_name}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Last Name <span className="text-danger">*</span></Form.Label>
                <Form.Control name="last_name" value={af.last_name} onChange={addFormik.handleChange} onBlur={addFormik.handleBlur} isInvalid={at.last_name && !!ae.last_name} />
                <Form.Control.Feedback type="invalid">{ae.last_name}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Username <span className="text-danger">*</span></Form.Label>
                <Form.Control name="username" value={af.username} onChange={addFormik.handleChange} onBlur={addFormik.handleBlur} isInvalid={at.username && !!ae.username} />
                <Form.Control.Feedback type="invalid">{ae.username}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Password <span className="text-danger">*</span></Form.Label>
                <Form.Control type="password" name="password" value={af.password} onChange={addFormik.handleChange} onBlur={addFormik.handleBlur} isInvalid={at.password && !!ae.password} autoComplete="new-password" />
                <Form.Control.Feedback type="invalid">{ae.password}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>E-mail <span className="text-danger">*</span></Form.Label>
                <Form.Control name="email" value={af.email} onChange={addFormik.handleChange} onBlur={addFormik.handleBlur} isInvalid={at.email && !!ae.email} />
                <Form.Control.Feedback type="invalid">{ae.email}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Role <span className="text-danger">*</span></Form.Label>
                <Form.Select name="user_type_id" value={af.user_type_id} onChange={addFormik.handleChange} onBlur={addFormik.handleBlur} isInvalid={at.user_type_id && !!ae.user_type_id}>
                  <option value="">Select...</option>
                  {Object.entries(userTypes).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{ae.user_type_id}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          <div className="d-flex justify-content-end gap-2 mt-3">
            <Button variant="secondary" size="sm" onClick={() => setMode('list')} disabled={addFormik.isSubmitting}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit" disabled={addFormik.isSubmitting}>
              {addFormik.isSubmitting ? 'Adding...' : 'Add user'}
            </Button>
          </div>
        </Form>
      ) : mode === 'edit' ? (
        <Form onSubmit={editFormik.handleSubmit} noValidate className="border rounded p-3 mt-3">
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Username <span className="text-danger">*</span></Form.Label>
                <Form.Control name="username" value={ef.username} onChange={editFormik.handleChange} onBlur={editFormik.handleBlur} isInvalid={et.username && !!ee.username} />
                <Form.Control.Feedback type="invalid">{ee.username}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>E-mail <span className="text-danger">*</span></Form.Label>
                <Form.Control name="email" value={ef.email} onChange={editFormik.handleChange} onBlur={editFormik.handleBlur} isInvalid={et.email && !!ee.email} />
                <Form.Control.Feedback type="invalid">{ee.email}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select name="status" value={ef.status} onChange={editFormik.handleChange} onBlur={editFormik.handleBlur}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <div className="d-flex justify-content-end gap-2 mt-3">
            <Button variant="secondary" size="sm" onClick={() => { setMode('list'); setEditingId(null) }} disabled={editFormik.isSubmitting}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit" disabled={editFormik.isSubmitting}>
              {editFormik.isSubmitting ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </Form>
      ) : (
        <div className="mt-3">
          <Button variant="light" size="sm" onClick={openAdd}>
            <Icon icon="plus" className="me-1" /> Add user
          </Button>
        </div>
      )}
    </div>
  )
}

export default UserManagementPanel
