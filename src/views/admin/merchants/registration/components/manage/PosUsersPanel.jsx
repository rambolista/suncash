import { useEffect, useState } from 'react'
import { Badge, Button, Col, Form, Row, Spinner, Table } from 'react-bootstrap'
import Icon from '@/components/wrappers/Icon'
import ApiService from '@/services/ApiService'
import { useNotificationContext } from '@/context/useNotificationContext'

const emptyUser = { first_name: '', last_name: '', username: '', password: '', branch_id: '', branch_user_type_id: 2, application_access: 'retail', all_access_branch: false }

const PosUsersPanel = ({ merchant, editable }) => {
  const { showNotification } = useNotificationContext()
  const [users, setUsers] = useState([])
  const [branches, setBranches] = useState([])
  const [branchUserTypes, setBranchUserTypes] = useState({})
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [values, setValues] = useState(emptyUser)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    if (!merchant) return
    setLoading(true)
    ApiService.getMerchantPosUsers(merchant.id)
      .then((data) => {
        setUsers(Array.isArray(data?.users) ? data.users : [])
        setBranches(Array.isArray(data?.branches) ? data.branches : [])
        setBranchUserTypes(data?.branch_user_types || {})
      })
      .catch((err) => showNotification({ title: 'Failed', message: err?.message || 'Failed to load POS users.', variant: 'danger' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setShowForm(false)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchant])

  const openAdd = () => {
    setEditingId(null)
    setValues(emptyUser)
    setErrors({})
    setShowForm(true)
  }

  const openEdit = (user) => {
    setEditingId(user.id)
    setValues({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      username: user.username || '',
      password: '',
      branch_id: user.branch_id || '',
      branch_user_type_id: user.branch_user_type_id || 2,
      application_access: user.application_access || 'retail',
      all_access_branch: !!user.all_access_branch,
    })
    setErrors({})
    setShowForm(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})
    try {
      if (editingId) {
        await ApiService.updateMerchantPosUser(merchant.id, editingId, values)
      } else {
        await ApiService.addMerchantPosUser(merchant.id, values)
      }
      showNotification({ title: 'Success', message: `POS user ${editingId ? 'updated' : 'added'} successfully.`, variant: 'success' })
      setShowForm(false)
      load()
    } catch (err) {
      setErrors(err?.errors ?? {})
      showNotification({ title: 'Failed', message: err?.message || 'Failed to save POS user.', variant: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (user) => {
    try {
      await ApiService.deleteMerchantPosUser(merchant.id, user.id)
      load()
    } catch (err) {
      showNotification({ title: 'Failed', message: err?.message || 'Failed to remove POS user.', variant: 'danger' })
    }
  }

  if (loading) return <div className="text-center py-4"><Spinner size="sm" /></div>

  if (editable && showForm) {
    return (
      <Form onSubmit={handleSubmit} noValidate>
        <Row className="g-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>First Name <span className="text-danger">*</span></Form.Label>
              <Form.Control value={values.first_name} onChange={(e) => setValues((prev) => ({ ...prev, first_name: e.target.value }))} isInvalid={!!errors.first_name} />
              <Form.Control.Feedback type="invalid">{errors.first_name?.[0]}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Last Name <span className="text-danger">*</span></Form.Label>
              <Form.Control value={values.last_name} onChange={(e) => setValues((prev) => ({ ...prev, last_name: e.target.value }))} isInvalid={!!errors.last_name} />
              <Form.Control.Feedback type="invalid">{errors.last_name?.[0]}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Username <span className="text-danger">*</span></Form.Label>
              <Form.Control value={values.username} onChange={(e) => setValues((prev) => ({ ...prev, username: e.target.value }))} isInvalid={!!errors.username} />
              <Form.Control.Feedback type="invalid">{errors.username?.[0]}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Password {!editingId && <span className="text-danger">*</span>}</Form.Label>
              <Form.Control type="text" value={values.password} placeholder={editingId ? 'Leave blank to keep current' : ''} onChange={(e) => setValues((prev) => ({ ...prev, password: e.target.value }))} isInvalid={!!errors.password} />
              <Form.Control.Feedback type="invalid">{errors.password?.[0]}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Branch</Form.Label>
              <Form.Select value={values.branch_id} onChange={(e) => setValues((prev) => ({ ...prev, branch_id: e.target.value }))}>
                <option value="">Select branch...</option>
                {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.branch_code} — {branch.description}</option>)}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>User Type</Form.Label>
              <Form.Select value={values.branch_user_type_id} onChange={(e) => setValues((prev) => ({ ...prev, branch_user_type_id: Number(e.target.value) }))}>
                {Object.entries(branchUserTypes).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Application Access</Form.Label>
              <Form.Select value={values.application_access} onChange={(e) => setValues((prev) => ({ ...prev, application_access: e.target.value }))}>
                <option value="retail">Retail</option>
                <option value="webpos">Web POS</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6} className="d-flex align-items-end">
            <Form.Check
              type="checkbox" id="pos-user-all-access" label="Allow access to all branches"
              checked={values.all_access_branch}
              onChange={(e) => setValues((prev) => ({ ...prev, all_access_branch: e.target.checked }))}
            />
          </Col>
        </Row>
        <div className="d-flex justify-content-end gap-2 mt-3">
          <Button variant="secondary" size="sm" onClick={() => setShowForm(false)} disabled={submitting}>Cancel</Button>
          <Button variant="primary" size="sm" type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : editingId ? 'Save changes' : 'Add user'}
          </Button>
        </div>
      </Form>
    )
  }

  return (
    <>
      <div className="table-responsive">
        <Table size="sm" className="align-middle mb-2">
          <thead className="thead-sm text-uppercase fs-xxs">
            <tr><th>Name</th><th>Username</th><th>Type</th><th>Status</th>{editable && <th />}</tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.first_name} {user.last_name}</td>
                <td>{user.username}</td>
                <td>{user.branch_user_type}</td>
                <td>
                  <Badge bg={user.status === 'active' ? 'success-subtle' : 'secondary-subtle'} className={user.status === 'active' ? 'text-success' : 'text-secondary'}>
                    {user.status}
                  </Badge>
                </td>
                {editable && (
                  <td className="text-end text-nowrap">
                    <Button variant="light" size="sm" className="me-1" onClick={() => openEdit(user)}><Icon icon="edit" /></Button>
                    <Button variant="light" size="sm" onClick={() => handleDelete(user)}><Icon icon="trash" className="text-danger" /></Button>
                  </td>
                )}
              </tr>
            ))}
            {!users.length && <tr><td colSpan={5} className="text-center text-muted py-3">No POS users yet.</td></tr>}
          </tbody>
        </Table>
      </div>
      {editable && (
        <Button variant="light" size="sm" onClick={openAdd}><Icon icon="plus" className="me-1" /> Add user</Button>
      )}
    </>
  )
}

export default PosUsersPanel
